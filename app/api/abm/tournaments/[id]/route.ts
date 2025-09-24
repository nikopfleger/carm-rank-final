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

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        season: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error("Error fetching tournament:", error);
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
    const expectedVersion = Number(body?.version ?? body?.__expectedVersion ?? body?.expectedVersion);
    if (!Number.isFinite(expectedVersion)) {
      return NextResponse.json({ error: "Falta versión para optimistic locking" }, { status: 409 });
    }

    // Verificar que el torneo existe
    const existingTournament = await prisma.tournament.findUnique({
      where: { id }
    });

    if (!existingTournament) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    // Si se está cambiando el nombre, verificar que no exista otro en la misma temporada
    if (body.name && body.name !== existingTournament.name) {
      const nameExists = await prisma.tournament.findFirst({
        where: {
          name: body.name,
          seasonId: body.seasonId || existingTournament.seasonId,
          deleted: false,
          id: { not: id }
        }
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Ya existe un torneo con ese nombre en esta temporada" },
          { status: 400 }
        );
      }
    }

    // Si se está cambiando la temporada, verificar que existe
    if (body.seasonId && body.seasonId !== existingTournament.seasonId) {
      const season = await prisma.season.findUnique({
        where: { id: parseInt(body.seasonId) }
      });

      if (!season) {
        return NextResponse.json(
          { error: "La temporada especificada no existe" },
          { status: 400 }
        );
      }
    }

    const updatedAta: any = {};

    if (body.name !== undefined) updatedAta.name = body.name;
    if (body.description !== undefined) updatedAta.description = body.description;
    if (body.seasonId !== undefined) updatedAta.seasonId = parseInt(body.seasonId);
    if (body.startDate !== undefined) updatedAta.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updatedAta.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.location !== undefined) updatedAta.location = body.location;
    if (body.maxPlayers !== undefined) updatedAta.maxPlayers = body.maxPlayers ? parseInt(body.maxPlayers) : null;
    if (body.entryFee !== undefined) updatedAta.entryFee = body.entryFee ? parseFloat(body.entryFee) : null;
    if (body.prizePool !== undefined) updatedAta.prizePool = body.prizePool ? parseFloat(body.prizePool) : null;
    if (body.isActive !== undefined) updatedAta.isActive = body.isActive;

    const tournament = await prisma.tournament.update({
      where: { id, version: expectedVersion },
      data: updatedAta,
      include: {
        season: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(tournament);
  } catch (error) {
    console.error("Error updating tournament:", error);
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

    // Verificar que el torneo existe
    const existingTournament = await prisma.tournament.findUnique({
      where: { id }
    });

    if (!existingTournament) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete mediante interceptor
    await prisma.tournament.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Torneo eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
