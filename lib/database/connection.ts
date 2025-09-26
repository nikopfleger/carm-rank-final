// lib/database/connection.ts
import { PrismaClient } from '@prisma/client';
import 'server-only';
import { getPrismaConfig, logConnectionInfo } from './connection-config';

// Evitar múltiples instancias en dev (HMR): cachear en globalThis
declare global {
    // eslint-disable-next-line no-var
    var __prismaSingleton: PrismaClient | undefined;
}

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
    // Reutilizar entre reloads de Next en desarrollo
    if (process.env.NODE_ENV !== 'production') {
        if (globalThis.__prismaSingleton) return globalThis.__prismaSingleton;

        const cfg = getPrismaConfig();
        if (cfg.directUrl) process.env.POSTGRES_URL_NON_POOLING = cfg.directUrl;
        if (process.env.NODE_ENV === 'development') logConnectionInfo();

        globalThis.__prismaSingleton = new PrismaClient({
            datasources: { db: { url: cfg.url } },
            log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
        });
        return globalThis.__prismaSingleton;
    }

    // Producción: singleton del módulo
    if (prismaInstance) return prismaInstance;

    const cfg = getPrismaConfig();
    if (cfg.directUrl) process.env.POSTGRES_URL_NON_POOLING = cfg.directUrl;
    prismaInstance = new PrismaClient({
        datasources: { db: { url: cfg.url } },
        log: ['error'],
    });
    return prismaInstance;
}
