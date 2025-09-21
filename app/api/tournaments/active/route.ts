import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const tournaments = await prisma.tournament.findMany({
            where: {
                deleted: false,
                // Solo torneos activos (sin fecha de finalización específica)
                // Como endDate no es nullable, usamos una fecha muy futura como indicador
                endDate: { gte: new Date('2099-12-31') }
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

        return NextResponse.json(tournaments);
    } catch (error) {
        console.error("Error fetching active tournaments:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
