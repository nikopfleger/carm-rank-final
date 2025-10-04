import { prisma } from "@/lib/database/client";
import { serializeBigInt } from "@/lib/serialize-bigint";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const tournaments = await prisma.tournament.findMany({
            where: {
                deleted: false,
                // Solo torneos activos (no completados)
                isCompleted: false
            },
            select: {
                id: true,
                name: true,
                startDate: true,
                type: true
            },
            orderBy: {
                startDate: 'desc'
            }
        });

        return NextResponse.json(serializeBigInt(tournaments));
    } catch (error) {
        console.error("Error fetching active tournaments:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
