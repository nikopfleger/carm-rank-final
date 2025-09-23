import { getCacheStatus, getColors, getDan, getRate, getSeasons } from '@/lib/cache/core-cache';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const dan = getDan();
        const rate = getRate();
        const seasons = getSeasons();
        const colors = getColors();
        const status = getCacheStatus();

        return NextResponse.json({
            success: true,
            data: {
                dan,
                rate,
                seasons,
                colors
            },
            status,
            message: 'Configurations retrieved from cache'
        });

    } catch (error) {
        console.error('Error in GET /api/config/cache:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch configurations',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
