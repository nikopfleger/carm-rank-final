import { getConfigStatus } from '@/lib/config-initializer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const status = getConfigStatus();

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
