import { getCacheStatus, initializeCache } from '@/lib/cache/core-cache';
import { serializeBigInt } from '@/lib/serialize-bigint';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('🔥 Iniciando warm-up manual de cache...');
        const startTime = Date.now();

        await initializeCache();

        const duration = Date.now() - startTime;
        const status = getCacheStatus();

        console.log(`✅ Warm-up completado en ${duration}ms`);

        return NextResponse.json({
            success: true,
            duration,
            status,
            message: `Cache inicializado en ${duration}ms - ${status.playerCount} jugadores`
        });

    } catch (error) {
        console.error('❌ Error en warm-up:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const status = getCacheStatus();
        return NextResponse.json({
            success: true,
            status,
            message: status.ready ? 'Cache lista' : 'Cache no inicializada'
        });

    } catch (error) {
        console.error('❌ Error obteniendo status:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        );
    }
}
