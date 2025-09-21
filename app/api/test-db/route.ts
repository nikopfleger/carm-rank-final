import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Test DB: Iniciando test de conexión');

    // Verificar conexión
    await prisma.$connect();
    console.log('Test DB: Conexión exitosa');

    // Contar juegos
    const totalGames = await prisma.game.count();
    console.log(`Test DB: Total juegos: ${totalGames}`);

    // Contar jugadores
    const totalPlayers = await prisma.player.count();
    console.log(`Test DB: Total jugadores: ${totalPlayers}`);

    // Contar temporadas
    const totalSeasons = await prisma.season.count();
    console.log(`Test DB: Total temporadas: ${totalSeasons}`);

    // Verificar esquema
    const gameSchema = await prisma.game.findFirst({
      select: {
        id: true,
        gameDate: true,
        gameType: true,
        isValidated: true
      }
    });

    console.log('Test DB: Primer juego:', gameSchema);

    return NextResponse.json({
      success: true,
      data: {
        totalGames,
        totalPlayers,
        totalSeasons,
        gameSchema,
        message: 'Conexión a BD exitosa'
      }
    });

  } catch (error) {
    console.error('Test DB: Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
}
