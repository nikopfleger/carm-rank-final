import { invalidateConfigs } from '@/lib/cache/core-cache';
import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

;

export async function GET(request: NextRequest) {
    try {
        const danConfigs = await (prisma as any).danConfig.findMany({
            where: { deleted: false },
            orderBy: [
                { sanma: 'asc' },
                { rank: 'asc' }
            ]
        });

        return NextResponse.json({
            success: true,
            data: danConfigs
        });
    } catch (error) {
        console.error('Error fetching dan configs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch dan configs' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validar que no exista una configuración con el mismo rank y sanma
        const existing = await (prisma as any).danConfig.findFirst({
            where: {
                rank: body.rank,
                sanma: body.sanma,
                deleted: false
            }
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Ya existe una configuración con este rango y modo' },
                { status: 400 }
            );
        }

        const danConfig = await (prisma as any).danConfig.create({
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
            }
        });

        // Actualizar cache solo para DanConfigs
        await invalidateConfigs();

        return NextResponse.json({
            success: true,
            data: danConfig
        });
    } catch (error) {
        console.error('Error creating dan config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create dan config' },
            { status: 500 }
        );
    }
}
