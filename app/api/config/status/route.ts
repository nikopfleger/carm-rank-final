import { getCacheStatus } from '@/lib/cache/core-cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const status = getCacheStatus();

        return NextResponse.json({
            success: true,
            data: status,
        });
    } catch (error) {
        console.error('Error getting config status:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to get configuration status'
            },
            { status: 500 }
        );
    }
}
