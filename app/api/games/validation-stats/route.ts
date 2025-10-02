import { prisma } from '@/lib/database/client';
import { runWithRequestContextAsync } from '@/lib/request-context.server';
import { unstable_noStore as noStore } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
    noStore();

    try {
        const statusCounts = await runWithRequestContextAsync({ includeDeleted: false }, async () =>
            prisma.pendingGame.groupBy({
                by: ['status'],
                where: { deleted: false },
                _count: { id: true },
            })
        );

        const stats = { PENDING: 0, VALIDATED: 0, REJECTED: 0 } as const;
        const out: Record<keyof typeof stats, number> = { PENDING: 0, VALIDATED: 0, REJECTED: 0 };

        statusCounts.forEach((item) => {
            const k = item.status as keyof typeof out;
            if (k in out) out[k] = item._count.id;
        });

        return NextResponse.json(
            { success: true, stats: out },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                    Pragma: 'no-cache',
                    Expires: '0',
                    'CDN-Cache-Control': 'no-store',
                    'Vercel-CDN-Cache-Control': 'no-store',
                },
            }
        );
    } catch (error) {
        console.error('Error fetching validation stats:', error);
        return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
    }
}
