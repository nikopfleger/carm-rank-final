import {
  createPlayer,
  normalizeNickname,
  validateNickname,
  type NewPlayerData
} from '@/lib';
import { prisma } from '@/lib/database/client';
import { serializeBigInt } from '@/lib/serialize-bigint';
import { NextRequest, NextResponse } from 'next/server';

;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { nickname, fullname, countryId, playerId } = body;

    // Validar datos básicos
    if (!nickname) {
      return NextResponse.json(
        { success: false, message: 'El nickname es obligatorio' },
        { status: 400 }
      );
    }

    // Validar y normalizar nickname
    const nicknameValidation = validateNickname(nickname);
    if (!nicknameValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nickname inválido',
          errors: nicknameValidation.errors
        },
        { status: 400 }
      );
    }

    const normalizedNickname = normalizeNickname(nickname);

    // Verificar que el nickname no esté en uso
    const existingPlayer = await prisma.player.findFirst({
      where: { nickname: normalizedNickname }
    });

    if (existingPlayer) {
      return NextResponse.json(
        {
          success: false,
          message: `El nickname "${normalizedNickname}" ya está en uso por el jugador con legajo ${existingPlayer.playerNumber}`
        },
        { status: 400 }
      );
    }

    // Preparar datos del jugador
    const playerData: NewPlayerData = {
      nickname: normalizedNickname,
      fullname: fullname?.trim() || undefined,
      countryId: countryId ? BigInt(countryId) : undefined,
      playerId: playerId ? Number(playerId) : undefined
    };

    // Crear el jugador usando el helper
    const result = await createPlayer(prisma as any, playerData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        playerId: result.playerId,
        playerLegajo: result.playerLegajo
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in create player API:', error);
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
