import { configCache } from '@/lib/config-cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sanma = searchParams.get('sanma') === 'true';
        const rank = searchParams.get('rank');
        const points = searchParams.get('points');

        let data: any;

        if (rank) {
            // Obtener configuración específica por rango
            data = await configCache.getDanConfig(rank, sanma);
        } else if (points) {
            // Obtener configuración por puntos
            const pointsNum = parseInt(points);
            data = await configCache.getDanConfigByPoints(pointsNum, sanma);
        } else {
            // Obtener todas las configuraciones
            data = await configCache.getAllDanConfigs(sanma);
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
            data,
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
