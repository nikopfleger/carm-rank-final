import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const tournamentId = searchParams.get("tournamentId");
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const where: any = {};

    if (!includeDeleted) {
      where.deleted = false;
    }

    if (tournamentId) {
      where.tournamentId = parseInt(tournamentId);
    }

    if (search) {
      where.OR = [
        { player: { nickname: { contains: search, mode: "insensitive" } } },
        { tournament: { name: { contains: search, mode: "insensitive" } } }
      ];
    }

    const tournamentResults = await prisma.tournamentResult.findMany({
      where,
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
      },
      orderBy: [
        { deleted: "asc" },
        { tournament: { startDate: "desc" } },
        { position: "asc" } as any
      ]
    });

    return NextResponse.json(tournamentResults);
  } catch (error) {
    console.error("Error fetching tournament results:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar campos requeridos
    if (!body.position || !body.pointsWon || !body.playerId || !body.tournamentId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: position, pointsWon, playerId, tournamentId" },
        { status: 400 }
      );
    }

    // Verificar que el jugador existe
    const player = await prisma.player.findUnique({
      where: { id: parseInt(body.playerId) }
    });

    if (!player) {
      return NextResponse.json(
        { error: "El jugador especificado no existe" },
        { status: 400 }
      );
    }

    // Verificar que el torneo existe
    const tournament = await prisma.tournament.findUnique({
      where: { id: parseInt(body.tournamentId) }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "El torneo especificado no existe" },
        { status: 400 }
      );
    }

    // Verificar que no exista otro resultado para el mismo jugador en el mismo torneo
    const existingResult = await prisma.tournamentResult.findFirst({
      where: {
        playerId: parseInt(body.playerId),
        tournamentId: parseInt(body.tournamentId),
        deleted: false
      }
    });

    if (existingResult) {
      return NextResponse.json(
        { error: "Ya existe un resultado para este jugador en este torneo" },
        { status: 400 }
      );
    }

    const tournamentResult = await prisma.tournamentResult.create({
      data: {
        position: parseInt(body.position),
        pointsWon: parseInt(body.pointsWon),
        prizeWon: body.prizeWon ? parseFloat(body.prizeWon) : null,
        playerId: parseInt(body.playerId),
        tournamentId: parseInt(body.tournamentId)
      } as any,
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

    return NextResponse.json(tournamentResult, { status: 201 });
  } catch (error) {
    console.error("Error creating tournament result:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
