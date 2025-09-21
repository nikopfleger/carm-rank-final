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

    const season = await prisma.season.findUnique({
      where: { id }
    });

    if (!season) {
      return NextResponse.json(
        { error: "Temporada no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(season);
  } catch (error) {
    console.error("Error fetching season:", error);
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

    // Si se está cambiando el nombre, verificar que no exista otro
    if (body.name && body.name !== existingSeason.name) {
      const nameExists = await prisma.season.findFirst({
        where: {
          name: body.name,
          deleted: false,
          id: { not: id }
        }
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Ya existe una temporada con ese nombre" },
          { status: 400 }
        );
      }
    }

    const updatedAta: any = {};

    if (body.name !== undefined) updatedAta.name = body.name;
    if (body.description !== undefined) updatedAta.description = body.description;
    if (body.startDate !== undefined) updatedAta.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updatedAta.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.isActive !== undefined) updatedAta.isActive = body.isActive;

    const season = await prisma.season.update({
      where: { id },
      data: updatedAta
    });

    return NextResponse.json(season);
  } catch (error) {
    console.error("Error updating season:", error);
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

    // Soft delete
    await prisma.season.update({
      where: { id },
      data: { deleted: true }
    });

    return NextResponse.json({ message: "Temporada eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting season:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
