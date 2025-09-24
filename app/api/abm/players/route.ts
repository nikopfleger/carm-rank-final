import { prisma } from "@/lib/database/client";
import { runWithRequestContextAsync } from "@/lib/request-context.server";
import { ensureAbmManage } from "@/lib/server-authorization";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  try {
    const authz = await ensureAbmManage();
    if ("error" in authz) return authz.error;

    const search = request.nextUrl.searchParams.get("q") ?? "";
    const includeDeleted = request.nextUrl.searchParams.get("includeDeleted") === "true";

    // Input hardening: limit length
    if (search.length > 50) {
      return NextResponse.json({ error: "Query demasiado larga" }, { status: 400 });
    }

    // Optional: escape LIKE wildcards for legajo search
    const escapeLike = (s: string) => s.replace(/[%_\\]/g, (m) => "\\" + m);

    const idsByLegajo: number[] = [];

    let players;

    if (!includeDeleted) {
      players = await prisma.player.findMany({
        where: {
          ...(search
            ? {
              OR: [
                { nickname: { contains: search, mode: "insensitive" } },
                { fullname: { contains: search, mode: "insensitive" } },
                ...(/^\d+$/.test(search) ? [{ playerNumber: Number(search) }] : []),
              ],
            }
            : {}),
        },
        include: {
          country: {
            select: { id: true, fullName: true },
          },
          onlineUsers: {
            where: { deleted: false },
            select: { id: true, platform: true, username: true, idOnline: true, isActive: true }
          },
        },
        orderBy: [{ playerNumber: "asc" }],
      });

    } else {
      // Con includeDeleted habilitamos el contexto para que el interceptor no agregue deleted:false
      players = await runWithRequestContextAsync({ includeDeleted: true }, async () => prisma.player.findMany({
        where: {
          ...(search
            ? {
              OR: [
                { nickname: { contains: search, mode: "insensitive" } },
                { fullname: { contains: search, mode: "insensitive" } },
                ...(/^\d+$/.test(search) ? [{ playerNumber: Number(search) }] : []),
              ],
            }
            : {}),
        },
        include: {
          country: { select: { id: true, fullName: true } },
          onlineUsers: { where: { deleted: false }, select: { id: true, platform: true, username: true, idOnline: true, isActive: true } }
        },
        orderBy: [{ playerNumber: "asc" }],
      }));
    }

    return NextResponse.json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
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
    if (!body.nickname || !body.countryId || !body.playerNumber) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: nickname, countryId, playerNumber" },
        { status: 400 }
      );
    }

    // Verificar que el nickname no exista
    const existingPlayer = await prisma.player.findFirst({
      where: {
        nickname: body.nickname,
        deleted: false
      }
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: "Ya existe un jugador con ese nickname" },
        { status: 400 }
      );
    }

    // Verificar que el playerNumber no exista
    const existingPlayerId = await prisma.player.findFirst({
      where: {
        playerNumber: body.playerNumber,
        deleted: false
      }
    });

    if (existingPlayerId) {
      return NextResponse.json(
        { error: "Ya existe un jugador con ese legajo" },
        { status: 400 }
      );
    }

    const player = await prisma.player.create({
      data: {
        nickname: body.nickname,
        fullname: body.fullname || null,
        countryId: parseInt(body.countryId),
        playerNumber: parseInt(body.playerNumber),
        birthday: body.birthday ? new Date(body.birthday) : null
      },
      include: {
        country: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("Error creating player:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
