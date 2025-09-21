/**
 * Cliente para API de cálculos de juego
 * Funciones que requieren cálculos del servidor
 */

import type { GameCalculationResult, GameType, PlayerScore } from './game-calculations';

export interface GameCalculationClientRequest {
    players: PlayerScore[];
    gameType: GameType;
    currentRankings: Array<{
        playerId: number;
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

export async function calculateGameResultsAPI(
    request: GameCalculationClientRequest
): Promise<GameCalculationResult[]> {
    const response = await fetch('/api/games/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error calculating game results');
    }

    const data = await response.json();
    return data.results;
}

/**
 * Hook para usar cálculos de juego con manejo de estado
 */
export function useGameCalculations() {
    const calculateResults = async (request: GameCalculationClientRequest) => {
        try {
            return await calculateGameResultsAPI(request);
        } catch (error) {
            console.error('Error calculating game results:', error);
            throw error;
        }
    };

    return { calculateResults };
}
