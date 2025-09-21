import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ legajo: string }> }) {
    const { legajo: legajoParam } = await params;
    const legajo = Number(legajoParam);
    if (!Number.isFinite(legajo)) {
        return NextResponse.json({ error: "legajo inválido" }, { status: 400 });
    }
    const player = await prisma.player.findUnique({ where: { playerNumber: legajo } });
    if (!player) return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
    return NextResponse.json(player);
}
