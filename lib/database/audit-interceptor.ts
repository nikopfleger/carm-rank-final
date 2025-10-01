// lib/database/audit-interceptor.ts
import { getRequestContext } from '@/lib/request-context.server';
import type { PrismaClient } from '@prisma/client';
import { handleConcurrencyError } from './concurrency-handler';

// Modelos que NO deben tener auditoría (OAuth de NextAuth)
const EXCLUDED_MODELS = ['Account', 'Session', 'VerificationToken'];

// Modelos que afectan las configs del cache (Dan, Rate, Season)
const CONFIG_MODELS = ['DanConfig', 'RateConfig', 'Season'];

// Modelos que afectan el ranking del cache
const RANKING_MODELS = ['PlayerRanking', 'Game', 'GameResult', 'TournamentResult', 'Points'];

// Estado global (por proceso)
let pending = { configs: false, ranking: false };
let flushing = false;
let debounceTimer: NodeJS.Timeout | null = null;

// Cachear el import dinámico
let cacheFnsPromise: Promise<{ invalidateConfigs: () => Promise<void>; invalidateRanking: () => Promise<void> }> | null = null;
function getCacheFns() {
    if (!cacheFnsPromise) {
        cacheFnsPromise = import('@/lib/cache/core-cache');
    }
    return cacheFnsPromise;
}

// MARCAR SIEMPRE pendientes (no descartar durante flush)
function scheduleInvalidation(model: string) {
    if (CONFIG_MODELS.includes(model)) pending.configs = true;
    if (RANKING_MODELS.includes(model)) pending.ranking = true;
}

// Debounce + serialización del flush
function scheduleFlushInvalidations() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { void flushInvalidations(); }, 100);
}

async function flushInvalidations() {
    if (flushing) return;        // serializar
    flushing = true;

    try {
        const ctx = getRequestContext();

        const runner = async () => {
            while (pending.configs || pending.ranking) {
                const todo = pending;
                pending = { configs: false, ranking: false };

                const { invalidateConfigs, invalidateRanking } = await getCacheFns();
                if (todo.configs) {
                    console.log('🔄 Auto-invalidando configs del cache...');
                    await invalidateConfigs();
                }
                if (todo.ranking) {
                    console.log('🔄 Auto-invalidando ranking del cache...');
                    await invalidateRanking();
                }
            }
        };

        // Importar dinámicamente para evitar dependencias circulares
        try {
            const { runWithRequestContextAsync } = await import('@/lib/request-context.server');
            // Evita que invalidaciones internas programen más invalidaciones por writes auxiliares
            await runWithRequestContextAsync({ ...ctx, isInvalidation: true }, runner);
        } catch {
            // Fallback: sin contexto, igual no descartamos eventos (el loop los consumirá)
            await runner();
        }
    } catch (e) {
        console.error('⚠️ Error auto-invalidando cache:', e);
    } finally {
        flushing = false;
    }
}

// Helper: acceder al delegate dinámico del modelo
function delegateOf(model: string, prisma: PrismaClient) {
    const lc = model.charAt(0).toLowerCase() + model.slice(1);
    return (prisma as any)[lc];
}

// Normaliza WhereUniqueInput con unique compuesta (p.ej. { playerId_isSanma: { playerId, isSanma } })
// a un filtro plano usable en findFirst/findMany/updateMany: { playerId, isSanma }
function normalizeUniqueWhereToFilter(where: any): any {
    if (!where || typeof where !== 'object' || Array.isArray(where)) return where;

    const keys = Object.keys(where);
    if (keys.length === 1) {
        const k = keys[0];
        const v = (where as any)[k];
        // Heurística: nombres típicos de uniques compuestas incluyen un '_' o son objetos con varias claves escalares
        const isCompositeAlias =
            typeof v === 'object' &&
            v !== null &&
            !Array.isArray(v) &&
            (k.includes('_') || Object.keys(v).length >= 2);

        if (isCompositeAlias) {
            // Retornamos el objeto interno como filtro plano
            return { ...v };
        }
    }

    return where;
}

