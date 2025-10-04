import { prisma } from '@/lib/database/client';
import { serializeBigInt } from '@/lib/serialize-bigint';
import { logToTerminal } from '@/lib/terminal-logger';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

;

export async function GET(request: NextRequest) {
    const start = Date.now();

    try {
        const { searchParams } = new URL(request.url);

        // Helpers de parseo seguro
        const toInt = (v: string | null) => {
            if (v == null || v === '') return null;
            const n = Number(v);
            return Number.isFinite(n) ? n : null;
        };
        const toDate = (v: string | null) => {
            if (v == null || v === '') return null;
            const d = new Date(v);
            return isNaN(d.getTime()) ? null : d;
        };
        const toBool = (v: string | null) => {
            if (v == null || v === '') return null;
            if (v === 'true' || v === '1') return true;
            if (v === 'false' || v === '0') return false;
            return null; // ignoro valores raros
        };
        const cleanIntArray = (v: string | null) =>
            !v
                ? []
                : v
                    .split(',')
                    .map((s) => Number(s.trim()))
                    .filter((n) => Number.isFinite(n));

        // Paginación
        const page = toInt(searchParams.get('page')) ?? 1;
        const limit = Math.min(200, toInt(searchParams.get('limit')) ?? 20);
        const offset = (page - 1) * limit;

        // Filtros
        const dateFrom = toDate(searchParams.get('dateFrom'));
        const dateToRaw = toDate(searchParams.get('dateTo'));
        const dateTo = dateToRaw ? new Date(new Date(dateToRaw).setHours(23, 59, 59, 999)) : null;

        const seasonId = toInt(searchParams.get('seasonId'));
        const gameType = (searchParams.get('gameType') || '').trim();
        const locationId = toInt(searchParams.get('locationId'));
        const playerIdArray = cleanIntArray(searchParams.get('playerIds'));

        // where seguro (sin NaN)
        const where: any = {};
        if (dateFrom || dateTo) {
            where.gameDate = {};
            if (dateFrom) where.gameDate.gte = dateFrom;
            if (dateTo) where.gameDate.lte = dateTo;
        }
        if (seasonId != null) where.seasonId = seasonId;
        if (gameType) where.gameType = gameType;
        if (locationId != null) where.locationId = locationId;
        if (playerIdArray.length) {
            where.gameResults = { some: { playerId: { in: playerIdArray } } };
        }

        // Una sola ida a la BD

        const [total, games] = await prisma.$transaction([
            prisma.game.count({ where }),
            prisma.game.findMany({
                where,
                include: {
                    gameResults: {
                        include: {
                            player: {
                                select: {
                                    id: true,
                                    nickname: true,
                                    playerNumber: true, // si es BigInt -> lo convierto más abajo
                                    fullname: true,
                                },
                            },
                        },
                        orderBy: { finalPosition: 'asc' },
                    },
                    location: { select: { id: true, name: true, city: true } },
                    season: { select: { id: true, name: true, isActive: true } },
                },
                orderBy: [{ gameDate: 'desc' }, { id: 'desc' }],
                skip: offset,
                take: limit,
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        // Sanitizador recursivo para BigInt/Decimal/Date
        const sanitize = (val: any): any => {
            if (typeof val === 'bigint') return Number(val);
            if (val instanceof Date) return val.toISOString();
            if (val && typeof val === 'object') {
                // Prisma Decimal
                if (typeof (val as any).toNumber === 'function') {
                    try { return (val as any).toNumber(); } catch { return String(val); }
                }
                if (Array.isArray(val)) return val.map(sanitize);
                const out: any = {};
                for (const k in val) out[k] = sanitize(val[k]);
                return out;
            }
            return val;
        };

        const response = NextResponse.json(
            sanitize({
                success: true,
                data: {
                    games: games.map(game => ({
                        id: game.id,
                        gameDate: game.gameDate,
                        gameType: game.gameType,
                        isValidated: game.isValidated,
                        extraData: game.extraData,
                        location: game.location,
                        season: game.season,
                        gameResults: game.gameResults.map(result => ({
                            id: result.id,
                            playerId: result.playerId,
                            finalPosition: result.finalPosition,
                            finalScore: Number(result.finalScore), // Ya está en la escala correcta en la base
                            danPointsEarned: result.danPointsEarned,
                            rateChange: result.rateChange,
                            player: result.player
                        }))
                    })),
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages,
                        hasMore: page < totalPages,
                    },
                },
            })
        );

        const duration = Date.now() - start;
        logToTerminal(request, response, duration);

        return response;
    } catch (error: any) {
        console.error('API History: Error completo:', error);
        return NextResponse.json(
            { success: false, message: error?.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
    // ⚠️ Importante: no llames prisma.$disconnect() en un handler.
}
