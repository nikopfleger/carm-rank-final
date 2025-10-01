import { getCacheStatus } from '@/lib/cache/core-cache';
import { checkDatabaseHealth } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Verificar salud de la base de datos
        const dbHealth = await checkDatabaseHealth();

        // Verificar estado del cache
        const cacheStatus = getCacheStatus();

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            database: dbHealth,
            cache: cacheStatus,
        });
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Health check failed',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
