import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Obtener el primer y último juego
        const [firstGame, lastGame] = await prisma.$transaction([
            prisma.game.findFirst({
                orderBy: { gameDate: 'asc' },
                select: { gameDate: true }
            }),
            prisma.game.findFirst({
                orderBy: { gameDate: 'desc' },
                select: { gameDate: true }
            })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                firstGameDate: firstGame?.gameDate || null,
                lastGameDate: lastGame?.gameDate || null
            }
        });

    } catch (error) {
        console.error('Error getting date range:', error);
        return NextResponse.json(
            { success: false, message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
