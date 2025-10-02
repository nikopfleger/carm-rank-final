// lib/database/audit-interceptor.ts
import { getRequestContext } from '@/lib/request-context.server';
import type { PrismaClient } from '@prisma/client';
import { handleConcurrencyError } from './concurrency-handler';

const EXCLUDED_MODELS = ['Account', 'Session', 'VerificationToken'];
const CONFIG_MODELS = ['DanConfig', 'RateConfig', 'Season'];
const RANKING_MODELS = ['PlayerRanking', 'Game', 'GameResult', 'TournamentResult', 'Points'];

let pending = { configs: false, ranking: false };
let flushing = false;
let debounceTimer: NodeJS.Timeout | null = null;

let cacheFnsPromise: Promise<{ invalidateConfigs: () => Promise<void>; invalidateRanking: () => Promise<void> }> | null = null;
function getCacheFns() {
    if (!cacheFnsPromise) cacheFnsPromise = import('@/lib/cache/core-cache');
    return cacheFnsPromise;
}
function scheduleInvalidation(model: string) {
    if (CONFIG_MODELS.includes(model)) pending.configs = true;
    if (RANKING_MODELS.includes(model)) pending.ranking = true;
}
function scheduleFlushInvalidations() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { void flushInvalidations(); }, 100);
}
async function flushInvalidations() {
    if (flushing) return;
    flushing = true;
    try {
        const ctx = getRequestContext();
        const runner = async () => {
            while (pending.configs || pending.ranking) {
                const todo = pending;
                pending = { configs: false, ranking: false };
                const { invalidateConfigs, invalidateRanking } = await getCacheFns();
                if (todo.configs) await invalidateConfigs();
                if (todo.ranking) await invalidateRanking();
            }
        };
        try {
            const { runWithRequestContextAsync } = await import('@/lib/request-context.server');
            await runWithRequestContextAsync({ ...ctx, isInvalidation: true }, runner);
        } catch { await runner(); }
    } catch (e) {
        console.error('⚠️ Error auto-invalidando cache:', e);
    } finally { flushing = false; }
}

function delegateOf(model: string, prisma: PrismaClient) {
    const lc = model.charAt(0).toLowerCase() + model.slice(1);
    return (prisma as any)[lc];
}

function normalizeUniqueWhereToFilter(where: any): any {
    if (!where || typeof where !== 'object' || Array.isArray(where)) return where;

    const keys = Object.keys(where);
    if (keys.length === 1) {
        const k = keys[0];
        const v = (where as any)[k];

        // ✅ Aplanar SOLO cuando el nombre de la clave sugiere alias de unique compuesto
        //    (por convención de Prisma, contiene '_': p.ej. playerId_isSanma)
        const looksLikeCompositeAlias =
            typeof v === 'object' && v !== null && !Array.isArray(v) && k.includes('_');

        if (looksLikeCompositeAlias) {
            return { ...v };
        }
    }

    return where;
}


async function getAuditInfo() {
    const ctx = getRequestContext();
    return { userId: ctx?.userId || 'system', userIp: ctx?.userIp || '127.0.0.1', timestamp: new Date() };
}

