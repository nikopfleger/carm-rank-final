import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/abm/season-results/[id] - Get a specific season result
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
    const id = parseInt(idParam);

        const seasonResult = await (prisma as any).seasonResult.findUnique({
            where: { id },
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

        if (!seasonResult) {
            return NextResponse.json(
                { error: 'Season result not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(seasonResult);
    } catch (error) {
        console.error('Error fetching season result:', error);
        return NextResponse.json(
            { error: 'Failed to fetch season result' },
            { status: 500 }
        );
    }
}

// PUT /api/abm/season-results/[id] - Update a season result
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
    const id = parseInt(idParam);
        const body = await request.json();

        const {
            seasonTotalGames,
            seasonAveragePosition,
            seasonFirstPlaceH,
            seasonSecondPlaceH,
            seasonThirdPlaceH,
            seasonFourthPlaceH,
            seasonFirstPlaceT,
            seasonSecondPlaceT,
            seasonThirdPlaceT,
            seasonFourthPlaceT,
            seasonPoints,
            extraData
        } = body;

        const updatedAta: any = {};

        if (seasonTotalGames !== undefined) updatedAta.seasonTotalGames = parseInt(seasonTotalGames);
        if (seasonAveragePosition !== undefined) updatedAta.seasonAveragePosition = parseFloat(seasonAveragePosition);
        if (seasonFirstPlaceH !== undefined) updatedAta.seasonFirstPlaceH = parseInt(seasonFirstPlaceH);
        if (seasonSecondPlaceH !== undefined) updatedAta.seasonSecondPlaceH = parseInt(seasonSecondPlaceH);
        if (seasonThirdPlaceH !== undefined) updatedAta.seasonThirdPlaceH = parseInt(seasonThirdPlaceH);
        if (seasonFourthPlaceH !== undefined) updatedAta.seasonFourthPlaceH = parseInt(seasonFourthPlaceH);
        if (seasonFirstPlaceT !== undefined) updatedAta.seasonFirstPlaceT = parseInt(seasonFirstPlaceT);
        if (seasonSecondPlaceT !== undefined) updatedAta.seasonSecondPlaceT = parseInt(seasonSecondPlaceT);
        if (seasonThirdPlaceT !== undefined) updatedAta.seasonThirdPlaceT = parseInt(seasonThirdPlaceT);
        if (seasonFourthPlaceT !== undefined) updatedAta.seasonFourthPlaceT = parseInt(seasonFourthPlaceT);
        if (seasonPoints !== undefined) updatedAta.seasonPoints = parseFloat(seasonPoints);
        if (extraData !== undefined) updatedAta.extraData = extraData;

        const seasonResult = await (prisma as any).seasonResult.update({
            where: { id },
            data: updatedAta,
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

        return NextResponse.json(seasonResult);
    } catch (error) {
        console.error('Error updating season result:', error);
        return NextResponse.json(
            { error: 'Failed to update season result' },
            { status: 500 }
        );
    }
}

// DELETE /api/abm/season-results/[id] - Soft delete a season result
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
    const id = parseInt(idParam);

        const seasonResult = await (prisma as any).seasonResult.update({
            where: { id },
            data: { deleted: true },
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

        return NextResponse.json(seasonResult);
    } catch (error) {
        console.error('Error deleting season result:', error);
        return NextResponse.json(
            { error: 'Failed to delete season result' },
            { status: 500 }
        );
    }
}
