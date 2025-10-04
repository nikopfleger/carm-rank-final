import { prisma } from "@/lib/database/client";
import { serializeBigInt } from "@/lib/serialize-bigint";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: {
        deleted: false,
      },
      include: {
        season: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
      orderBy: [
        { startDate: "desc" }
      ],
    });

    // Debug: ver qué datos devuelve Prisma
    console.log('🔍 API - Prisma raw data:', tournaments.length, 'tournaments');
    const iormcTournament = tournaments.find(t => t.name?.includes('IORMC'));
    if (iormcTournament) {
      console.log('🔍 API - IORMC Tournament from Prisma:', {
        name: iormcTournament.name,
        startDate: iormcTournament.startDate,
        startDateType: typeof iormcTournament.startDate,
        endDate: iormcTournament.endDate,
        endDateType: typeof iormcTournament.endDate,
        isCompleted: iormcTournament.isCompleted
      });
    }

    return NextResponse.json({
      success: true,
      data: serializeBigInt(tournaments),
      total: tournaments.length
    });
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}