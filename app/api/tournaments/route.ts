import { prisma } from "@/lib/database/client";
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

    return NextResponse.json({
      success: true,
      data: tournaments,
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