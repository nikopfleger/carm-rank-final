import { prisma } from "@/lib/database/client";
import { runWithRequestContext } from "@/lib/request-context.server";
import { ensureAbmManage } from "@/lib/server-authorization";
import { NextRequest, NextResponse } from "next/server";

;

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("q") ?? "";
    const includeDeleted = request.nextUrl.searchParams.get("includeDeleted") === "true";

    const rulesets = await runWithRequestContext({ includeDeleted }, () => prisma.ruleset.findMany({
      where: {
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      include: { uma: true },
      orderBy: { id: "asc" },
    }));

    return NextResponse.json(rulesets);
  } catch (error) {
    console.error("Error fetching rulesets:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authz = await ensureAbmManage();
    if ("error" in authz) return authz.error;

    const body = await request.json();

    // Validar campos requeridos según schema.prisma
    const {
      name,
      umaId,
      oka,
      chonbo,
      aka,
      inPoints,
      outPoints,
      sanma,
      description,
      extraData,
    } = body ?? {};

    if (
      name === undefined ||
      umaId === undefined ||
      oka === undefined ||
      chonbo === undefined ||
      aka === undefined ||
      inPoints === undefined ||
      outPoints === undefined ||
      sanma === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Faltan campos requeridos: name, umaId, oka, chonbo, aka, inPoints, outPoints, sanma",
        },
        { status: 400 }
      );
    }

    // Verificar nombre único (no eliminado)
    const existingRuleset = await prisma.ruleset.findFirst({
      where: { name, deleted: false },
    });

    if (existingRuleset) {
      return NextResponse.json(
        { error: "Ya existe una regla con ese nombre" },
        { status: 400 }
      );
    }

    const createdAt = await prisma.ruleset.create({
      data: {
        name: String(name),
        umaId: Number(umaId),
        oka: Number(oka),
        chonbo: Number(chonbo),
        aka: Boolean(aka),
        inPoints: Number(inPoints),
        outPoints: Number(outPoints),
        sanma: Boolean(sanma),
        extraData: {
          ...(extraData && typeof extraData === "object" ? extraData : {}),
          ...(description ? { description: String(description) } : {}),
        },
      },
      include: { uma: true },
    });

    return NextResponse.json(createdAt, { status: 201 });
  } catch (error) {
    console.error("Error creating ruleset:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
