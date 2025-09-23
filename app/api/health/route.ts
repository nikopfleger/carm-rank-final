// app/api/health/route.ts
;

import { getCacheStatus } from '@/lib/cache/core-cache';
import { prisma } from '@/lib/database/client';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const dbOk = await prisma.$queryRaw`SELECT 1 as ok`.then(() => true).catch(() => false);
        const cache = getCacheStatus();
        return NextResponse.json({
            ok: dbOk && cache.ready,
            dbOk,
            cache,
            players: cache.playerCount
        });
    } catch (error) {
        return NextResponse.json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