export function createAuditInterceptor(prisma: PrismaClient) {
    return prisma.$extends({
        query: {
            $allModels: {
                async findUnique({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args); // ✅ mantiene tx
                    }
                    // O bien: no tocar findUnique (no agregar 'deleted' acá); que el caller use findFirst.
                    return query(args); // ✅
                },

                async findFirst({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) return query(args);
                    const ctx = getRequestContext();
                    const where = (args as any).where || {};

                    // NO normalizo acá para no tocar filtros válidos
                    if (!ctx) {
                        if (!Object.prototype.hasOwnProperty.call(where, 'deleted')) {
                            (args as any).where = { ...where, deleted: false };
                        }
                    } else if (ctx.includeDeleted) {
                        if (Object.prototype.hasOwnProperty.call(where, 'deleted')) delete (where as any).deleted;
                        (args as any).where = where;
                    } else {
                        if (!Object.prototype.hasOwnProperty.call(where, 'deleted')) {
                            (args as any).where = { ...where, deleted: false };
                        }
                    }
                    return query(args);
                },

                async findMany({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) return query(args);
                    const ctx = getRequestContext();
                    const where = (args as any).where || {};

                    // NO normalizo acá para no tocar filtros válidos
                    if (!ctx) {
                        if (!Object.prototype.hasOwnProperty.call(where, 'deleted')) {
                            (args as any).where = { ...where, deleted: false };
                        }
                    } else if (ctx.includeDeleted) {
                        if (Object.prototype.hasOwnProperty.call(where, 'deleted')) delete (where as any).deleted;
                        (args as any).where = where;
                    } else {
                        if (!Object.prototype.hasOwnProperty.call(where, 'deleted')) {
                            (args as any).where = { ...where, deleted: false };
                        }
                    }
                    return query(args);
                }
                ,

                async create({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) return query(args);
                    const audit = await getAuditInfo();
                    args.data = { ...args.data, version: 0, deleted: false, createdAt: audit.timestamp, createdBy: audit.userId, createdIp: audit.userIp };
                    const result = await query(args);
                    const ctx = getRequestContext();
                    if (!ctx?.isInvalidation) { scheduleInvalidation(model); scheduleFlushInvalidations(); }
                    return result;
                },

                async update({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args); // ✅
                    }
                    return handleConcurrencyError(async () => {
                        const audit = await getAuditInfo();
                        const { where, data } = args as any;

                        const isOnlyId =
                            where && typeof where === 'object' && !Array.isArray(where) &&
                            Object.keys(where).length === 1 && where.id !== undefined;

                        if (!isOnlyId && !('version' in where)) {
                            throw new Error(`[${model}] Falta 'version' en WHERE (no PK).`);
                        }

                        // mutar data y ejecutar LA MISMA operación bajo la tx:
                        (args as any).data = {
                            ...data,
                            version: { increment: 1 },
                            updatedAt: audit.timestamp,
                            updatedBy: audit.userId,
                            updatedIp: audit.userIp,
                        };

                        const res = await query(args); // ✅ sigue en la tx
                        const ctx = getRequestContext();
                        if (!ctx?.isInvalidation) { scheduleInvalidation(model); scheduleFlushInvalidations(); }
                        return res;
                    });
                },

                async updateMany({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) return query(args);
                    return handleConcurrencyError(async () => {
                        const audit = await getAuditInfo();
                        (args as any).data = {
                            ...(args as any).data,
                            updatedAt: audit.timestamp,
                            updatedBy: audit.userId,
                            updatedIp: audit.userIp,
                            ...(!((args as any).data as any).deleted && { version: { increment: 1 } }),
                        };
                        const res = await query(args); // ✅
                        const ctx = getRequestContext();
                        if (!ctx?.isInvalidation) { scheduleInvalidation(model); scheduleFlushInvalidations(); }
                        return res;
                    });
                },

                async upsert({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) return query(args);
                    const audit = await getAuditInfo();
                    const now = audit.timestamp;

                    // inyectar auditoría en create/update SIN cambiar la operación
                    (args as any).create = { ...(args as any).create, version: 0, deleted: false, createdAt: now, createdBy: audit.userId, createdIp: audit.userIp };
                    const upd: any = (args as any).update || {};
                    (args as any).update = {
                        ...upd,
                        updatedAt: now, updatedBy: audit.userId, updatedIp: audit.userIp,
                        ...(!upd.deleted && { version: { increment: 1 } }),
                    };

                    const res = await query(args); // ✅
                    const ctx = getRequestContext();
                    if (!ctx?.isInvalidation) { scheduleInvalidation(model); scheduleFlushInvalidations(); }
                    return res;
                },

                async delete({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) return query(args);
                    // Opción A: bloquear deletes para que los callers usen soft-delete explícito
                    throw new Error(`[${model}] delete bloqueado por auditoría. Usá update { deleted: true } en el servicio.`);
                    // Opción B: si querés permitirlo real: return query(args);
                },

                async deleteMany({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) return query(args);
                    throw new Error(`[${model}] deleteMany bloqueado por auditoría. Usá updateMany { deleted: true } en el servicio.`);
                },

                async count({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) return query(args);
                    const ctx = getRequestContext();
                    const where = (args as any).where || {};
                    if (!ctx) {
                        if (!Object.prototype.hasOwnProperty.call(where, 'deleted')) (args as any).where = { ...where, deleted: false };
                    } else if (ctx.includeDeleted) {
                        if (Object.prototype.hasOwnProperty.call(where, 'deleted')) delete where.deleted;
                    } else {
                        if (!Object.prototype.hasOwnProperty.call(where, 'deleted')) (args as any).where = { ...where, deleted: false };
                    }
                    return query(args);
                },
            },
        },
    });
}
