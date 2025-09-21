import { configCache } from '@/lib/config-cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sanma = searchParams.get('sanma') === 'true';
        const name = searchParams.get('name');
        const seasonId = searchParams.get('seasonId');

        let data;

        if (name) {
            // Obtener configuración específica por nombre
            const seasonIdNum = seasonId ? parseInt(seasonId) : null;
            data = configCache.getSeasonConfig(name, sanma, seasonIdNum);
        } else if (seasonId) {
            // Obtener configuración para temporada específica
            const seasonIdNum = parseInt(seasonId);
            data = configCache.getSeasonConfigForSeason(sanma, seasonIdNum);
        } else {
            // Obtener todas las configuraciones o la default
            data = sanma !== null
                ? configCache.getAllSeasonConfigs(sanma)
                : configCache.getAllSeasonConfigs();
        }

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Error getting SEASON configs:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to get SEASON configurations'
            },
            { status: 500 }
        );
    }
}
