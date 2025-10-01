import { ensureCacheReady, getSeasons, getSeasonsDirect } from '@/lib/cache/core-cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sanma = searchParams.get('sanma') === 'true';
        const name = searchParams.get('name');
        const seasonId = searchParams.get('seasonId');

        let data;

        await ensureCacheReady();

        let seasons: any[];
        try {
            // Intentar usar cache (Redis)
            seasons = getSeasons();
            console.log('✅ getSeasons: Datos obtenidos del CACHE (Redis)');
        } catch (error) {
            // Si falla, ir directo a DB
            seasons = await getSeasonsDirect();
            console.log('📊 getSeasons: Datos obtenidos de DB (Redis no disponible)');
        }

        if (name) {
            // Obtener temporada específica por nombre
            data = seasons.find(season => season.name === name);
        } else if (seasonId) {
            // Obtener temporada específica por ID
            const seasonIdNum = parseInt(seasonId);
            data = seasons.find(season => season.id === seasonIdNum);
        } else {
            // Obtener todas las temporadas
            data = seasons;
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
