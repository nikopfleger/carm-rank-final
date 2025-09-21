import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const locationId = parseInt(id);

        if (!locationId || isNaN(locationId)) {
            return NextResponse.json(
                { error: "ID de ubicación inválido" },
                { status: 400 }
            );
        }

        // Verificar que la ubicación existe y está eliminada
        const existingLocation = await prisma.location.findUnique({
            where: { id: locationId }
        });

        if (!existingLocation) {
            return NextResponse.json(
                { error: "Ubicación no encontrada" },
                { status: 404 }
            );
        }

        if (!existingLocation.deleted) {
            return NextResponse.json(
                { error: "La ubicación no está eliminada" },
                { status: 400 }
            );
        }

        // Verificar que no existe otra ubicación activa con el mismo nombre
        const duplicateLocation = await prisma.location.findFirst({
            where: {
                name: existingLocation.name,
                deleted: false,
                id: { not: locationId }
            }
        });

        if (duplicateLocation) {
            return NextResponse.json(
                { error: "Ya existe una ubicación activa con ese nombre" },
                { status: 400 }
            );
        }

        // Restaurar la ubicación
        const location = await prisma.location.update({
            where: { id: locationId },
            data: { deleted: false },
            include: {
                _count: {
                    select: {
                        tournaments: true,
                        games: true
                    }
                }
            }
        });

        console.log(`✅ Ubicación restaurada: ${location.name} (ID: ${location.id})`);

        return NextResponse.json({
            success: true,
            message: `Ubicación "${location.name}" restaurada exitosamente`,
            data: location
        });

    } catch (error) {
        console.error("❌ Error restaurando ubicación:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Error interno del servidor",
                message: error instanceof Error ? error.message : "Error desconocido"
            },
            { status: 500 }
        );
    }
}
