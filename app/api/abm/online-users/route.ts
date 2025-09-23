import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const where: any = {};

    if (!includeDeleted) {
      where.deleted = false;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { platform: { contains: search, mode: "insensitive" } },
        { player: { nickname: { contains: search, mode: "insensitive" } } }
      ];
    }

    const onlineUsers = await prisma.onlineUser.findMany({
      where,
      include: {
        player: {
          select: {
            id: true,
            nickname: true,
            fullname: true
          }
        }
      },
      orderBy: [
        { deleted: "asc" },
        { platform: "asc" },
        { username: "asc" }
      ]
    });

    return NextResponse.json(onlineUsers);
  } catch (error) {
    console.error("Error fetching online users:", error);
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
    if (!body.platform || !body.username || !body.playerId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: platform, username, playerId" },
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

    // Verificar que no exista otro usuario online con el mismo username en la misma plataforma
    const existingOnlineUser = await prisma.onlineUser.findFirst({
      where: {
        username: body.username,
        platform: body.platform,
        deleted: false
      }
    });

    if (existingOnlineUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario online con ese username en esa plataforma" },
        { status: 400 }
      );
    }

    const onlineUser = await prisma.onlineUser.create({
      data: {
        platform: body.platform,
        username: body.username,
        idOnline: body.idOnline ? String(body.idOnline) : null,
        playerId: parseInt(body.playerId),
        isActive: body.isActive !== undefined ? body.isActive : true
      },
      include: {
        player: {
          select: {
            id: true,
            nickname: true,
            fullname: true
          }
        }
      }
    });

    return NextResponse.json(onlineUser, { status: 201 });
  } catch (error) {
    console.error("Error creating online user:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
