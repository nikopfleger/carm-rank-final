import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
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

    if (!existingOnlineUser.deleted) {
      return NextResponse.json(
        { error: "El usuario online no está eliminado" },
        { status: 400 }
      );
    }

    // Restaurar (soft delete)
    const onlineUser = await prisma.onlineUser.update({
      where: { id },
      data: { deleted: false },
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

    return NextResponse.json({
      message: "Usuario online restaurado correctamente",
      onlineUser
    });
  } catch (error) {
    console.error("Error restoring online user:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
