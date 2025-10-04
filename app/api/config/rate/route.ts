import { ensureCacheReady, getRate, getRateDirect } from '@/lib/cache/core-cache';
import { serializeBigInt } from '@/lib/serialize-bigint';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sanma = searchParams.get('sanma') === 'true';
        const name = searchParams.get('name');

        let data;

        await ensureCacheReady();
        // Cache primero, DB si falla
        let rateConfigs: any[];
        try {
            rateConfigs = getRate();
        } catch (e) {
            rateConfigs = await getRateDirect();
        }

        if (name) {
            // Obtener configuración específica por nombre
            data = rateConfigs.find(config => config.name === name && config.sanma === sanma);
        } else {
            // Obtener todas las configuraciones o la default
            data = sanma !== null
                ? rateConfigs.filter(config => config.sanma === sanma)
                : rateConfigs;
        }

        return NextResponse.json({
            success: true,
            data: serializeBigInt(data),
        });
    } catch (error) {
        console.error('Error getting RATE configs:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to get RATE configurations'
            },
            { status: 500 }
        );
    }
}
