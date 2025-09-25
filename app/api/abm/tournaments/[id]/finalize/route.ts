import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: "ID inválido" },
                { status: 400 }
            );
        }

        // Verificar que el torneo existe
        const tournament = await prisma.tournament.findUnique({
            where: { id }
        });

        if (!tournament) {
            return NextResponse.json(
                { success: false, error: "Torneo no encontrado" },
                { status: 404 }
            );
        }

        if (tournament.isCompleted) {
            return NextResponse.json(
                { success: false, error: "El torneo ya está finalizado" },
                { status: 400 }
            );
        }

        // Finalizar el torneo
        const updatedTournament = await prisma.tournament.update({
            where: { id },
            data: { isCompleted: true }
        });

        return NextResponse.json({
            success: true,
            data: updatedTournament,
            message: "Torneo finalizado correctamente"
        });
    } catch (error) {
        console.error("Error finalizing tournament:", error);
        return NextResponse.json(
            { success: false, error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
