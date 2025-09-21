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

    // Verificar que la regla existe
    const existingRuleset = await prisma.ruleset.findUnique({
      where: { id }
    });

    if (!existingRuleset) {
      return NextResponse.json(
        { error: "Regla no encontrada" },
        { status: 404 }
      );
    }

    if (!existingRuleset.deleted) {
      return NextResponse.json(
        { error: "La regla no está eliminada" },
        { status: 400 }
      );
    }

    // Restaurar (soft delete)
    const ruleset = await prisma.ruleset.update({
      where: { id },
      data: { deleted: false }
    });

    return NextResponse.json({ 
      message: "Regla restaurada correctamente",
      ruleset 
    });
  } catch (error) {
    console.error("Error restoring ruleset:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
