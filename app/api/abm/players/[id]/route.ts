import { prisma } from "@/lib/database/client";
import { ensureAbmManage, ensureCanEditPlayer } from "@/lib/server-authorization";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        country: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    if (!player) {
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error("Error fetching player:", error);
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

    // Verificar que el jugador existe
    const existingPlayer = await prisma.player.findUnique({
      where: { id }
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    // Si se está cambiando el nickname, verificar que no exista otro
    if (body.nickname && body.nickname !== existingPlayer.nickname) {
      const nicknameExists = await prisma.player.findFirst({
        where: {
          nickname: body.nickname,
          deleted: false,
          id: { not: id }
        }
      });

      if (nicknameExists) {
        return NextResponse.json(
          { error: "Ya existe un jugador con ese nickname" },
          { status: 400 }
        );
      }
    }

    // Si se está cambiando el playerNumber, verificar que no exista otro
    if (body.playerNumber && body.playerNumber !== existingPlayer.playerNumber) {
      const playerNumberExists = await prisma.player.findFirst({
        where: {
          playerNumber: body.playerNumber,
          deleted: false,
          id: { not: id }
        }
      });

      if (playerNumberExists) {
        return NextResponse.json(
          { error: "Ya existe un jugador con ese legajo" },
          { status: 400 }
        );
      }
    }

    const updatedData: any = {};

    if (body.nickname !== undefined) updatedData.nickname = body.nickname;
    if (body.fullname !== undefined) updatedData.fullname = body.fullname;
    if (body.countryId !== undefined) updatedData.countryId = parseInt(body.countryId);
    if (body.playerNumber !== undefined) updatedData.playerNumber = parseInt(body.playerNumber);
    if (body.birthday !== undefined) updatedData.birthday = body.birthday ? new Date(body.birthday) : null;
    if (body.extraData !== undefined) updatedData.extraData = body.extraData;

    const player = await prisma.player.update({
      where: { id, version: expectedVersion },
      data: updatedData,
      include: {
        country: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    return NextResponse.json(player);
  } catch (error) {
    console.error("Error updating player:", error);
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

    // Verificar que el jugador existe
    const existingPlayer = await prisma.player.findUnique({
      where: { id }
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete mediante interceptor: usar delete
    await prisma.player.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Jugador eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting player:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log('🔧 Endpoint PATCH llamado');
  const { id: idParam } = await params;
  const playerId = Number(idParam);
  if (!Number.isFinite(playerId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await request.json();
  console.log('📦 Body recibido:', body);

  // Si es una acción de restore
  if (body.action === 'restore') {
    console.log('🔄 Acción de restore detectada');

    console.log('🔐 Verificando autorización...');
    const authz = await ensureAbmManage();
    if ("error" in authz) {
      console.log('❌ Error de autorización:', authz.error);
      console.log('❌ Status del error:', authz.error?.status);
      return authz.error;
    }
    console.log('✅ Autorización exitosa');

    // Verificar que el jugador existe (usando $queryRaw para bypass middleware)
    console.log('🔍 Buscando jugador con ID:', playerId);

    const existingPlayer = await prisma.$queryRaw`
      SELECT p.id, p.nickname, p.fullname, p.deleted, p.player_number, p.country_id, p.birthday,
             c.full_name as country_name
      FROM "carm"."player" p
      LEFT JOIN "carm"."country" c ON p.country_id = c.id
      WHERE p.id = ${playerId}
    `;

    console.log('👤 Resultado de query:', existingPlayer);
    const player = Array.isArray(existingPlayer) ? existingPlayer[0] : existingPlayer;
    console.log('👤 Jugador encontrado:', player ? 'Sí' : 'No');
    if (player) {
      console.log('👤 Datos del jugador:', { id: player.id, nickname: player.nickname, deleted: player.deleted });
    }

    if (!player) {
      console.log('❌ Jugador no encontrado');
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    console.log('🗑️ Jugador eliminado:', player.deleted);
    if (!player.deleted) {
      console.log('❌ Jugador no está eliminado');
      return NextResponse.json(
        { error: "El jugador no está eliminado" },
        { status: 400 }
      );
    }

    // Restaurar (soft delete)
    console.log('🔄 Restaurando jugador...');
    const restoredPlayer = await prisma.player.update({
      where: { id: playerId },
      data: { deleted: false },
      include: {
        country: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });
    console.log('✅ Jugador restaurado exitosamente');

    return NextResponse.json({
      success: true,
      message: "Jugador restaurado correctamente",
      player: restoredPlayer
    });
  }

  // Si no es restore, continuar con la lógica normal de actualización
  const authz = await ensureCanEditPlayer(playerId);
  if ("error" in authz) return authz.error;

  const data: any = {};
  if (body.fullname !== undefined) data.fullname = body.fullname ? String(body.fullname) : null;
  if (body.birthday !== undefined) data.birthday = body.birthday ? new Date(body.birthday) : null;
  if (body.nickname !== undefined) data.nickname = String(body.nickname);
  if (body.playerNumber !== undefined) data.playerNumber = Number(body.playerNumber);
  if (body.countryId !== undefined) data.countryId = Number(body.countryId);

  // Unicidad de nickname y playerNumber
  if (data.nickname) {
    const exists = await prisma.player.findFirst({ where: { nickname: data.nickname, NOT: { id: playerId } } });
    if (exists) return NextResponse.json({ error: "Ya existe un jugador con ese nickname" }, { status: 400 });
  }
  if (data.playerNumber) {
    const exists = await prisma.player.findFirst({ where: { playerNumber: data.playerNumber, NOT: { id: playerId } } });
    if (exists) return NextResponse.json({ error: "Ya existe un jugador con ese legajo" }, { status: 400 });
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const updatedAt = await prisma.player.update({
    where: { id: playerId },
    data,
    select: { id: true, nickname: true, playerNumber: true, countryId: true, fullname: true, birthday: true, updatedAt: true },
  });
  return NextResponse.json({ player: updatedAt });
}

