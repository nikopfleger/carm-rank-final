import { prisma } from '@/lib/database/client';
import { serializeBigInt } from '@/lib/serialize-bigint';
import { NextRequest, NextResponse } from 'next/server';

;

// GET /api/abm/season-results - Get all season results
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const seasonId = searchParams.get('seasonId');
        const includeDeleted = searchParams.get('includeDeleted') === 'true';
        const search = searchParams.get('search');

        const where: any = {
            deleted: includeDeleted ? undefined : false,
        };

        if (seasonId) {
            where.seasonId = parseInt(seasonId);
        }

        if (search) {
            where.player = {
                nickname: {
                    contains: search,
                    mode: 'insensitive'
                }
            };
        }

        const seasonResults = await (prisma as any).seasonResult.findMany({
            where,
            include: {
                player: {
                    select: {
                        id: true,
                        nickname: true,
                        fullname: true,
                    }
                },
                season: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: [
                { seasonId: 'asc' },
                { seasonPoints: 'desc' },
                { player: { nickname: 'asc' } }
            ]
        });

        return NextResponse.json(serializeBigInt(seasonResults));
    } catch (error) {
        console.error('Error fetching season results:', error);
        return NextResponse.json(
            { error: 'Failed to fetch season results' },
            { status: 500 }
        );
    }
}

// POST /api/abm/season-results - Create a new season result
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            seasonId,
            playerId,
            isSanma = false,
            seasonTotalGames = 0,
            seasonAveragePosition = 0,
            seasonFirstPlaceH = 0,
            seasonSecondPlaceH = 0,
            seasonThirdPlaceH = 0,
            seasonFourthPlaceH = 0,
            seasonFirstPlaceT = 0,
            seasonSecondPlaceT = 0,
            seasonThirdPlaceT = 0,
            seasonFourthPlaceT = 0,
            seasonPoints = 0,
            extraData
        } = body;

        // Validate required fields
        if (!seasonId || !playerId) {
            return NextResponse.json(
                { error: 'seasonId and playerId are required' },
                { status: 400 }
            );
        }

        const seasonResult = await (prisma as any).seasonResult.create({
            data: {
                seasonId: parseInt(seasonId),
                playerId: parseInt(playerId),
                isSanma,
                seasonTotalGames: parseInt(seasonTotalGames),
                seasonAveragePosition: parseFloat(seasonAveragePosition),
                seasonFirstPlaceH: parseInt(seasonFirstPlaceH),
                seasonSecondPlaceH: parseInt(seasonSecondPlaceH),
                seasonThirdPlaceH: parseInt(seasonThirdPlaceH),
                seasonFourthPlaceH: parseInt(seasonFourthPlaceH),
                seasonFirstPlaceT: parseInt(seasonFirstPlaceT),
                seasonSecondPlaceT: parseInt(seasonSecondPlaceT),
                seasonThirdPlaceT: parseInt(seasonThirdPlaceT),
                seasonFourthPlaceT: parseInt(seasonFourthPlaceT),
                seasonPoints: parseFloat(seasonPoints),
                extraData
            },
            include: {
                player: {
                    select: {
                        id: true,
                        nickname: true,
                        fullname: true,
                    }
                },
                season: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });

        return NextResponse.json(serializeBigInt(seasonResult), { status: 201 });
    } catch (error) {
        console.error('Error creating season result:', error);
        return NextResponse.json(
            { error: 'Failed to create season result' },
            { status: 500 }
        );
    }
}
