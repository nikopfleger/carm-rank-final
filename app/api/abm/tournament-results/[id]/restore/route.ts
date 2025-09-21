import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";

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

    // Verificar que el resultado existe
    const existingResult = await prisma.tournamentResult.findUnique({
      where: { id }
    });

    if (!existingResult) {
      return NextResponse.json(
        { error: "Resultado de torneo no encontrado" },
        { status: 404 }
      );
    }

    if (!existingResult.deleted) {
      return NextResponse.json(
        { error: "El resultado de torneo no está eliminado" },
        { status: 400 }
      );
    }

    // Restaurar (soft delete)
    const tournamentResult = await prisma.tournamentResult.update({
      where: { id },
      data: { deleted: false },
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
      }
    });

    return NextResponse.json({ 
      message: "Resultado de torneo restaurado correctamente",
      tournamentResult 
    });
  } catch (error) {
    console.error("Error restoring tournament result:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
