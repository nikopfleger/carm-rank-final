import { ensureCacheReady, getCacheStatus, getColors, getDan, getDanDirect, getRanking3pGeneralActivos, getRanking3pGeneralTodos, getRanking3pTemporadaActivos, getRanking3pTemporadaTodos, getRanking4pGeneralActivos, getRanking4pGeneralTodos, getRanking4pTemporadaActivos, getRanking4pTemporadaTodos, getRate, getRateDirect, getSeasons, getSeasonsDirect } from '@/lib/cache/core-cache';
import { serializeBigInt } from '@/lib/serialize-bigint';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await ensureCacheReady();
        // Fallback: si la cache no está disponible, ir directo a DB
        let dan;
        try { dan = getDan(); } catch { dan = await getDanDirect(); }
        let rate;
        try { rate = getRate(); } catch { rate = await getRateDirect(); }
        let seasons;
        try { seasons = getSeasons(); } catch { seasons = await getSeasonsDirect(); }
        // Campos de cache opcionales: si fallan no rompemos la respuesta
        let colors: any = {};
        try { colors = getColors(); } catch { }
        let ranking_4p_general_activos: any[] = [];
        let ranking_4p_general_todos: any[] = [];
        let ranking_4p_temporada_activos: any[] = [];
        let ranking_4p_temporada_todos: any[] = [];
        let ranking_3p_general_activos: any[] = [];
        let ranking_3p_general_todos: any[] = [];
        let ranking_3p_temporada_activos: any[] = [];
        let ranking_3p_temporada_todos: any[] = [];
        try {
            ranking_4p_general_activos = getRanking4pGeneralActivos();
            ranking_4p_general_todos = getRanking4pGeneralTodos();
            ranking_4p_temporada_activos = getRanking4pTemporadaActivos();
            ranking_4p_temporada_todos = getRanking4pTemporadaTodos();
            ranking_3p_general_activos = getRanking3pGeneralActivos();
            ranking_3p_general_todos = getRanking3pGeneralTodos();
            ranking_3p_temporada_activos = getRanking3pTemporadaActivos();
            ranking_3p_temporada_todos = getRanking3pTemporadaTodos();
        } catch { }
        let status: any = { enabled: false };
        try { status = getCacheStatus(); } catch { }

        return NextResponse.json(serializeBigInt({
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
            message: 'Configurations retrieved'
        }), {
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
