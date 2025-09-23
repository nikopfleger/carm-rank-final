import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

;

// GET /api/players/check-nickname?nickname=xxx&excludeId=xxx
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const nickname = searchParams.get('nickname');
        const excludeId = searchParams.get('excludeId');

        if (!nickname) {
            return NextResponse.json({ error: 'Nickname is required' }, { status: 400 });
        }

        const whereClause: any = {
            nickname: nickname.trim(),
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
            nickname: nickname.trim()
        });

    } catch (error) {
        console.error('Error checking nickname:', error);
        return NextResponse.json(
            { error: 'Failed to check nickname availability' },
            { status: 500 }
        );
    }
}
