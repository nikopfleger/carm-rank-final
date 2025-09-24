import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    const body = await req.json();
    const data: any = {};
    if (body.platform) data.platform = String(body.platform);
    if (body.username) data.username = String(body.username);
    if (body.idOnline !== undefined) data.idOnline = body.idOnline ? String(body.idOnline) : null;

    const updatedAt = await prisma.onlineUser.update({
      where: { id },
      data,
    });
    return NextResponse.json(updatedAt);
  } catch (e) {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
}


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

    const onlineUser = await prisma.onlineUser.findUnique({
      where: { id },
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

    if (!onlineUser) {
      return NextResponse.json(
        { error: "Usuario online no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(onlineUser);
  } catch (error) {
    console.error("Error fetching online user:", error);
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
    const expectedVersion = Number((body as any)?.version ?? (body as any)?.__expectedVersion ?? (body as any)?.expectedVersion);
    if (!Number.isFinite(expectedVersion)) {
      return NextResponse.json({ error: "Falta versión para optimistic locking" }, { status: 409 });
    }

    // Verificar que el usuario online existe
    const existingOnlineUser = await prisma.onlineUser.findUnique({
      where: { id }
    });

    if (!existingOnlineUser) {
      return NextResponse.json(
        { error: "Usuario online no encontrado" },
        { status: 404 }
      );
    }

    // Si se está cambiando el username o platform, verificar que no exista otro
    if ((body.username && body.username !== existingOnlineUser.username) ||
      (body.platform && body.platform !== existingOnlineUser.platform)) {
      const usernameExists = await prisma.onlineUser.findFirst({
        where: {
          username: body.username || existingOnlineUser.username,
          platform: body.platform || existingOnlineUser.platform,
          deleted: false,
          id: { not: id }
        }
      });

      if (usernameExists) {
        return NextResponse.json(
          { error: "Ya existe un usuario online con ese username en esa plataforma" },
          { status: 400 }
        );
      }
    }

    // Si se está cambiando el jugador, verificar que existe
    if (body.playerId && body.playerId !== existingOnlineUser.playerId) {
      const player = await prisma.player.findUnique({
        where: { id: parseInt(body.playerId) }
      });

      if (!player) {
        return NextResponse.json(
          { error: "El jugador especificado no existe" },
          { status: 400 }
        );
      }
    }

    const updatedAta: any = {};

    if (body.platform !== undefined) updatedAta.platform = body.platform;
    if (body.username !== undefined) updatedAta.username = body.username;
    if (body.playerId !== undefined) updatedAta.playerId = parseInt(body.playerId);
    if (body.isActive !== undefined) updatedAta.isActive = body.isActive;

    const onlineUser = await prisma.onlineUser.update({
      where: { id, version: expectedVersion },
      data: updatedAta,
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

    return NextResponse.json(onlineUser);
  } catch (error) {
    console.error("Error updating online user:", error);
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

    // Verificar que el usuario online existe
    const existingOnlineUser = await prisma.onlineUser.findUnique({
      where: { id }
    });

    if (!existingOnlineUser) {
      return NextResponse.json(
        { error: "Usuario online no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.onlineUser.update({
      where: { id },
      data: { deleted: true }
    });

    return NextResponse.json({ message: "Usuario online eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting online user:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
