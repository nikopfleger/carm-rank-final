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

    // Verificar que el UMA existe
    const existingUma = await prisma.uma.findUnique({
      where: { id }
    });

    if (!existingUma) {
      return NextResponse.json(
        { error: "UMA no encontrado" },
        { status: 404 }
      );
    }

    if (!existingUma.deleted) {
      return NextResponse.json(
        { error: "El UMA no está eliminado" },
        { status: 400 }
      );
    }

    // Restaurar (soft delete)
    const uma = await prisma.uma.update({
      where: { id },
      data: { deleted: false }
    });

    return NextResponse.json({ 
      message: "UMA restaurado correctamente",
      uma 
    });
  } catch (error) {
    console.error("Error restoring UMA:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
