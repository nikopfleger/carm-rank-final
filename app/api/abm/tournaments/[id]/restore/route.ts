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

    // Verificar que el torneo existe
    const existingTournament = await prisma.tournament.findUnique({
      where: { id }
    });

    if (!existingTournament) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    if (!existingTournament.deleted) {
      return NextResponse.json(
        { error: "El torneo no está eliminado" },
        { status: 400 }
      );
    }

    // Restaurar (soft delete)
    const tournament = await prisma.tournament.update({
      where: { id },
      data: { deleted: false },
      include: {
        season: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: "Torneo restaurado correctamente",
      tournament 
    });
  } catch (error) {
    console.error("Error restoring tournament:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
