import { invalidateConfigs } from '@/lib/cache/core-cache';
import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

;

export async function GET(request: NextRequest) {
    try {
        const seasonConfigs = await (prisma as any).seasonConfig.findMany({
            where: { deleted: false },
            orderBy: [
                { sanma: 'asc' },
                { isDefault: 'desc' },
                { seasonId: 'asc' },
                { name: 'asc' }
            ]
        });

        return NextResponse.json({
            success: true,
            data: seasonConfigs
        });
    } catch (error) {
        console.error('Error fetching season configs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch season configs' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validar que no exista una configuración con el mismo nombre, sanma y seasonId
        const existing = await (prisma as any).seasonConfig.findFirst({
            where: {
                name: body.name,
                sanma: body.sanma,
                seasonId: body.seasonId || null,
                deleted: false
            }
        });

        if (existing) {
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
                    deleted: false
                }
            });

            if (defaultExisting) {
                return NextResponse.json(
                    { success: false, error: 'Ya existe una configuración por defecto para este modo' },
                    { status: 400 }
                );
            }
        }

        const seasonConfig = await (prisma as any).seasonConfig.create({
            data: {
                name: body.name,
                sanma: body.sanma,
                firstPlace: parseInt(body.firstPlace),
                secondPlace: parseInt(body.secondPlace),
                thirdPlace: parseInt(body.thirdPlace),
                fourthPlace: body.fourthPlace ? parseInt(body.fourthPlace) : null,
                seasonId: body.seasonId ? parseInt(body.seasonId) : null,
                isDefault: body.isDefault,
            }
        });

        // Actualizar cache solo para SeasonConfigs
        await invalidateConfigs();

        return NextResponse.json({
            success: true,
            data: seasonConfig
        });
    } catch (error) {
        console.error('Error creating season config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create season config' },
            { status: 500 }
        );
    }
}
