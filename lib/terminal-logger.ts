// ============================================================================
// 🖥️ LOGGER PARA TERMINAL DE NEXT.JS
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

export function logToTerminal(request: NextRequest, response: NextResponse, duration?: number) {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    const method = request.method;
    const url = new URL(request.url).pathname;
    const status = response.status;
    const statusEmoji = getStatusEmoji(status);
    const durationStr = duration ? ` (${duration}ms)` : '';

    // Log directo a la terminal de Next.js
    console.log(`${timestamp} ${statusEmoji} ${method} ${url} ${status}${durationStr}`);
}

function getStatusEmoji(status: number): string {
    if (status >= 200 && status < 300) return '✅';
    if (status >= 300 && status < 400) return '🔄';
    if (status >= 400 && status < 500) return '⚠️';
    if (status >= 500) return '🚨';
    return '❓';
}

// Función para interceptar requests en terminal
export function withTerminalLogging(handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
        const start = Date.now();
        const response = await handler(request, ...args);
        const duration = Date.now() - start;

        logToTerminal(request, response, duration);
        return response;
    };
}
