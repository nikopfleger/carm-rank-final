// app/api/dan/configs/route.ts  (o donde esté tu handler)
; // evita Edge

import { ensureCacheReady, getDan, getDanDirect } from '@/lib/cache/core-cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // ⚠️ Los API routes NO pasan por el layout => asegurá la caché acá
        await ensureCacheReady();

        const { searchParams } = new URL(request.url);
        const sanma = searchParams.get('sanma') === 'true';

        let allDanConfigs;
        try {
            allDanConfigs = getDan();
        } catch {
            // Fallback duro a DB cuando no hay cache
            allDanConfigs = await getDanDirect();
        }
        const danConfigs = allDanConfigs.filter((c: any) => c.sanma === sanma);

        const clientConfigs = danConfigs.map((c: any) => ({
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
