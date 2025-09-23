import { getRequestContext } from '@/lib/request-context';
import { PrismaClient } from '@prisma/client';

// Modelos que NO deben tener auditoría (OAuth de NextAuth)
const EXCLUDED_MODELS = ['Account', 'Session', 'VerificationToken'];

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
            // Interceptar operaciones de escritura para agregar campos de auditoría
            $allModels: {
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
                        updatedAt: auditInfo.timestamp,
                        updatedBy: auditInfo.userId,
                        updatedIp: auditInfo.userIp,
                    };

                    args.data = {
                        ...args.data,
                        ...auditFields,
                    };

                    return query(args);
                },

                async update({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    const auditInfo = await getAuditInfo();
                    const auditFields = {
                        updatedAt: auditInfo.timestamp,
                        updatedBy: auditInfo.userId,
                        updatedIp: auditInfo.userIp,
                        // Solo incrementar versión si no es un soft delete
                        ...(!(args.data as any).deleted && { version: { increment: 1 } }),
                    };

                    args.data = {
                        ...args.data,
                        ...auditFields,
                    };

                    return query(args);
                },

                async updateMany({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

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
                },

                async upsert({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    const auditInfo = await getAuditInfo();
                    const now = auditInfo.timestamp;

                    // Campos para create
                    const createAuditFields = {
                        version: 0,
                        deleted: false,
                        createdAt: now,
                        createdBy: auditInfo.userId,
                        createdIp: auditInfo.userIp,
                        updatedAt: now,
                        updatedBy: auditInfo.userId,
                        updatedIp: auditInfo.userIp,
                    };

                    // Campos para update
                    const updateAuditFields = {
                        updatedAt: now,
                        updatedBy: auditInfo.userId,
                        updatedIp: auditInfo.userIp,
                        ...(!(args.update as any).deleted && { version: { increment: 1 } }),
                    };

                    args.create = {
                        ...args.create,
                        ...createAuditFields,
                    };

                    args.update = {
                        ...args.update,
                        ...updateAuditFields,
                    };

                    return query(args);
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

                // Filtrar registros eliminados en operaciones de lectura
                async findMany({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    if (!args.where) {
                        args.where = { deleted: false };
                    } else {
                        args.where = {
                            ...args.where,
                            deleted: false,
                        };
                    }

                    return query(args);
                },

                async findFirst({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    if (!args.where) {
                        args.where = { deleted: false };
                    } else {
                        args.where = {
                            ...args.where,
                            deleted: false,
                        };
                    }

                    return query(args);
                },

                async findUnique({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    // Para findUnique, agregar deleted: false al AND del where
                    args.where = {
                        ...args.where,
                        deleted: false,
                    };

                    return query(args);
                },

                async count({ args, query, model }) {
                    if (EXCLUDED_MODELS.includes(model)) {
                        return query(args);
                    }

                    if (!args.where) {
                        args.where = { deleted: false };
                    } else {
                        args.where = {
                            ...args.where,
                            deleted: false,
                        };
                    }

                    return query(args);
                },
            },
        },
    });
}
