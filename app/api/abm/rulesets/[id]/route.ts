import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

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

    const ruleset = await prisma.ruleset.findUnique({
      where: { id }
    });

    if (!ruleset) {
      return NextResponse.json(
        { error: "Regla no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(ruleset);
  } catch (error) {
    console.error("Error fetching ruleset:", error);
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

    // Si se está cambiando el nombre, verificar que no exista otro
    if (body.name && body.name !== existingRuleset.name) {
      const nameExists = await prisma.ruleset.findFirst({
        where: {
          name: body.name,
          deleted: false,
          id: { not: id }
        }
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Ya existe una regla con ese nombre" },
          { status: 400 }
        );
      }
    }

    const updatedAta: any = {};

    if (body.name !== undefined) updatedAta.name = body.name;
    if (body.description !== undefined) updatedAta.description = body.description;
    if (body.isActive !== undefined) updatedAta.isActive = body.isActive;

    const ruleset = await prisma.ruleset.update({
      where: { id },
      data: updatedAta
    });

    return NextResponse.json(ruleset);
  } catch (error) {
    console.error("Error updating ruleset:", error);
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

    // Soft delete
    await prisma.ruleset.update({
      where: { id },
      data: { deleted: true }
    });

    return NextResponse.json({ message: "Regla eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting ruleset:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
