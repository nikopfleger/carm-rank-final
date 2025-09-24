import { ensureCacheReady, getCacheStatus, getColors, getDan, getRanking3pGeneralActivos, getRanking3pGeneralTodos, getRanking3pTemporadaActivos, getRanking3pTemporadaTodos, getRanking4pGeneralActivos, getRanking4pGeneralTodos, getRanking4pTemporadaActivos, getRanking4pTemporadaTodos, getRate, getSeasons } from '@/lib/cache/core-cache';
import { NextResponse } from 'next/server';

;

export async function GET() {
    try {
        await ensureCacheReady();

        const dan = getDan();
        const rate = getRate();
        const seasons = getSeasons();
        const colors = getColors();
        const ranking_4p_general_activos = getRanking4pGeneralActivos();
        const ranking_4p_general_todos = getRanking4pGeneralTodos();
        const ranking_4p_temporada_activos = getRanking4pTemporadaActivos();
        const ranking_4p_temporada_todos = getRanking4pTemporadaTodos();
        const ranking_3p_general_activos = getRanking3pGeneralActivos();
        const ranking_3p_general_todos = getRanking3pGeneralTodos();
        const ranking_3p_temporada_activos = getRanking3pTemporadaActivos();
        const ranking_3p_temporada_todos = getRanking3pTemporadaTodos();
        const status = getCacheStatus();

        return NextResponse.json({
            success: true,
            data: {
                dan,
                rate,
                seasons,
                colors,
                ranking_4p_general_activos,
                ranking_4p_general_todos,
                ranking_4p_temporada_activos,
                ranking_4p_temporada_todos,
                ranking_3p_general_activos,
                ranking_3p_general_todos,
                ranking_3p_temporada_activos,
                ranking_3p_temporada_todos
            },
            status,
            message: 'Configurations retrieved from cache'
        }, {
            headers: {
                // 1 hora fresco + SWR un día
                "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400"
            }
        });

    } catch (error) {
        console.error('Error in GET /api/config/cache:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch configurations',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
