import { configCache } from '@/lib/config-cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sanma = searchParams.get('sanma') === 'true';
        const name = searchParams.get('name');

        let data;

        if (name) {
            // Obtener configuración específica por nombre
            data = configCache.getRateConfig(name, sanma);
        } else {
            // Obtener todas las configuraciones o la default
            data = sanma !== null
                ? configCache.getAllRateConfigs(sanma)
                : configCache.getAllRateConfigs();
        }

        return NextResponse.json({
            success: true,
            data,
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
