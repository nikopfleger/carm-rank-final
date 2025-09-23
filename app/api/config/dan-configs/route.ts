import { getDan } from '@/lib/cache/core-cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sanma = searchParams.get('sanma') === 'true';

        const allDanConfigs = getDan();
        const danConfigs = allDanConfigs.filter(config => config.sanma === sanma);

        // Transformar a formato que espera el cliente
        const clientConfigs = danConfigs.map(config => ({
            rank: config.rank,
            minPoints: config.minPoints,
            maxPoints: config.maxPoints,
            color: config.color,
            cssClass: config.cssClass
        }));

        return NextResponse.json(clientConfigs);
    } catch (error) {
        console.error('Error fetching DAN configs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch DAN configs' },
            { status: 500 }
        );
    }
}
