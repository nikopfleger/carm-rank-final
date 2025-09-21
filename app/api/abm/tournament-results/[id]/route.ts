import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const tournamentResult = await prisma.tournamentResult.findUnique({
      where: { id },
      include: {
        player: {
          select: {
            id: true,
            nickname: true,
            fullname: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!tournamentResult) {
      return NextResponse.json(
        { error: "Resultado de torneo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(tournamentResult);
  } catch (error) {
    console.error("Error fetching tournament result:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Verificar que el resultado existe
    const existingResult = await prisma.tournamentResult.findUnique({
      where: { id }
    });

    if (!existingResult) {
      return NextResponse.json(
        { error: "Resultado de torneo no encontrado" },
        { status: 404 }
      );
    }

    // Si se está cambiando el jugador o torneo, verificar que no exista otro resultado
    if ((body.playerId && body.playerId !== existingResult.playerId) ||
      (body.tournamentId && body.tournamentId !== existingResult.tournamentId)) {
      const resultExists = await prisma.tournamentResult.findFirst({
        where: {
          playerId: parseInt(body.playerId || existingResult.playerId),
          tournamentId: parseInt(body.tournamentId || existingResult.tournamentId),
          deleted: false,
          id: { not: id }
        }
      });

      if (resultExists) {
        return NextResponse.json(
          { error: "Ya existe un resultado para este jugador en este torneo" },
          { status: 400 }
        );
      }
    }

    // Si se está cambiando el jugador, verificar que existe
    if (body.playerId && body.playerId !== existingResult.playerId) {
      const player = await prisma.player.findUnique({
        where: { id: parseInt(body.playerId) }
      });

      if (!player) {
        return NextResponse.json(
          { error: "El jugador especificado no existe" },
          { status: 400 }
        );
      }
    }

    // Si se está cambiando el torneo, verificar que existe
    if (body.tournamentId && body.tournamentId !== existingResult.tournamentId) {
      const tournament = await prisma.tournament.findUnique({
        where: { id: parseInt(body.tournamentId) }
      });

      if (!tournament) {
        return NextResponse.json(
          { error: "El torneo especificado no existe" },
          { status: 400 }
        );
      }
    }

    const updatedAta: any = {};

    if (body.position !== undefined) updatedAta.position = parseInt(body.position);
    if (body.points !== undefined) updatedAta.points = parseFloat(body.points);
    if (body.playerId !== undefined) updatedAta.playerId = parseInt(body.playerId);
    if (body.tournamentId !== undefined) updatedAta.tournamentId = parseInt(body.tournamentId);

    const tournamentResult = await prisma.tournamentResult.update({
      where: { id },
      data: updatedAta,
      include: {
        player: {
          select: {
            id: true,
            nickname: true,
            fullname: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(tournamentResult);
  } catch (error) {
    console.error("Error updating tournament result:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar que el resultado existe
    const existingResult = await prisma.tournamentResult.findUnique({
      where: { id }
    });

    if (!existingResult) {
      return NextResponse.json(
        { error: "Resultado de torneo no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.tournamentResult.update({
      where: { id },
      data: { deleted: true }
    });

    return NextResponse.json({ message: "Resultado de torneo eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting tournament result:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
