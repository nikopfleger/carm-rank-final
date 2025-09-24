import { prisma } from '@/lib/database/client';

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

;

// GET /api/players/check-legajo?legajo=xxx&excludeId=xxx
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const legajo = searchParams.get('legajo');
        const excludeId = searchParams.get('excludeId');

        if (!legajo) {
            return NextResponse.json({ error: 'Legajo is required' }, { status: 400 });
        }

        const legajoNumber = parseInt(legajo);
        if (isNaN(legajoNumber)) {
            return NextResponse.json({ error: 'Legajo must be a number' }, { status: 400 });
        }

        const whereClause: any = {
            playerNumber: legajoNumber,
            deleted: false
        };

        if (excludeId) {
            whereClause.id = { not: parseInt(excludeId) };
        }

        const existingPlayer = await prisma.player.findFirst({
            where: whereClause,
            select: { id: true }
        });

        return NextResponse.json({
            available: !existingPlayer,
            legajo: legajoNumber
        });

    } catch (error) {
        console.error('Error checking legajo:', error);
        return NextResponse.json(
            { error: 'Failed to check legajo availability' },
            { status: 500 }
        );
    }
}
