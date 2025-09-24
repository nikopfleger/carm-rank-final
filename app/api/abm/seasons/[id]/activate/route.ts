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

        // Verificar que la temporada existe
        const season = await prisma.season.findUnique({
            where: { id }
        });

        if (!season) {
            return NextResponse.json(
                { success: false, error: "Temporada no encontrada" },
                { status: 404 }
            );
        }

        // Desactivar todas las temporadas activas
        await prisma.season.updateMany({
            where: { isActive: true },
            data: { isActive: false }
        });

        // Activar la temporada seleccionada
        const updatedSeason = await prisma.season.update({
            where: { id },
            data: { isActive: true }
        });

        return NextResponse.json({
            success: true,
            data: updatedSeason,
            message: "Temporada activada correctamente"
        });
    } catch (error) {
        console.error("Error activating season:", error);
        return NextResponse.json(
            { success: false, error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
