import { prisma } from "@/lib/database/client";
import { runWithRequestContext } from "@/lib/request-context.server";
import { NextRequest, NextResponse } from "next/server";

;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const umas = await runWithRequestContext({ includeDeleted }, () => prisma.uma.findMany({
      where: {
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: [{ id: "asc" }]
    }));

    return NextResponse.json(umas);
  } catch (error) {
    console.error("Error fetching UMA:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar campos requeridos
    if (!body.name) {
      return NextResponse.json(
        { error: "Falta el campo requerido: name" },
        { status: 400 }
      );
    }

    // Verificar que el nombre no exista
    const existingUma = await prisma.uma.findFirst({
      where: {
        name: body.name,
        deleted: false
      }
    });

    if (existingUma) {
      return NextResponse.json(
        { error: "Ya existe un UMA con ese nombre" },
        { status: 400 }
      );
    }

    const uma = await prisma.uma.create({
      data: {
        name: body.name,
        firstPlace: body.firstPlace || 30,
        secondPlace: body.secondPlace || 10,
        thirdPlace: body.thirdPlace || -10,
        fourthPlace: body.fourthPlace || -30
      }
    });

    return NextResponse.json(uma, { status: 201 });
  } catch (error) {
    console.error("Error creating UMA:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