// Obtener información de auditoría del contexto de la request
async function getAuditInfo() {
    const ctx = getRequestContext();
    return {
        userId: ctx?.userId || 'system',
        userIp: ctx?.userIp || '127.0.0.1',
        timestamp: new Date(),
    };
}

// Interceptor simplificado que solo maneja auditoría en operaciones de escritura
export function createAuditInterceptor(prisma: PrismaClient) {
    return prisma.$extends({
        query: {
            // Interceptar operaciones de lectura y escritura
            $allModels: {
                async findUnique({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        // si es NextAuth, dejá pasar como estaba
                        return delegateOf(model, prisma).findUnique(args);
                    }

                    // findUnique NO permite agregar más campos al where; usamos findFirst
                    const d = delegateOf(model, prisma);
                    const { where, select, include, orderBy, take, skip } = args as any;

                    // ⚠️ Normalizar unique compuesta a filtro plano
                    const normalizedWhere = normalizeUniqueWhereToFilter(where);

                    return d.findFirst({
                        where: { ...normalizedWhere, deleted: false },
                        select,
                        include,
                        orderBy,
                        take,
                        skip,
                    });
                },

                async findFirst({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    // Agregar filtro deleted solo si el contexto NO pide includeDeleted
                    const ctx = getRequestContext();
                    const where = (args as any).where || {};

                    // ⚠️ También normalizamos por si alguien pasó alias de unique por error
                    const normalizedWhere = normalizeUniqueWhereToFilter(where);

                    // Si no hay contexto (ej: cache initialization), usar comportamiento por defecto
                    if (!ctx) {
                        // Solo agregar deleted: false si no está ya especificado
                        if (!Object.prototype.hasOwnProperty.call(normalizedWhere, 'deleted')) {
                            (args as any).where = { ...normalizedWhere, deleted: false };
                        } else {
                            (args as any).where = normalizedWhere;
                        }
                    } else if (ctx.includeDeleted) {
                        if (Object.prototype.hasOwnProperty.call(normalizedWhere, 'deleted')) {
                            delete (normalizedWhere as any).deleted;
                        }
                        (args as any).where = normalizedWhere;
                    } else {
                        // Solo agregar deleted: false si no está ya especificado
                        if (!Object.prototype.hasOwnProperty.call(normalizedWhere, 'deleted')) {
                            (args as any).where = { ...normalizedWhere, deleted: false };
                        } else {
                            (args as any).where = normalizedWhere;
                        }
                    }

                    return query(args);
                },

                async findMany({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    const ctx = getRequestContext();
                    const where = (args as any).where || {};

                    // ⚠️ Normalizamos por si vino un alias compuesto
                    const normalizedWhere = normalizeUniqueWhereToFilter(where);

                    // Si no hay contexto (ej: cache initialization), usar comportamiento por defecto
                    if (!ctx) {
                        // Solo agregar deleted: false si no está ya especificado
                        if (!Object.prototype.hasOwnProperty.call(normalizedWhere, 'deleted')) {
                            (args as any).where = { ...normalizedWhere, deleted: false };
                        } else {
                            (args as any).where = normalizedWhere;
                        }
                    } else if (ctx.includeDeleted) {
                        if (Object.prototype.hasOwnProperty.call(normalizedWhere, 'deleted')) {
                            delete (normalizedWhere as any).deleted;
                        }
                        (args as any).where = normalizedWhere;
                    } else {
                        // Solo agregar deleted: false si no está ya especificado
                        if (!Object.prototype.hasOwnProperty.call(normalizedWhere, 'deleted')) {
                            (args as any).where = { ...normalizedWhere, deleted: false };
                        } else {
                            (args as any).where = normalizedWhere;
                        }
                    }

                    return query(args);
                },

                async create({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    const auditInfo = await getAuditInfo();
                    const auditFields = {
                        version: 0,
                        deleted: false,
                        createdAt: auditInfo.timestamp,
                        createdBy: auditInfo.userId,
                        createdIp: auditInfo.userIp,
                    };

                    args.data = {
                        ...args.data,
                        ...auditFields,
                    };

                    const result = await query(args);

                    // Programar invalidación del cache si corresponde (evitar durante invalidaciones)
                    const ctx = getRequestContext();
                    if (!ctx?.isInvalidation) {
                        await scheduleInvalidation(model);
                        scheduleFlushInvalidations();
                    }

                    return result;
                },

                async update({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        // Para modelos excluidos (NextAuth), pasar directamente sin campos de auditoría
                        return delegateOf(model, prisma).update(args);
                    }

                    return handleConcurrencyError(async () => {
                        const audit = await getAuditInfo();
                        const d = delegateOf(model, prisma);
                        const { where, data } = args as any;

                        // FORZAR optimistic locking: exigir que toda update lleve version en el where
                        if (!('version' in where)) {
                            throw new Error(
                                `[${model}] Falta 'version' en WHERE para optimistic locking. Debe incluir la versión esperada del registro.`
                            );
                        }

                        // Convertir update -> updateMany para poder chequear count
                        const res = await d.updateMany({
                            where,
                            data: {
                                ...data,
                                version: { increment: 1 },
                                updatedAt: audit.timestamp,
                                updatedBy: audit.userId,
                                updatedIp: audit.userIp,
                            },
                        });

                        if (res.count === 0) {
                            // Conflict: nadie matcheó id+version
                            const current = await d.findFirst({
                                where: { id: where.id },
                                select: { id: true, version: true, updatedAt: true },
                            });

                            const err: any = new Error('OPTIMISTIC_LOCK');
                            err.code = 'OPTIMISTIC_LOCK';
                            err.meta = { current };
                            throw err;
                        }

                        // Devolver el registro actualizado (sin version en where para obtener el actualizado)
                        const result = await d.findFirst({
                            where: { id: where.id },
                        });

                        // Programar invalidación del cache si corresponde (evitar durante invalidaciones)
                        const ctx = getRequestContext();
                        if (!ctx?.isInvalidation) {
                            await scheduleInvalidation(model);
                            scheduleFlushInvalidations();
                        }

                        return result;
                    });
                },

                async updateMany({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    return handleConcurrencyError(async () => {
                        const auditInfo = await getAuditInfo();
                        const auditFields = {
                            updatedAt: auditInfo.timestamp,
                            updatedBy: auditInfo.userId,
                            updatedIp: auditInfo.userIp,
                            ...(!(args.data as any).deleted && { version: { increment: 1 } }),
                        };

                        args.data = {
                            ...args.data,
                            ...auditFields,
                        };

                        const result = await query(args);

                        // Programar invalidación del cache si corresponde (evitar durante invalidaciones)
                        const ctx = getRequestContext();
                        if (!ctx?.isInvalidation) {
                            await scheduleInvalidation(model);
                            scheduleFlushInvalidations();
                        }

                        return result;
                    });
                },

                async upsert({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return delegateOf(model, prisma).upsert(args);
                    }

                    return handleConcurrencyError(async () => {
                        const audit = await getAuditInfo();
                        const d = delegateOf(model, prisma);

                        const now = audit.timestamp;

                        // extraemos expectedVersion del update.* y lo quitamos
                        const upd: any = (args as any).update || {};
                        const expectedVersion: number | undefined =
                            upd.__expectedVersion ?? upd.expectedVersion ?? upd.versionExpected;

                        delete upd.__expectedVersion;
                        delete upd.expectedVersion;
                        delete upd.versionExpected;

                        // audit fields
                        const createAudit = {
                            version: 0,
                            deleted: false,
                            createdAt: now,
                            createdBy: audit.userId,
                            createdIp: audit.userIp,
                            // updatedAt NO se llena en creación, solo en actualizaciones
                        };
                        const updateAudit = {
                            updatedAt: now,
                            updatedBy: audit.userId,
                            updatedIp: audit.userIp,
                            ...(!upd.deleted && { version: { increment: 1 } }),
                        };

                        // ⚠️ Normalizar where (porque viene en formato WhereUniqueInput y lo usaremos en findFirst/updateMany)
                        const rawWhere = (args as any).where;
                        const normalizedWhere = normalizeUniqueWhereToFilter(rawWhere);

                        // upsert manual para poder chequear versión
                        const existing = await d.findFirst({
                            where: normalizedWhere,
                        });

                        let result;
                        if (!existing) {
                            result = await d.create({ data: { ...(args as any).create, ...createAudit } });
                        } else {
                            if (expectedVersion != null && existing.version !== expectedVersion) {
                                const err: any = new Error('OPTIMISTIC_LOCK');
                                err.code = 'OPTIMISTIC_LOCK';
                                err.meta = {
                                    current: {
                                        id: existing.id,
                                        version: existing.version,
                                        updatedAt: existing.updatedAt,
                                    },
                                };
                                throw err;
                            }

                            // update con versión OK
                            await d.updateMany({
                                where: {
                                    ...normalizedWhere,
                                    ...(expectedVersion != null ? { version: expectedVersion } : {}),
                                },
                                data: { ...upd, ...updateAudit },
                            });

                            result = await d.findFirst({ where: normalizedWhere });
                        }

                        // Programar invalidación del cache si corresponde (evitar durante invalidaciones)
                        const ctx = getRequestContext();
                        if (!ctx?.isInvalidation) {
                            await scheduleInvalidation(model);
                            scheduleFlushInvalidations();
                        }

                        return result;
                    });
                },

                async delete({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    // Convertir delete a soft delete usando update
                    const auditInfo = await getAuditInfo();

                    const result = await (prisma as any)[model.toLowerCase()].update({
                        where: args.where,
                        data: {
                            deleted: true,
                            updatedAt: auditInfo.timestamp,
                            updatedBy: auditInfo.userId,
                            updatedIp: auditInfo.userIp,
                            version: { increment: 1 },
                        },
                    });

                    // Programar invalidación del cache si corresponde (evitar durante invalidaciones)
                    const ctx = getRequestContext();
                    if (!ctx?.isInvalidation) {
                        await scheduleInvalidation(model);
                        scheduleFlushInvalidations();
                    }

                    return result;
                },

                async deleteMany({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    // Convertir deleteMany a soft delete usando updateMany
                    const auditInfo = await getAuditInfo();

                    const result = await (prisma as any)[model.toLowerCase()].updateMany({
                        where: args.where,
                        data: {
                            deleted: true,
                            updatedAt: auditInfo.timestamp,
                            updatedBy: auditInfo.userId,
                            updatedIp: auditInfo.userIp,
                            version: { increment: 1 },
                        },
                    });

                    // Programar invalidación del cache si corresponde (evitar durante invalidaciones)
                    const ctx = getRequestContext();
                    if (!ctx?.isInvalidation) {
                        await scheduleInvalidation(model);
                        scheduleFlushInvalidations();
                    }

                    return result;
                },

                async count({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    const ctx = getRequestContext();
                    const where = (args as any).where || {};

                    // Si no hay contexto (ej: cache initialization), usar comportamiento por defecto
                    if (!ctx) {
                        // Solo agregar deleted: false si no está ya especificado
                        if (!Object.prototype.hasOwnProperty.call(where, 'deleted')) {
                            (args as any).where = { ...where, deleted: false };
                        }
                    } else if (ctx.includeDeleted) {
                        // No modificar el where si se incluyen eliminados
                        if (Object.prototype.hasOwnProperty.call(where, 'deleted')) {
                            delete where.deleted;
                        }
                    } else {
                        // Solo agregar deleted: false si no está ya especificado
                        if (!Object.prototype.hasOwnProperty.call(where, 'deleted')) {
                            (args as any).where = { ...where, deleted: false };
                        }
                    }

                    return query(args);
                },
            },
        },
    });
}
