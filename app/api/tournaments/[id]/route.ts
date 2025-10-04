import { prisma } from '@/lib/database/client';
import { serializeBigInt } from '@/lib/serialize-bigint';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tournamentId = parseInt(id);

        if (isNaN(tournamentId)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid tournament ID'
                },
                { status: 400 }
            );
        }

        const tournament = await prisma.tournament.findUnique({
            where: {
                id: tournamentId
            },
            include: {
                season: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                location: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!tournament) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Tournament not found'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: tournament
        });

    } catch (error) {
        console.error('Error fetching tournament:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error interno del servidor al cargar torneo'
            },
            { status: 500 }
        );
    }
}
