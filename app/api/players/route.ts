import {
  ensureCacheReady,
  getRanking3pGeneralActivos,
  getRanking3pGeneralTodos,
  getRanking3pTemporadaActivos,
  getRanking3pTemporadaTodos,
  getRanking4pGeneralActivos,
  getRanking4pGeneralTodos,
  getRanking4pTemporadaActivos,
  getRanking4pTemporadaTodos,
  isCacheReady,
} from '@/lib/cache/core-cache';
import { getPlayersWithRanking } from '@/lib/database/queries/players-optimized';
import { runWithRequestContextAsync } from '@/lib/request-context.server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Extraer parámetros de la URL
    const seasonId = searchParams.get('season_id');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const type = (searchParams.get('type') as 'GENERAL' | 'TEMPORADA') || 'GENERAL';
    const sanma = searchParams.get('sanma') === 'true';

    // Intentar obtener del cache primero
    try {
      // Asegurar que el cache esté listo
      await ensureCacheReady();

      if (isCacheReady()) {
        const cacheKey = `${sanma ? '3p' : '4p'}_${type.toLowerCase()}_${includeInactive ? 'todos' : 'activos'}`;

        // Llamar a la función específica según el cacheKey
        let players;
        if (cacheKey === '4p_general_activos') {
          players = getRanking4pGeneralActivos();
        } else if (cacheKey === '4p_general_todos') {
          players = getRanking4pGeneralTodos();
        } else if (cacheKey === '4p_temporada_activos') {
          players = getRanking4pTemporadaActivos();
        } else if (cacheKey === '4p_temporada_todos') {
          players = getRanking4pTemporadaTodos();
        } else if (cacheKey === '3p_general_activos') {
          players = getRanking3pGeneralActivos();
        } else if (cacheKey === '3p_general_todos') {
          players = getRanking3pGeneralTodos();
        } else if (cacheKey === '3p_temporada_activos') {
          players = getRanking3pTemporadaActivos();
        } else if (cacheKey === '3p_temporada_todos') {
          players = getRanking3pTemporadaTodos();
        }

        if (players && players.length > 0) {
          console.log(`📦 GET /api/players - Datos obtenidos del CACHE (${cacheKey}): ${players.length} jugadores`);
          return NextResponse.json({
            success: true,
            data: players,
            source: 'cache'
          });
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Cache no disponible, usando DB:', cacheError);
    }

    // Si no hay cache, ir a la DB
    console.log('🔍 GET /api/players - Cache miss, consultando DB...');
    const players = await runWithRequestContextAsync({ includeDeleted: false }, async () => {
      const result = await getPlayersWithRanking(
        seasonId ? parseInt(seasonId) : undefined,
        type,
        includeInactive,
        sanma
      );
      return result;
    });

    console.log(`✅ GET /api/players - Datos obtenidos de la DB: ${players.length} jugadores`);

    return NextResponse.json({
      success: true,
      data: players,
      source: 'database'
    });

  } catch (error) {
    console.error('❌ Error en GET /api/players:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}