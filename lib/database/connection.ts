// lib/database/connection.ts
import { PrismaClient } from '@prisma/client';
import 'server-only';
import { getPrismaConfig, logConnectionInfo } from './connection-config';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
    if (prismaInstance) return prismaInstance;

    const cfg = getPrismaConfig();
    if (cfg.directUrl) process.env.POSTGRES_URL_NON_POOLING = cfg.directUrl;

    if (process.env.NODE_ENV === 'development') logConnectionInfo();

    prismaInstance = new PrismaClient({
        datasources: { db: { url: cfg.url } },
        log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    });
    return prismaInstance;
}
