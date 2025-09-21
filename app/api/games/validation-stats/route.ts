import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Simple COUNT con GROUP BY status
        const statusCounts = await prisma.pendingGame.groupBy({
            by: ['status'],
            where: {
                deleted: false
            },
            _count: {
                id: true
            }
        });

        // Convertir a formato más fácil de usar
        const stats = {
            PENDING: 0,
            VALIDATED: 0,
            REJECTED: 0
        };

        statusCounts.forEach(item => {
            stats[item.status as keyof typeof stats] = item._count.id;
        });

        return NextResponse.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Error fetching validation stats:', error);
        return NextResponse.json(
            { success: false, message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
