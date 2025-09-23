import { PrismaClient } from '@prisma/client';

// Singleton pattern para evitar múltiples instancias de PrismaClient
// Neon maneja el pooling automáticamente con PgBouncer
let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
    if (!prismaInstance) {
        prismaInstance = new PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
            // Neon PostgreSQL maneja el pooling automáticamente
            // No necesitamos configurar parámetros de pool adicionales
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
