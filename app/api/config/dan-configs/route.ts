// app/api/dan/configs/route.ts  (o donde esté tu handler)
export const runtime = 'nodejs'; // evita Edge

import { ensureCacheReady, getDan } from '@/lib/cache/core-cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // ⚠️ Los API routes NO pasan por el layout => asegurá la caché acá
        await ensureCacheReady();

        const { searchParams } = new URL(request.url);
        const sanma = searchParams.get('sanma') === 'true';

        const allDanConfigs = getDan();
        const danConfigs = allDanConfigs.filter(c => c.sanma === sanma);

        const clientConfigs = danConfigs.map(c => ({
            rank: c.rank,
            minPoints: c.minPoints,
            maxPoints: c.maxPoints,
            color: c.color,
            cssClass: c.cssClass,
        }));

        return NextResponse.json(clientConfigs);
    } catch (error) {
        console.error('Error fetching DAN configs:', error);
        return NextResponse.json({ error: 'Failed to fetch DAN configs' }, { status: 500 });
    }
}
