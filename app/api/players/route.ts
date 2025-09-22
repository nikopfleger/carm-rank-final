import { connectToDatabase } from '@/lib/database/connection';
import { createPlayer, getPlayersWithRanking } from '@/lib/database/queries/players';
// i18n se resuelve en el frontend; este endpoint no maneja idioma
import { NextRequest, NextResponse } from 'next/server';

// GET /api/players - Get all players with ranking
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    // Timeout para evitar colgarse en producción
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Request timeout after 25 seconds'));
      }, 25000); // 25 segundos - menos que los 30 de Vercel
    });

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const type = searchParams.get('type') as 'GENERAL' | 'TEMPORADA' || 'GENERAL';
    const sanma = searchParams.get('sanma'); // 'true' o 'false' para filtrar por cantidad de jugadores
    // Idioma: manejado en frontend

    console.log(`📊 [${new Date().toISOString()}] Parámetros: includeInactive=${includeInactive}, type=${type}${seasonId ? `, seasonId=${seasonId}` : ''}${sanma ? `, sanma=${sanma}` : ''}`);

    const playersPromise = getPlayersWithRanking(
      seasonId ? parseInt(seasonId) : undefined,
      type,
      includeInactive,
      sanma ? sanma === 'true' : undefined // Convertir string a boolean
    );

    // Correr con timeout
    const players = await Promise.race([playersPromise, timeoutPromise]) as any;
    if (timeoutId) clearTimeout(timeoutId);

    const duration = Date.now() - startTime;
    console.log(`✅ [${new Date().toISOString()}] Completado en ${duration}ms. Jugadores: ${players.length}`);

    return NextResponse.json({
      success: true,
      data: players,
      total: players.length,
      message: `Retrieved ${players.length} players ${includeInactive ? '(including inactive)' : '(active only)'} in ${duration}ms`
    });
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
