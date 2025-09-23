import { invalidateConfigs } from '@/lib/cache/core-cache';
import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        const seasonConfig = await (prisma as any).seasonConfig.findUnique({
            where: { id, deleted: false }
        });

        if (!seasonConfig) {
            return NextResponse.json(
                { success: false, error: 'Season config not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: seasonConfig
        });
    } catch (error) {
        console.error('Error fetching season config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch season config' },
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
        const body = await request.json();

        // Verificar que existe
        const existing = await (prisma as any).seasonConfig.findUnique({
            where: { id, deleted: false }
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Season config not found' },
                { status: 404 }
            );
        }

        // Validar que no exista otra configuración con el mismo nombre, sanma y seasonId
        const duplicate = await (prisma as any).seasonConfig.findFirst({
            where: {
                name: body.name,
                sanma: body.sanma,
                seasonId: body.seasonId || null,
                deleted: false,
                id: { not: id }
            }
        });

        if (duplicate) {
            return NextResponse.json(
                { success: false, error: 'Ya existe una configuración con este nombre, modo y temporada' },
                { status: 400 }
            );
        }

        // Si es configuración por defecto, validar que no exista otra por defecto para el mismo sanma
        if (body.isDefault) {
            const defaultExisting = await (prisma as any).seasonConfig.findFirst({
                where: {
                    sanma: body.sanma,
                    isDefault: true,
                    deleted: false,
                    id: { not: id }
                }
            });

            if (defaultExisting) {
                return NextResponse.json(
                    { success: false, error: 'Ya existe una configuración por defecto para este modo' },
                    { status: 400 }
                );
            }
        }

        const seasonConfig = await (prisma as any).seasonConfig.update({
            where: { id },
            data: {
                name: body.name,
                sanma: body.sanma,
                firstPlace: parseInt(body.firstPlace),
                secondPlace: parseInt(body.secondPlace),
                thirdPlace: parseInt(body.thirdPlace),
                fourthPlace: body.fourthPlace ? parseInt(body.fourthPlace) : null,
                seasonId: body.seasonId ? parseInt(body.seasonId) : null,
                isDefault: body.isDefault,
                version: { increment: 1 }
            }
        });

        // Actualizar cache solo para SeasonConfigs
        await invalidateConfigs();

        return NextResponse.json({
            success: true,
            data: seasonConfig
        });
    } catch (error) {
        console.error('Error updating season config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update season config' },
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

        // Verificar que existe
        const existing = await (prisma as any).seasonConfig.findUnique({
            where: { id, deleted: false }
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Season config not found' },
                { status: 404 }
            );
        }

        // Soft delete
        await (prisma as any).seasonConfig.update({
            where: { id },
            data: {
                deleted: true,
                version: { increment: 1 }
            }
        });

        // Actualizar cache solo para SeasonConfigs
        await invalidateConfigs();

        return NextResponse.json({
            success: true,
            message: 'Season config deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting season config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete season config' },
            { status: 500 }
        );
    }
}
