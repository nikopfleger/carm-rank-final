import { PrismaClient } from '@prisma/client';

// Función para obtener información de auditoría del contexto
function getAuditInfo() {
  // En un contexto real, esto vendría del request/context
  // Por ahora, usamos valores por defecto
  return {
    userId: 'system', // TODO: Obtener del contexto de autenticación
    userIp: '127.0.0.1', // TODO: Obtener del request
  };
}

// Lista de modelos que tienen versionado y soft delete
const MODELS_WITH_VERSIONING = [
  'Country', 'Player', 'Uma', 'Ruleset', 'Season', 'Location',
  'Tournament', 'TournamentResult', 'OnlineUser', 'Game', 'GameResult',
  'Points', 'PlayerRanking', 'UserPlayerLink', 'UserPlayerLinkRequest',
  'PendingGame', 'DanConfig', 'RateConfig', 'SeasonConfig', 'SeasonResult'
] as const;

// Función para incluir registros eliminados (para admin)
export function includeDeleted(where: any = {}) {
  return {
    ...where,
    deleted: undefined, // Remover el filtro de deleted
  };
}

// Función para obtener solo registros eliminados
export function onlyDeleted(where: any = {}) {
  return {
    ...where,
    deleted: true,
  };
}

// Extensión de Prisma Client para manejar versionado y soft delete
export function createVersionedPrismaClient(prisma: PrismaClient) {
  return prisma.$extends({
    query: {
      // Aplicar a todos los modelos con versionado
      ...MODELS_WITH_VERSIONING.reduce((acc, model) => {
        const modelName = model.toLowerCase() as keyof typeof prisma;

        acc[modelName] = {
          // CREATE - Agregar version, deleted, timestamps y auditoría
          async create({ args, query }: any) {
            const now = new Date();
            const auditInfo = getAuditInfo();
            args.data = {
              ...args.data,
              version: 0,
              deleted: false,
              createdAt: now,
              createdBy: auditInfo.userId,
              createdIp: auditInfo.userIp,
              updatedAt: now,
              updatedBy: auditInfo.userId,
              updatedIp: auditInfo.userIp,
            };
            return query(args);
          },

          // UPDATE - Incrementar versión y actualizar timestamp y auditoría
          async update({ args, query }: any) {
            const now = new Date();
            const auditInfo = getAuditInfo();
            args.data = {
              ...args.data,
              updatedAt: now,
              updatedBy: auditInfo.userId,
              updatedIp: auditInfo.userIp,
              // Incrementar versión solo si no es un soft delete
              ...(args.data.deleted !== true && { version: { increment: 1 } }),
            };
            return query(args);
          },

          // UPDATE MANY - Incrementar versión y actualizar timestamp y auditoría
          async updateMany({ args, query }: any) {
            const now = new Date();
            const auditInfo = getAuditInfo();
            args.data = {
              ...args.data,
              updatedAt: now,
              updatedBy: auditInfo.userId,
              updatedIp: auditInfo.userIp,
              ...(args.data.deleted !== true && { version: { increment: 1 } }),
            };
            return query(args);
          },

          // UPSERT - Manejar create y update con auditoría
          async upsert({ args, query }: any) {
            const now = new Date();
            const auditInfo = getAuditInfo();

            // Para create
            args.create = {
              ...args.create,
              version: 0,
              deleted: false,
              createdAt: now,
              createdBy: auditInfo.userId,
              createdIp: auditInfo.userIp,
              updatedAt: now,
              updatedBy: auditInfo.userId,
              updatedIp: auditInfo.userIp,
            };

            // Para update
            args.update = {
              ...args.update,
              updatedAt: now,
              updatedBy: auditInfo.userId,
              updatedIp: auditInfo.userIp,
              ...(args.update.deleted !== true && { version: { increment: 1 } }),
            };

            return query(args);
          },

          // DELETE - Convertir a soft delete con auditoría
          async delete({ args, query }: any) {
            const now = new Date();
            const auditInfo = getAuditInfo();
            return query({
              ...args,
              action: 'update',
              args: {
                where: args.where,
                data: {
                  deleted: true,
                  updatedAt: now,
                  updatedBy: auditInfo.userId,
                  updatedIp: auditInfo.userIp,
                  version: { increment: 1 },
                },
              },
            });
          },

          // DELETE MANY - Convertir a soft delete con auditoría
          async deleteMany({ args, query }: any) {
            const now = new Date();
            const auditInfo = getAuditInfo();
            return query({
              ...args,
              action: 'updateMany',
              args: {
                where: args.where,
                data: {
                  deleted: true,
                  updatedAt: now,
                  updatedBy: auditInfo.userId,
                  updatedIp: auditInfo.userIp,
                  version: { increment: 1 },
                },
              },
            });
          },

          // FIND MANY - Filtrar eliminados
          async findMany({ args, query }: any) {
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

          // FIND FIRST - Filtrar eliminados
          async findFirst({ args, query }: any) {
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

          // FIND UNIQUE - Filtrar eliminados
          async findUnique({ args, query }: any) {
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

          // COUNT - Filtrar eliminados
          async count({ args, query }: any) {
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
        };

        return acc;
      }, {} as any),
    },
  });
}
