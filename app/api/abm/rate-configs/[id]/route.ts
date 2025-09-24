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

        const rateConfig = await (prisma as any).rateConfig.findUnique({
            where: { id, deleted: false }
        });

        if (!rateConfig) {
            return NextResponse.json(
                { success: false, error: 'Rate config not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: rateConfig
        });
    } catch (error) {
        console.error('Error fetching rate config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch rate config' },
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
        const expectedVersion = Number((body as any)?.version ?? (body as any)?.__expectedVersion ?? (body as any)?.expectedVersion);
        if (!Number.isFinite(expectedVersion)) {
            return NextResponse.json({ success: false, error: 'Falta versión para optimistic locking' }, { status: 409 });
        }

        // Verificar que existe
        const existing = await (prisma as any).rateConfig.findUnique({
            where: { id, deleted: false }
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Rate config not found' },
                { status: 404 }
            );
        }

        // Validar que no exista otra configuración con el mismo nombre y sanma
        const duplicate = await (prisma as any).rateConfig.findFirst({
            where: {
                name: body.name,
                sanma: body.sanma,
                deleted: false,
                id: { not: id }
            }
        });

        if (duplicate) {
            return NextResponse.json(
                { success: false, error: 'Ya existe una configuración con este nombre y modo' },
                { status: 400 }
            );
        }

        const rateConfig = await (prisma as any).rateConfig.update({
            where: { id, version: expectedVersion },
            data: {
                name: body.name,
                sanma: body.sanma,
                firstPlace: parseInt(body.firstPlace),
                secondPlace: parseInt(body.secondPlace),
                thirdPlace: parseInt(body.thirdPlace),
                fourthPlace: body.fourthPlace ? parseInt(body.fourthPlace) : null,
                adjustmentRate: parseFloat(body.adjustmentRate),
                adjustmentLimit: parseInt(body.adjustmentLimit),
                minAdjustment: parseFloat(body.minAdjustment),
                version: { increment: 1 }
            }
        });

        // Actualizar cache solo para RateConfigs
        await invalidateConfigs();

        return NextResponse.json({
            success: true,
            data: rateConfig
        });
    } catch (error) {
        console.error('Error updating rate config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update rate config' },
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
        const existing = await (prisma as any).rateConfig.findUnique({
            where: { id, deleted: false }
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Rate config not found' },
                { status: 404 }
            );
        }

        // Soft delete mediante interceptor
        await (prisma as any).rateConfig.delete({
            where: { id }
        });

        // Actualizar cache solo para RateConfigs
        await invalidateConfigs();

        return NextResponse.json({
            success: true,
            message: 'Rate config deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting rate config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete rate config' },
            { status: 500 }
        );
    }
}
