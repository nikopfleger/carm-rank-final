import { prisma } from "@/lib/database/client";
import { serializeBigInt } from "@/lib/serialize-bigint";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

;

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

    return NextResponse.json(serializeBigInt(tournamentResults));
  } catch (error) {
    console.error("Error fetching tournament results:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

