import { PrismaClient } from '@prisma/client';
import { getPrismaConfig, logConnectionInfo } from './connection-config';

// Singleton pattern para evitar múltiples instancias de PrismaClient
let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
    if (!prismaInstance) {
        const config = getPrismaConfig();

        // Log de información de conexión para debugging
        if (process.env.NODE_ENV === 'development') {
            logConnectionInfo();
        }

        prismaInstance = new PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
            datasources: {
                db: {
                    url: config.url,
                },
            },
        });
    }
    return prismaInstance;
}

// Función para limpiar conexiones (solo en desarrollo)
export async function cleanupPrisma(): Promise<void> {
    if (prismaInstance && process.env.NODE_ENV !== 'production') {
        await prismaInstance.$disconnect();
        prismaInstance = null;
    }
}

// Función interna para verificar conexión (no exportar para evitar ciclos)
async function testConnection(): Promise<boolean> {
    try {
        const prisma = getPrismaClient();
        await prisma.$queryRaw`SELECT 1 as test`;
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
    }
}
