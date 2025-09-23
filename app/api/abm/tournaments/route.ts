import { prisma } from "@/lib/database/client";
import { ensureAbmManage } from "@/lib/server-authorization";
import { NextRequest, NextResponse } from "next/server";

;

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("q");
    const includeResults = request.nextUrl.searchParams.get("includeResults") === "true";

    const tournaments = await prisma.tournament.findMany({
      where: {
        deleted: false,
        ...(search
          ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
          : {}),
      },
      include: {
        season: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        ...(includeResults ? {
          tournamentResults: {
            include: {
              player: {
                select: {
                  id: true,
                  nickname: true,
                  fullname: true,
                  playerNumber: true
                }
              }
            },
            orderBy: { position: 'asc' }
          }
        } : {})
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authz = await ensureAbmManage();
    if ("error" in authz) return authz.error;

    const body = await request.json();

    // Validar campos requeridos
    if (!body.name || !body.seasonId || !body.startDate) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: name, seasonId, startDate" },
        { status: 400 }
      );
    }

    // Verificar que la temporada existe
    const season = await prisma.season.findUnique({
      where: { id: parseInt(body.seasonId) }
    });

    if (!season) {
      return NextResponse.json(
        { error: "La temporada especificada no existe" },
        { status: 400 }
      );
    }

    // Verificar que el nombre no exista en la misma temporada
    const existingTournament = await prisma.tournament.findFirst({
      where: {
        name: body.name,
        seasonId: parseInt(body.seasonId),
        deleted: false
      }
    });

    if (existingTournament) {
      return NextResponse.json(
        { error: "Ya existe un torneo con ese nombre en esta temporada" },
        { status: 400 }
      );
    }

    const tournament = await prisma.tournament.create({
      data: {
        name: body.name,
        description: body.description || null,
        seasonId: parseInt(body.seasonId),
        startDate: new Date(body.startDate),
        ...(body.endDate && { endDate: new Date(body.endDate) }),
        locationId: body.locationId ? parseInt(body.locationId) : null,
        maxPlayers: body.maxPlayers ? parseInt(body.maxPlayers) : null,
        entryFee: body.entryFee ? parseFloat(body.entryFee) : null,
        prizePool: body.prizePool ? parseFloat(body.prizePool) : null,
        isCompleted: body.isCompleted !== undefined ? body.isCompleted : false,
        extraData: body.extraData ? JSON.parse(body.extraData) : null
      },
      include: {
        season: {
          select: {
            id: true,
            name: true
          }
        },
        location: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error("Error creating tournament:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
