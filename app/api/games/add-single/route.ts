import {
  createGame,
  parseGameDate,
  validateGameScores,
  validateUniquePlayerIds,
  type NewGameData
} from '@/lib';
import { prisma } from '@/lib/database/client';
import { serializeBigInt } from '@/lib/serialize-bigint';
import { ensureGameSubmit } from '@/lib/server-authorization';
import { NextRequest, NextResponse } from 'next/server';

;

export async function POST(request: NextRequest) {
  try {
    const authz = await ensureGameSubmit();
    if ('error' in authz) return authz.error;

    const body = await request.json();

    // Validar datos básicos
    const { gameDate, venue, locationId, duration, sanma, rulesetId, players, imageUrl } = body;

    if (!gameDate || !duration || !rulesetId || !players || !Array.isArray(players)) {
      return NextResponse.json(
        { success: false, message: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Validar fecha
    const parsedDate = parseGameDate(gameDate);
    if (!parsedDate) {
      return NextResponse.json(
        { success: false, message: 'Fecha inválida' },
        { status: 400 }
      );
    }

    // Validar jugadores únicos
    const playerIds = players.map((p: any) => p.playerId);
    if (!validateUniquePlayerIds(playerIds)) {
      return NextResponse.json(
        { success: false, message: 'No puede haber jugadores duplicados' },
        { status: 400 }
      );
    }

    // Validar puntajes
    const scores = players.map((p: any) => p.gameScore);
    const expectedPlayers = sanma ? 3 : 4;
    const scoreValidation = validateGameScores(scores, expectedPlayers);

    if (!scoreValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: `Suma de puntajes inválida. Esperado: ${scoreValidation.expectedTotal}, Actual: ${scoreValidation.actualTotal}, Diferencia: ${scoreValidation.difference}`
        },
        { status: 400 }
      );
    }

    // Preparar datos del juego
    const gameData: NewGameData = {
      gameDate: parsedDate,
      venue,
      locationId: locationId ? BigInt(parseInt(locationId)) : undefined,
      duration: duration.toUpperCase(),
      sanma: Boolean(sanma),
      rulesetId: BigInt(rulesetId),
      players: players.map((p: any) => ({
        playerId: BigInt(parseInt(p.playerId)),
        gameScore: parseInt(p.gameScore),
        wind: p.wind,
        chonbos: parseInt(p.chonbos || 0),
        oorasuScore: p.oorasuScore ? parseInt(p.oorasuScore) : undefined
      })),
      imageUrl
    };

    // Crear el juego usando el helper
    const result = await createGame(prisma as any, gameData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        gameId: result.gameId
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          errors: result.errors
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in add-single game API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
