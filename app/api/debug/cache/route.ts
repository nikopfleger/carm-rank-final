import { getCacheStatus, isCacheReady } from '@/lib/cache/core-cache';
import { serializeBigInt } from '@/lib/serialize-bigint';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const status = getCacheStatus();
        const ready = isCacheReady();

        console.log('🔍 Debug cache status:', { status, ready });

        return NextResponse.json({
            success: true,
            ready,
            status,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error getting cache status:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                ready: false,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
