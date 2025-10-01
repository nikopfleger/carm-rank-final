import { redisCache } from '@/lib/cache/redis-wrapper';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const status = await redisCache.getStatus();

        return NextResponse.json({
            success: true,
            redis: status,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error checking Redis health:', error);
        return NextResponse.json(
            {
                success: false,
                redis: { enabled: false, provider: 'none', connected: false },
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
