import { ensureCacheReady, getDan, getDanDirect } from '@/lib/cache/core-cache';
import { serializeBigInt } from '@/lib/serialize-bigint';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sanma = searchParams.get('sanma') === 'true';
        const rank = searchParams.get('rank');
        const points = searchParams.get('points');

        let data: any;

        await ensureCacheReady();

        let danConfigs: any[];
        try {
            // Intentar usar cache (Redis)
            danConfigs = getDan();
            console.log('✅ getDan: Datos obtenidos del CACHE (Redis)');
        } catch (error) {
            // Si falla, ir directo a DB
            danConfigs = await getDanDirect();
            console.log('📊 getDan: Datos obtenidos de DB (Redis no disponible)');
        }

        if (rank) {
            // Obtener configuración específica por rango
            data = danConfigs.find(config => config.rank === rank && config.sanma === sanma);
        } else if (points) {
            // Obtener configuración por puntos
            const pointsNum = parseInt(points);
            data = danConfigs.find(config =>
                config.sanma === sanma &&
                pointsNum >= config.minPoints &&
                (config.maxPoints === null || pointsNum <= config.maxPoints)
            );
        } else {
            // Obtener todas las configuraciones filtradas por sanma
            data = danConfigs.filter(config => config.sanma === sanma);
        }

        // Logging de diagnóstico para verificar qué está devolviendo el cache
        try {
            const items = Array.isArray(data) ? data : (data ? [data] : []);
            // Log compacto: modo, cantidad y primera fila
            console.log('[API][config/dan] sanma=%s count=%d sample=%o', sanma, items.length, items[0] ?? null);
        } catch (logErr) {
            console.warn('[API][config/dan] log error:', logErr);
        }

        return NextResponse.json({
            success: true,
            data: serializeBigInt(data),
        });
    } catch (error) {
        console.error('Error getting DAN configs:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to get DAN configurations'
            },
            { status: 500 }
        );
    }
}
