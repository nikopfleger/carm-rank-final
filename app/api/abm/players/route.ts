import { prisma } from "@/lib/database/client";
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

    let idsByLegajo: number[] = [];
    if (search && /^\d+$/.test(search)) {
      const term = escapeLike(search.trim());
      const pattern = `%${term}%`;
      const rows = await prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id
        FROM carm.player
        WHERE ${includeDeleted ? '1=1' : 'deleted = false'}
          AND CAST(player_number AS TEXT) ILIKE ${pattern} ESCAPE '\\'
      `;
      idsByLegajo = rows.map((r) => r.id);
    }

    let players;

    if (includeDeleted) {
      // Usar queryRaw para bypasear el middleware cuando queremos incluir eliminados
      players = await prisma.$queryRaw`
        SELECT 
          p.id,
          p.nickname,
          p.fullname,
          p.country_id as "countryId",
          p.player_number as "playerNumber",
          p.birthday,
          p.version,
          p.deleted,
          p.createdAt as "createdAt",
          p.updatedAt as "updatedAt",
          c.id as "country_id",
          c.full_name as "country_fullName"
        FROM carm.player p
        LEFT JOIN carm.country c ON p.country_id = c.id
        ORDER BY p.player_number ASC
      `;

      // Convertir a formato esperado
      players = (players as any[]).map((p: any) => {
        console.log('🔍 Mapeando jugador:', {
          id: p.id,
          nickname: p.nickname,
          countryId: p.countryId,
          country_id: p.country_id,
          country_fullName: p.country_fullName
        });
        return {
          id: p.id,
          nickname: p.nickname,
          fullname: p.fullname,
          countryId: p.countryId,
          playerNumber: p.playerNumber,
          birthday: p.birthday,
          version: p.version,
          deleted: p.deleted,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          country: p.country_id ? {
            id: p.country_id,
            fullName: p.country_fullName
          } : null,
          onlineUsers: [] // Por simplicidad, no incluimos onlineUsers en la consulta raw
        };
      });
    } else {
      // Usar findMany normal para activos (con middleware)
      players = await prisma.player.findMany({
        where: {
          ...(search
            ? {
              OR: [
                { nickname: { contains: search, mode: "insensitive" } },
                { fullname: { contains: search, mode: "insensitive" } },
                ...(idsByLegajo.length > 0 ? [{ playerNumber: { in: idsByLegajo } }] : []),
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

      console.log('🔍 Query normal - jugadores encontrados:', players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        country_id: p.countryId,
        country: p.country
      })));
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
