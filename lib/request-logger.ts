// ============================================================================
// 📡 INTERCEPTOR DE REQUESTS CON TIMESTAMPS
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

export function logRequest(request: NextRequest, response: NextResponse, duration?: number) {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    const method = request.method;
    const url = request.url;
    const status = response.status;
    const statusEmoji = getStatusEmoji(status);
    const durationStr = duration ? ` (${duration}ms)` : '';

    console.log(`${timestamp} ${statusEmoji} ${method} ${url} ${status}${durationStr}`);
}

function getStatusEmoji(status: number): string {
    if (status >= 200 && status < 300) return '✅';
    if (status >= 300 && status < 400) return '🔄';
    if (status >= 400 && status < 500) return '⚠️';
    if (status >= 500) return '🚨';
    return '❓';
}

// Middleware para medir duración de requests
export function withRequestLogging(handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
        const start = Date.now();
        const response = await handler(request, ...args);
        const duration = Date.now() - start;

        logRequest(request, response, duration);
        return response;
    };
}
