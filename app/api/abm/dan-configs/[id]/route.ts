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

        const danConfig = await (prisma as any).danConfig.findUnique({
            where: { id, deleted: false }
        });

        if (!danConfig) {
            return NextResponse.json(
                { success: false, error: 'Dan config not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: danConfig
        });
    } catch (error) {
        console.error('Error fetching dan config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch dan config' },
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
        const existing = await (prisma as any).danConfig.findUnique({
            where: { id, deleted: false }
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Dan config not found' },
                { status: 404 }
            );
        }

        // Validar que no exista otra configuración con el mismo rank y sanma
        const duplicate = await (prisma as any).danConfig.findFirst({
            where: {
                rank: body.rank,
                sanma: body.sanma,
                deleted: false,
                id: { not: id }
            }
        });

        if (duplicate) {
            return NextResponse.json(
                { success: false, error: 'Ya existe una configuración con este rango y modo' },
                { status: 400 }
            );
        }

        const danConfig = await (prisma as any).danConfig.update({
            where: { id },
            data: {
                rank: body.rank,
                sanma: body.sanma,
                minPoints: parseInt(body.minPoints),
                maxPoints: parseInt(body.maxPoints),
                firstPlace: parseInt(body.firstPlace),
                secondPlace: parseInt(body.secondPlace),
                thirdPlace: parseInt(body.thirdPlace),
                fourthPlace: body.fourthPlace ? parseInt(body.fourthPlace) : null,
                isProtected: body.isProtected,
                color: body.color,
                cssClass: body.cssClass,
                isLastRank: body.isLastRank,
                version: { increment: 1 }
            }
        });

        // Actualizar cache solo para DanConfigs
        await invalidateConfigs();

        return NextResponse.json({
            success: true,
            data: danConfig
        });
    } catch (error) {
        console.error('Error updating dan config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update dan config' },
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
        const existing = await (prisma as any).danConfig.findUnique({
            where: { id, deleted: false }
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Dan config not found' },
                { status: 404 }
            );
        }

        // Soft delete
        await (prisma as any).danConfig.update({
            where: { id },
            data: {
                deleted: true,
                version: { increment: 1 }
            }
        });

        // Actualizar cache solo para DanConfigs
        await invalidateConfigs();

        return NextResponse.json({
            success: true,
            message: 'Dan config deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting dan config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete dan config' },
            { status: 500 }
        );
    }
}
