import { configCache } from '@/lib/config-cache';
import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const rateConfigs = await (prisma as any).rateConfig.findMany({
            where: { deleted: false },
            orderBy: [
                { sanma: 'asc' },
                { name: 'asc' }
            ]
        });

        return NextResponse.json({
            success: true,
            data: rateConfigs
        });
    } catch (error) {
        console.error('Error fetching rate configs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch rate configs' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validar que no exista una configuración con el mismo nombre y sanma
        const existing = await (prisma as any).rateConfig.findFirst({
            where: {
                name: body.name,
                sanma: body.sanma,
                deleted: false
            }
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Ya existe una configuración con este nombre y modo' },
                { status: 400 }
            );
        }

        const rateConfig = await (prisma as any).rateConfig.create({
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
            }
        });

        // Actualizar cache solo para RateConfigs
        await configCache.refreshRateConfigs(prisma as any);

        return NextResponse.json({
            success: true,
            data: rateConfig
        });
    } catch (error) {
        console.error('Error creating rate config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create rate config' },
            { status: 500 }
        );
    }
}
