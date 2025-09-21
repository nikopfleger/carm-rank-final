import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

interface LocationInput {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    extraData?: any;
}

export async function GET(
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

        const location = await prisma.location.findUnique({
            where: { id: locationId },
            include: {
                _count: {
                    select: {
                        tournaments: true,
                        games: true
                    }
                }
            }
        });

        if (!location) {
            return NextResponse.json(
                { error: "Ubicación no encontrada" },
                { status: 404 }
            );
        }

        return NextResponse.json(location);

    } catch (error) {
        console.error("❌ Error obteniendo ubicación:", error);

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

        const body = await request.json();
        const { name, address, city, country, extraData } = body as LocationInput;

        // Verificar que la ubicación existe
        const existingLocation = await prisma.location.findUnique({
            where: { id: locationId }
        });

        if (!existingLocation) {
            return NextResponse.json(
                { error: "Ubicación no encontrada" },
                { status: 404 }
            );
        }

        if (existingLocation.deleted) {
            return NextResponse.json(
                { error: "No se puede editar una ubicación eliminada" },
                { status: 400 }
            );
        }

        // Validar nombre si se está actualizando
        if (name !== undefined) {
            if (!name || name.trim() === '') {
                return NextResponse.json(
                    { error: "El nombre de la ubicación es requerido" },
                    { status: 400 }
                );
            }

            // Verificar que no exista otra ubicación con el mismo nombre
            const duplicateLocation = await prisma.location.findFirst({
                where: {
                    name: name.trim(),
                    deleted: false,
                    id: { not: locationId }
                }
            });

            if (duplicateLocation) {
                return NextResponse.json(
                    { error: "Ya existe otra ubicación con ese nombre" },
                    { status: 400 }
                );
            }
        }

        // Preparar datos para actualizar
        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (address !== undefined) updateData.address = address?.trim() || null;
        if (city !== undefined) updateData.city = city?.trim() || null;
        if (country !== undefined) updateData.country = country?.trim() || null;
        if (extraData !== undefined) updateData.extraData = extraData;

        const location = await prisma.location.update({
            where: { id: locationId },
            data: updateData,
            include: {
                _count: {
                    select: {
                        tournaments: true,
                        games: true
                    }
                }
            }
        });

        console.log(`✅ Ubicación actualizada: ${location.name} (ID: ${location.id})`);

        return NextResponse.json({
            success: true,
            message: `Ubicación "${location.name}" actualizada exitosamente`,
            data: location
        });

    } catch (error) {
        console.error("❌ Error actualizando ubicación:", error);

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

export async function DELETE(
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

        // Verificar que la ubicación existe
        const existingLocation = await prisma.location.findUnique({
            where: { id: locationId },
            include: {
                _count: {
                    select: {
                        tournaments: true,
                        games: true
                    }
                }
            }
        });

        if (!existingLocation) {
            return NextResponse.json(
                { error: "Ubicación no encontrada" },
                { status: 404 }
            );
        }

        if (existingLocation.deleted) {
            return NextResponse.json(
                { error: "La ubicación ya está eliminada" },
                { status: 400 }
            );
        }

        // Verificar si la ubicación está siendo usada
        if (existingLocation._count.tournaments > 0 || existingLocation._count.games > 0) {
            return NextResponse.json(
                {
                    error: "No se puede eliminar la ubicación porque está siendo utilizada",
                    details: {
                        tournaments: existingLocation._count.tournaments,
                        games: existingLocation._count.games
                    }
                },
                { status: 400 }
            );
        }

        // Eliminar lógicamente
        const location = await prisma.location.update({
            where: { id: locationId },
            data: { deleted: true }
        });

        console.log(`✅ Ubicación eliminada: ${location.name} (ID: ${location.id})`);

        return NextResponse.json({
            success: true,
            message: `Ubicación "${location.name}" eliminada exitosamente`
        });

    } catch (error) {
        console.error("❌ Error eliminando ubicación:", error);

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
