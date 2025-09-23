// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(_request: NextRequest) {
    // No inicializamos nada aquí. Solo dejar pasar.
    return NextResponse.next();
}

export const config = {
    // Aplica a todo salvo archivos estáticos y API
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
};
