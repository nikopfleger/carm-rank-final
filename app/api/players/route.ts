import { connectToDatabase } from '@/lib/database/connection';
import { createPlayer, getPlayersWithRanking } from '@/lib/database/queries/players';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/players - Get all players with ranking
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const type = searchParams.get('type') as 'GENERAL' | 'TEMPORADA' || 'GENERAL';
    const sanma = searchParams.get('sanma'); // 'true' o 'false' para filtrar por cantidad de jugadores

    console.log(`📊 Parámetros: includeInactive=${includeInactive}, type=${type}${seasonId ? `, seasonId=${seasonId}` : ''}${sanma ? `, sanma=${sanma}` : ''}`);

    const players = await getPlayersWithRanking(
      seasonId ? parseInt(seasonId) : undefined,
      type,
      includeInactive,
      sanma ? sanma === 'true' : undefined // Convertir string a boolean
    );

    // El conteo de juegos únicos ahora se hace en un endpoint separado

    return NextResponse.json({
      success: true,
      data: players,
      total: players.length,
      message: `Retrieved ${players.length} players ${includeInactive ? '(including inactive)' : '(active only)'}`
    });
  } catch (error) {
    console.error('Error in GET /api/players:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch players',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
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
