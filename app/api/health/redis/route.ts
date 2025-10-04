import { getRedisCache } from '@/lib/cache/redis-wrapper';
import { serializeBigInt } from '@/lib/serialize-bigint';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const redisCache = getRedisCache();
        const status = redisCache ? await redisCache.getStatus() : { enabled: false, provider: 'none', connected: false };

        return NextResponse.json({
            success: true,
            redis: status,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.warn('⚠️ Error checking Redis health (fallback to DB):', error);
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
