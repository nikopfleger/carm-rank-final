import { invalidateRanking } from '@/lib/cache/core-cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    if (!secret || secret !== process.env.RANK_REFRESH_SECRET) {
        return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
    try {
        await invalidateRanking();
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
    }
}


