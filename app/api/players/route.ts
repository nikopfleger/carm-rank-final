import { ensureCacheReady, getRanking3pGeneralActivos, getRanking3pGeneralTodos, getRanking3pTemporadaActivos, getRanking3pTemporadaTodos, getRanking4pGeneralActivos, getRanking4pGeneralTodos, getRanking4pTemporadaActivos, getRanking4pTemporadaTodos, invalidateRanking } from '@/lib/cache/core-cache';
import { prisma } from '@/lib/database/client';
import { getPlayersWithRanking } from '@/lib/database/queries/players-optimized';
import { NextRequest, NextResponse } from 'next/server';

async function weakEtag(payload: string): Promise<string> {
  const data = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-1', data);
  const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `W/"${hex}"`;
}

// GET /api/players - Get all players with ranking
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const type = searchParams.get('type') as 'GENERAL' | 'TEMPORADA' || 'GENERAL';
    const sanma = searchParams.get('sanma'); // 'true' o 'false' para filtrar por cantidad de jugadores

    console.log(`📊 [${new Date().toISOString()}] Parámetros: includeInactive=${includeInactive}, type=${type}${seasonId ? `, seasonId=${seasonId}` : ''}${sanma ? `, sanma=${sanma}` : ''}`);

    // Usar caché para obtener rankings precalculados
    await ensureCacheReady();

    let filteredPlayers;
    const isSanma = sanma === 'true';

    if (type === 'GENERAL' && !isSanma && !includeInactive) {
      // 4p General Activos
      filteredPlayers = getRanking4pGeneralActivos();
    } else if (type === 'GENERAL' && !isSanma && includeInactive) {
      // 4p General Todos
      filteredPlayers = getRanking4pGeneralTodos();
    } else if (type === 'TEMPORADA' && !isSanma && !includeInactive) {
      // 4p Temporada Activos
      filteredPlayers = getRanking4pTemporadaActivos();
    } else if (type === 'TEMPORADA' && !isSanma && includeInactive) {
      // 4p Temporada Todos
      filteredPlayers = getRanking4pTemporadaTodos();
    } else if (type === 'GENERAL' && isSanma && !includeInactive) {
      // 3p General Activos
      filteredPlayers = getRanking3pGeneralActivos();
    } else if (type === 'GENERAL' && isSanma && includeInactive) {
      // 3p General Todos
      filteredPlayers = getRanking3pGeneralTodos();
    } else if (type === 'TEMPORADA' && isSanma && !includeInactive) {
      // 3p Temporada Activos
      filteredPlayers = getRanking3pTemporadaActivos();
    } else if (type === 'TEMPORADA' && isSanma && includeInactive) {
      // 3p Temporada Todos
      filteredPlayers = getRanking3pTemporadaTodos();
    } else {
      // Fallback a consulta directa si no coincide con los 8 casos
      console.log('⚠️ Usando fallback a consulta directa');
      filteredPlayers = await getPlayersWithRanking(
        undefined,
        type,
        includeInactive,
        isSanma
      );
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [${new Date().toISOString()}] Completado en ${duration}ms. Jugadores: ${filteredPlayers.length}`);

    // Mapear campos para el frontend (ya vienen calculados desde la consulta optimizada)
    const serializedPlayers = filteredPlayers.map(player => {
      return {
        id: player.id,
        player_id: player.player_id,
        nickname: player.nickname,
        fullname: player.fullname,
        country_id: player.country_id,
        country_iso: player.country_iso,
        country_name: player.country_name,
        position: player.position,
        total_games: player.total_games,
        average_position: player.average_position,
        dan_points: player.dan_points,
        rate_points: player.rate_points,
        max_rate: player.max_rate,
        win_rate: player.win_rate,
        rank: player.rank || 'N/A',
        rank_color: player.rank_color || '#3B82F6',
        rank_spanish: player.rank_spanish,
        games_won: player.first_place_h + player.first_place_t,
        points: player.dan_points + player.rate_points,

        // Season fields
        season_points: player.season_points,
        season_average_position: player.season_average_position,

        // Sanma data (H = Hanchan, T = Tonpu)
        first_place_h: player.first_place_h,
        second_place_h: player.second_place_h,
        third_place_h: player.third_place_h,
        fourth_place_h: player.fourth_place_h,
        first_place_t: player.first_place_t,
        second_place_t: player.second_place_t,
        third_place_t: player.third_place_t,
        fourth_place_t: player.fourth_place_t,

        // Rank progress
        rank_min_points: player.rank_min_points,
        rank_max_points: player.rank_max_points,
        next_rank: player.next_rank,

        // Tendencias
        trend_dan_delta10: player.trend_dan_delta10,
        trend_season_delta10: player.trend_season_delta10
      };
    });

    const body = {
      success: true,
      data: serializedPlayers,
      total: serializedPlayers.length,
      message: `Retrieved ${serializedPlayers.length} players from cache in ${duration}ms`
    };

    const json = JSON.stringify(body);
    const etag = await weakEtag(json);
    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    const now = new Date().toISOString();
    const nextRefresh = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutos

    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'X-Refreshed-At': now,
        'X-Next-Refresh-At': nextRefresh,
        ETag: etag
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${new Date().toISOString()}] Error in GET /api/players after ${duration}ms:`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch players',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date().toISOString()
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// POST /api/players - Create a new player
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, fullname, country_id, player_id, birthday } = body;

    // Validate required fields
    if (!nickname || !country_id || !player_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['nickname', 'country_id', 'player_id']
        },
        { status: 400 }
      );
    }

    // Crear player y registros iniciales de ranking (4p y 3p)
    const player = await prisma.player.create({
      data: {
        nickname,
        fullname,
        countryId: parseInt(country_id, 10),
        playerNumber: parseInt(player_id, 10),
        birthday: birthday ? new Date(birthday) : null,
      },
    });

    // Entradas iniciales en PlayerRanking (4 jugadores)
    await prisma.playerRanking.create({
      data: {
        playerId: player.id,
        isSanma: false,
        totalGames: 0,
        averagePosition: 2.5,
        danPoints: 0,
        ratePoints: 1500,
        seasonPoints: 0,
        maxRate: 1500,
        firstPlaceH: 0, secondPlaceH: 0, thirdPlaceH: 0, fourthPlaceH: 0,
        firstPlaceT: 0, secondPlaceT: 0, thirdPlaceT: 0, fourthPlaceT: 0,
      },
    });

    // Entradas iniciales en PlayerRanking (3 jugadores)
    await prisma.playerRanking.create({
      data: {
        playerId: player.id,
        isSanma: true,
        totalGames: 0,
        averagePosition: 2.0,
        danPoints: 0,
        ratePoints: 1500,
        seasonPoints: 0,
        maxRate: 1500,
        firstPlaceH: 0, secondPlaceH: 0, thirdPlaceH: 0, fourthPlaceH: 0,
        firstPlaceT: 0, secondPlaceT: 0, thirdPlaceT: 0, fourthPlaceT: 0,
      },
    });

    // Invalidar ranking en cache (write-through)
    await invalidateRanking();

    return NextResponse.json({
      success: true,
      data: player,
      message: 'Player created successfully and ranking cache updated'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/players:', error);

    // Handle specific database errors
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Player already exists',
          message: 'Nickname or player ID already in use'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create player',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
