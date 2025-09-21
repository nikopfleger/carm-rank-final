import { logToTerminal } from '@/lib/terminal-logger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const start = Date.now();

    try {
        const timestamp = new Date().toISOString();

        const response = NextResponse.json({
            status: 'ok',
            service: 'CARM Rank API',
            heartbeat: true,
            timestamp,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        });

        const duration = Date.now() - start;
        logToTerminal(request, response, duration);

        return response;
    } catch (error) {
        const response = NextResponse.json(
            {
                status: 'error',
                service: 'CARM Rank API',
                heartbeat: false,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );

        const duration = Date.now() - start;
        logToTerminal(request, response, duration);

        return response;
    }
}
