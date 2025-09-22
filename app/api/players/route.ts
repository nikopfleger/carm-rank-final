import { connectToDatabase } from '@/lib/database/connection';
import { createPlayer, getPlayersWithRanking } from '@/lib/database/queries/players';
// i18n se resuelve en el frontend; este endpoint no maneja idioma
import { rankingCache } from '@/lib/ranking-cache';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

// GET /api/players - Get all players with ranking
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    // Timeout suave: si tarda >5s y no hay cache, devolvemos 202 con payload vacío
    const TIMEOUT_MS = 5000;
    const TIMEOUT_SENTINEL = Symbol('TIMEOUT');
    const timeoutPromise = new Promise<symbol>((resolve) => {
      timeoutId = setTimeout(() => resolve(TIMEOUT_SENTINEL), TIMEOUT_MS);
    });

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const type = searchParams.get('type') as 'GENERAL' | 'TEMPORADA' || 'GENERAL';
    const sanma = searchParams.get('sanma'); // 'true' o 'false' para filtrar por cantidad de jugadores
    // Idioma: manejado en frontend

    console.log(`📊 [${new Date().toISOString()}] Parámetros: includeInactive=${includeInactive}, type=${type}${seasonId ? `, seasonId=${seasonId}` : ''}${sanma ? `, sanma=${sanma}` : ''}`);

    const cacheKey = { seasonId: seasonId ? parseInt(seasonId) : undefined, type, includeInactive, sanma: sanma ? sanma === 'true' : undefined } as const;
    const cachedJson = rankingCache.getJson(cacheKey);
    if (cachedJson) {
      const etag = 'W/"' + crypto.createHash('sha1').update(cachedJson).digest('hex') + '"';
      const ifNoneMatch = request.headers.get('if-none-match');
      if (ifNoneMatch && ifNoneMatch === etag) {
        return new NextResponse(null, { status: 304, headers: { ETag: etag } });
      }
      return new NextResponse(cachedJson, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ETag: etag } });
    }

    const playersPromise = getPlayersWithRanking(
      seasonId ? parseInt(seasonId) : undefined,
      type,
      includeInactive,
      sanma ? sanma === 'true' : undefined // Convertir string a boolean
    );

    // Correr con timeout
    const raced = await Promise.race([playersPromise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);

    if (raced === TIMEOUT_SENTINEL) {
      return NextResponse.json({ success: true, data: [], total: 0, message: 'warming_up' }, { status: 202 });
    }
    const players = raced as any;

    const duration = Date.now() - startTime;
    console.log(`✅ [${new Date().toISOString()}] Completado en ${duration}ms. Jugadores: ${players.length}`);

    const body = {
      success: true,
      data: players,
      total: players.length,
      message: `Retrieved ${players.length} players ${includeInactive ? '(including inactive)' : '(active only)'} in ${duration}ms`
    };
    const json = JSON.stringify(body);
    rankingCache.set(cacheKey, players);
    rankingCache.setJson(cacheKey, json);
    const etag = 'W/"' + crypto.createHash('sha1').update(json).digest('hex') + '"';
    return new NextResponse(json, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ETag: etag } });
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    console.error(`❌ [${new Date().toISOString()}] Error in GET /api/players after ${duration}ms:`, error);

    // Respuesta de error estructurada en JSON
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
    await connectToDatabase();

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

    const player = await createPlayer({
      nickname,
      fullname,
      country_id: parseInt(country_id),
      player_id: parseInt(player_id),
      birthday: birthday ? new Date(birthday) : undefined
    });

    return NextResponse.json({
      success: true,
      data: player,
      message: 'Player createdAt successfully'
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
