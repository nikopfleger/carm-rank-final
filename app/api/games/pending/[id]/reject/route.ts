import { prisma } from '@/lib/database/client';
import { cleanupImage } from '@/lib/image-cleanup-simple';
import { ensureGameValidate } from '@/lib/server-authorization';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación y permisos
    const authz = await ensureGameValidate();
    if ("error" in authz) return authz.error;

    const { id: idParam } = await params;
    const pendingGameId = parseInt(idParam);
    const body = await request.json();
    const { reason } = body;

    if (isNaN(pendingGameId)) {
      return NextResponse.json(
        { success: false, message: 'ID de juego inválido' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Se requiere un motivo de rechazo' },
        { status: 400 }
      );
    }

    // Verificar que el juego existe y está pendiente
    const pendingGame = await prisma.pendingGame.findUnique({
      where: { id: pendingGameId }
    });

    if (!pendingGame) {
      return NextResponse.json(
        { success: false, message: 'Juego pendiente no encontrado' },
        { status: 404 }
      );
    }

    if (pendingGame.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, message: 'El juego ya fue procesado' },
        { status: 400 }
      );
    }

    // Verificar que este es el primer juego en orden de aprobación/rechazo
    const firstPendingGame = await prisma.pendingGame.findFirst({
      where: {
        status: 'PENDING'
      },
      orderBy: [
        { gameDate: 'asc' },
        { nroJuegoDia: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'asc' }
      ]
    });

    if (!firstPendingGame || firstPendingGame.id !== pendingGameId) {
      return NextResponse.json(
        { success: false, message: 'Solo se puede rechazar el primer juego en orden. Debe respetar el orden por fecha y número de juego.' },
        { status: 400 }
      );
    }

    // Marcar como rechazado
    const updatedAtPendingGame = await prisma.pendingGame.update({
      where: { id: pendingGameId },
      data: {
        status: 'REJECTED',
        rejectedReason: reason,
        validatedAt: new Date(),
        validatedBy: authz.session.user.id,
      }
    });

    // LIMPIEZA DE IMAGEN - Eliminar imagen temporal
    if (pendingGame.imageFileName) {
      console.log('Iniciando limpieza de imagen rechazada', { imageFileName: pendingGame.imageFileName });
      await cleanupImage(pendingGame.imageFileName, pendingGame.imageUrl || undefined);
    }

    return NextResponse.json({
      success: true,
      message: 'Juego rechazado exitosamente',
      gameId: updatedAtPendingGame.id
    });

  } catch (error) {
    console.error('Error rejecting game:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
