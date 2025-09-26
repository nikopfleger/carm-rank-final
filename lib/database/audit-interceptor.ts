import { getRequestContext } from '@/lib/request-context.server';
import type { PrismaClient } from '@prisma/client';
import { handleConcurrencyError } from './concurrency-handler';

// Modelos que NO deben tener auditoría (OAuth de NextAuth)
// Account, Session, VerificationToken no tienen campos de auditoría
// User sí tiene campos de auditoría pero se maneja por NextAuth
const EXCLUDED_MODELS = ['Account', 'Session', 'VerificationToken'];

// Helper: acceder al delegate dinámico del modelo
function delegateOf(model: string, prisma: PrismaClient) {
    const lc = model.charAt(0).toLowerCase() + model.slice(1);
    return (prisma as any)[lc];
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
                    return d.findFirst({
                        where: { ...where, deleted: false },
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
                    if (ctx?.includeDeleted) {
                        // eliminar cualquier filtro residual de deleted
                        if (Object.prototype.hasOwnProperty.call(where, 'deleted')) delete (where as any).deleted;
                        (args as any).where = where;
                    } else {
                        (args as any).where = { ...where, deleted: false };
                    }

                    return query(args);
                },

                async findMany({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    // Agregar filtro deleted solo si el contexto NO pide includeDeleted
                    const ctx = getRequestContext();
                    const where = (args as any).where || {};
                    if (ctx?.includeDeleted) {
                        if (Object.prototype.hasOwnProperty.call(where, 'deleted')) delete (where as any).deleted;
                        (args as any).where = where;
                    } else {
                        (args as any).where = { ...where, deleted: false };
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

                    return query(args);
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
                            throw new Error(`[${model}] Falta 'version' en WHERE para optimistic locking. Debe incluir la versión esperada del registro.`);
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
                            }
                        });

                        if (res.count === 0) {
                            // Conflict: nadie matcheó id+version
                            const current = await d.findFirst({
                                where: { id: where.id },
                                select: { id: true, version: true, updatedAt: true },
                            });

                            const err: any = new Error("OPTIMISTIC_LOCK");
                            err.code = "OPTIMISTIC_LOCK";
                            err.meta = { current };
                            throw err;
                        }

                        // Devolver el registro actualizado (sin version en where para obtener el actualizado)
                        return d.findFirst({
                            where: { id: where.id }
                        });
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

                        return query(args);
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

                        // upsert manual para poder chequear versión
                        const existing = await d.findFirst({ where: (args as any).where });

                        if (!existing) {
                            return d.create({ data: { ...(args as any).create, ...createAudit } });
                        }

                        if (expectedVersion != null && existing.version !== expectedVersion) {
                            const err: any = new Error("OPTIMISTIC_LOCK");
                            err.code = "OPTIMISTIC_LOCK";
                            err.meta = { current: { id: existing.id, version: existing.version, updatedAt: existing.updatedAt } };
                            throw err;
                        }

                        // update con versión OK
                        await d.updateMany({
                            where: { ...(args as any).where, ...(expectedVersion != null ? { version: expectedVersion } : {}) },
                            data: { ...upd, ...updateAudit },
                        });

                        return d.findFirst({ where: (args as any).where });
                    });
                },

                async delete({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    // Convertir delete a soft delete usando update
                    const auditInfo = await getAuditInfo();

                    return (prisma as any)[model.toLowerCase()].update({
                        where: args.where,
                        data: {
                            deleted: true,
                            updatedAt: auditInfo.timestamp,
                            updatedBy: auditInfo.userId,
                            updatedIp: auditInfo.userIp,
                            version: { increment: 1 },
                        },
                    });
                },

                async deleteMany({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    // Convertir deleteMany a soft delete usando updateMany
                    const auditInfo = await getAuditInfo();

                    return (prisma as any)[model.toLowerCase()].updateMany({
                        where: args.where,
                        data: {
                            deleted: true,
                            updatedAt: auditInfo.timestamp,
                            updatedBy: auditInfo.userId,
                            updatedIp: auditInfo.userIp,
                            version: { increment: 1 },
                        },
                    });
                },



                async count({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    const ctx = getRequestContext();
                    if (ctx?.includeDeleted) {
                        const where = (args as any).where || {};
                        if (Object.prototype.hasOwnProperty.call(where, 'deleted')) delete (where as any).deleted;
                        (args as any).where = where;
                    } else {
                        if (!args.where) {
                            args.where = { deleted: false };
                        } else {
                            args.where = { ...args.where, deleted: false } as any;
                        }
                    }

                    return query(args);
                },
            },
        },
    });
}
