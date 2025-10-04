import { prisma } from '@/lib/database/client';
import { serializeBigInt } from '@/lib/serialize-bigint';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

; // Necesario para Prisma

export async function POST(request: NextRequest) {
    try {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        });

        if (!token?.email) {
            return NextResponse.json({ valid: false, reason: 'no_token' }, { status: 401 });
        }

        // Verificar estado actual del usuario en la base de datos
        const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: {
                id: true,
                isActive: true,
                sessionInvalidatedAt: true,
                role: true,
                authorities: true
            }
        });

        if (!dbUser) {
            return NextResponse.json({ valid: false, reason: 'user_not_found' }, { status: 401 });
        }

        if (!dbUser.isActive) {
            return NextResponse.json({ valid: false, reason: 'user_inactive' }, { status: 401 });
        }

        // Verificar si la sesión fue invalidada
        if (dbUser.sessionInvalidatedAt && token.iat) {
            const tokenCreatedAt = new Date(token.iat * 1000);
            if (tokenCreatedAt < dbUser.sessionInvalidatedAt) {
                return NextResponse.json({ valid: false, reason: 'session_invalidated' }, { status: 401 });
            }
        }

        return NextResponse.json({
            valid: true,
            user: {
                id: dbUser.id,
                email: token.email,
                role: dbUser.role,
                authorities: dbUser.authorities,
                isActive: dbUser.isActive
            }
        });

    } catch (error) {
        console.error('Error validating session:', error);
        return NextResponse.json({ valid: false, reason: 'server_error' }, { status: 500 });
    }
}
