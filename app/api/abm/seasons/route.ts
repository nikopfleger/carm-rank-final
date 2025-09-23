import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    const includeResults = searchParams.get("includeResults") === "true";

    const where: any = {};

    if (!includeDeleted) {
      where.deleted = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const seasons = await prisma.season.findMany({
      where,
      include: includeResults ? {
        seasonResults: {
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
          orderBy: [
            { isSanma: 'asc' },
            { seasonPoints: 'desc' }
          ]
        }
      } : undefined,
      orderBy: [
        { deleted: "asc" },
        { startDate: "desc" }
      ]
    });

    return NextResponse.json(seasons);
  } catch (error) {
    console.error("Error fetching seasons:", error);
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
    if (!body.name || !body.startDate) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: name, startDate" },
        { status: 400 }
      );
    }

    // Verificar que el nombre no exista
    const existingSeason = await prisma.season.findFirst({
      where: {
        name: body.name,
        deleted: false
      }
    });

    if (existingSeason) {
      return NextResponse.json(
        { error: "Ya existe una temporada con ese nombre" },
        { status: 400 }
      );
    }

    // Validar que endDate esté presente
    if (!body.endDate) {
      return NextResponse.json(
        { error: "La fecha de fin es requerida" },
        { status: 400 }
      );
    }

    const season = await prisma.season.create({
      data: {
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        isActive: body.isActive !== undefined ? body.isActive : false
      }
    });

    return NextResponse.json(season, { status: 201 });
  } catch (error) {
    console.error("Error creating season:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
