import {
    calculateGameResults,
    type GameType,
    type PlayerScore
} from '@/lib/game-calculations';
import { NextRequest, NextResponse } from 'next/server';

import { serializeBigInt } from '@/lib/serialize-bigint';
export interface GameCalculationRequest {
    players: PlayerScore[];
    gameType: GameType;
    currentRankings: Array<{
        playerId: bigint;
        danPoints: number;
        ratePoints: number;
        totalGames: number;
        seasonPoints?: number;
    }>;
    tableAverageRate: number;
    isSanma: boolean;
    seasonEligible: boolean;
    seasonId?: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: GameCalculationRequest = await request.json();

        const {
            players,
            gameType,
            currentRankings,
            tableAverageRate,
            isSanma,
            seasonEligible,
            seasonId
        } = body;

        // Validar datos de entrada
        if (!players || !Array.isArray(players) || players.length === 0) {
            return NextResponse.json(
                { error: 'Players array is required and cannot be empty' },
                { status: 400 }
            );
        }

        if (!gameType || !['H', 'T'].includes(gameType)) {
            return NextResponse.json(
                { error: 'Invalid game type. Must be H or T' },
                { status: 400 }
            );
        }

        if (!currentRankings || !Array.isArray(currentRankings)) {
            return NextResponse.json(
                { error: 'Current rankings array is required' },
                { status: 400 }
            );
        }

        if (typeof tableAverageRate !== 'number') {
            return NextResponse.json(
                { error: 'Table average rate must be a number' },
                { status: 400 }
            );
        }

        // Convertir array de rankings a Map
        const rankingsMap = new Map(
            currentRankings.map(ranking => [
                ranking.playerId,
                {
                    danPoints: ranking.danPoints,
                    ratePoints: ranking.ratePoints,
                    totalGames: ranking.totalGames,
                    seasonPoints: ranking.seasonPoints
                }
            ])
        );

        // Calcular resultados
        const results = await calculateGameResults(
            players,
            gameType,
            rankingsMap,
            tableAverageRate,
            isSanma,
            seasonEligible,
            seasonId ? BigInt(seasonId) : undefined
        );

        // Debug en desarrollo
        if (process.env.NODE_ENV === 'development' && seasonEligible) {
            console.log('Season Points Debug:', {
                gameType,
                isSanma,
                seasonId,
                results: results.map(r => ({
                    playerId: r.playerId,
                    position: r.finalPosition,
                    seasonChange: r.seasonChange
                }))
            });
        }

        return NextResponse.json(serializeBigInt({ results }));

    } catch (error) {
        console.error('Error calculating game results:', error);
        return NextResponse.json(
            {
                error: 'Internal server error calculating game results',
                details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            },
            { status: 500 }
        );
    }
}
