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
                { success: false, error: "ID inválido" },
                { status: 400 }
            );
        }

        const season = await prisma.season.findUnique({
            where: { id }
        });

        if (!season) {
            return NextResponse.json(
                { success: false, error: "Temporada no encontrada" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: season
        });
    } catch (error) {
        console.error("Error fetching season:", error);
        return NextResponse.json(
            { success: false, error: "Error interno del servidor" },
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
                { success: false, error: "ID inválido" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const expectedVersion = Number(body?.version ?? body?.__expectedVersion ?? body?.expectedVersion);
        if (!Number.isFinite(expectedVersion)) {
            return NextResponse.json({ success: false, error: "Falta versión para optimistic locking" }, { status: 409 });
        }

        // Verificar que la temporada existe
        const existingSeason = await prisma.season.findUnique({
            where: { id }
        });

        if (!existingSeason) {
            return NextResponse.json(
                { success: false, error: "Temporada no encontrada" },
                { status: 404 }
            );
        }

        // Si se está cambiando el nombre, verificar que no exista otro
        if (body.name && body.name !== existingSeason.name) {
            const nameExists = await prisma.season.findFirst({
                where: {
                    name: body.name,
                    deleted: false,
                    id: { not: id }
                }
            });

            if (nameExists) {
                return NextResponse.json(
                    { success: false, error: "Ya existe una temporada con ese nombre" },
                    { status: 400 }
                );
            }
        }

        const updatedData: any = {};

        if (body.name !== undefined) updatedData.name = body.name;
        if (body.description !== undefined) updatedData.description = body.description;
        if (body.startDate !== undefined) updatedData.startDate = new Date(body.startDate);
        if (body.endDate !== undefined) updatedData.endDate = body.endDate ? new Date(body.endDate) : null;
        if (body.isActive !== undefined) updatedData.isActive = body.isActive;
        if (body.isClosed !== undefined) updatedData.isClosed = body.isClosed;

        const season = await prisma.season.update({
            where: { id, version: expectedVersion },
            data: updatedData
        });

        return NextResponse.json({
            success: true,
            data: season
        });
    } catch (error) {
        console.error("Error updating season:", error);
        return NextResponse.json(
            { success: false, error: "Error interno del servidor" },
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
                { success: false, error: "ID inválido" },
                { status: 400 }
            );
        }

        // Verificar que la temporada existe
        const existingSeason = await prisma.season.findUnique({
            where: { id }
        });

        if (!existingSeason) {
            return NextResponse.json(
                { success: false, error: "Temporada no encontrada" },
                { status: 404 }
            );
        }

        // Soft delete mediante interceptor
        await prisma.season.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: "Temporada eliminada correctamente"
        });
    } catch (error) {
        console.error("Error deleting season:", error);
        return NextResponse.json(
            { success: false, error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
