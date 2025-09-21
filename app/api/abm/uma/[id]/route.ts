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

    const uma = await prisma.uma.findUnique({
      where: { id }
    });

    if (!uma) {
      return NextResponse.json(
        { error: "UMA no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(uma);
  } catch (error) {
    console.error("Error fetching UMA:", error);
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

    // Si se está cambiando el nombre, verificar que no exista otro
    if (body.name && body.name !== existingUma.name) {
      const nameExists = await prisma.uma.findFirst({
        where: {
          name: body.name,
          deleted: false,
          id: { not: id }
        }
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Ya existe un UMA con ese nombre" },
          { status: 400 }
        );
      }
    }

    const updatedAta: any = {};

    if (body.name !== undefined) updatedAta.name = body.name;
    if (body.firstPlace !== undefined) updatedAta.firstPlace = parseInt(body.firstPlace);
    if (body.secondPlace !== undefined) updatedAta.secondPlace = parseInt(body.secondPlace);
    if (body.thirdPlace !== undefined) updatedAta.thirdPlace = parseInt(body.thirdPlace);
    if (body.fourthPlace !== undefined) updatedAta.fourthPlace = parseInt(body.fourthPlace);

    const uma = await prisma.uma.update({
      where: { id },
      data: updatedAta
    });

    return NextResponse.json(uma);
  } catch (error) {
    console.error("Error updating UMA:", error);
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

    // Soft delete
    await prisma.uma.update({
      where: { id },
      data: { deleted: true }
    });

    return NextResponse.json({ message: "UMA eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting UMA:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
