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

    // Verificar que la temporada existe
    const existingSeason = await prisma.season.findUnique({
      where: { id }
    });

    if (!existingSeason) {
      return NextResponse.json(
        { error: "Temporada no encontrada" },
        { status: 404 }
      );
    }

    if (!existingSeason.deleted) {
      return NextResponse.json(
        { error: "La temporada no está eliminada" },
        { status: 400 }
      );
    }

    // Restaurar (soft delete)
    const season = await prisma.season.update({
      where: { id },
      data: { deleted: false }
    });

    return NextResponse.json({ 
      message: "Temporada restaurada correctamente",
      season 
    });
  } catch (error) {
    console.error("Error restoring season:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
