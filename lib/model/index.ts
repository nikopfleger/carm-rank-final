// Exportaciones centralizadas de todos los modelos
// Este archivo sirve como punto único de importación para todas las interfaces del modelo

// Modelos base
export type { ClassModel } from './class-model';

// Modelos principales
export type { Account } from './account';
export type { Country } from './country';
export type { Game } from './game';
export type { GameResult } from './game-result';
export type { Location } from './location';
export type { Player } from './player';
export type { Points } from './points';
export type { Ruleset } from './ruleset';
export type { Season } from './season';
export type { Tournament } from './tournament';
export type { TournamentResult } from './tournament-result';
export type { Uma } from './uma';

// Importar tipos para extender
import type { Game } from './game';
import type { GameResult } from './game-result';
import type { Player } from './player';
import type { Season } from './season';
import type { Tournament } from './tournament';

// Tipos extendidos para la UI (interfaces que extienden los modelos base)
export interface PlayerWithStats extends Player {
    totalGames: number;
    winRate: number;
    avgPosition: number;
    danPoints: number;
    ratePoints: number;
    seasonPoints?: number;
    maxRate: number;
    position?: number; // Para rankings
    trend?: {
        danDelta10?: number;
        seasonDelta10?: number;
    };
}

export interface GameWithDetails extends Game {
    gameResults: GameResult[];
    isValidated: boolean;
    extraData?: {
        venue?: string;
        nroJuegoDia?: number;
    };
}

export interface TournamentWithParticipants extends Tournament {
    participants?: number;
    maxParticipants?: number;
    prize?: string;
    isCompleted: boolean;
}

export interface SeasonWithStats extends Season {
    players: number;
    games: number;
    tournaments: number;
    rulesets: number;
    rulesetNames?: string[];
    status: 'active' | 'completed';
}

// Interfaces para formularios y operaciones
export interface PlayerFormData {
    nickname: string;
    fullname?: string;
    country?: string;
    birthday?: string;
    playerNumber?: number;
}

export interface GameFormData {
    date: string;
    nroJuegoDia: number;
    duration: 'HANCHAN' | 'TONPUUSEN';
    riichiFloating: number;
    locationId?: number;
    seasonId?: number;
    tournamentId?: number;
    players: GamePlayerFormData[];
}

export interface GamePlayerFormData {
    player: PlayerWithStats | null;
    wind: string;
    oorasuScore: number;
    gameScore: number;
    uma: number;
    chonbo: number;
    oka: number;
    finalScore: number;
    finalPosition: number;
}

// Interfaces para búsquedas y filtros
export interface PlayerSearchResult {
    id: number;
    nickname: string;
    playerNumber: number;
    fullname?: string;
}

export interface GameSearchFilters {
    dateFrom?: string;
    dateTo?: string;
    seasonId?: string;
    gameType?: string;
    locationId?: string;
    playerIds?: number[];
}

// Interfaces para estadísticas
export interface PlayerStats {
    totalGames: number;
    winRate: number;
    avgPosition: number;
    maxRate: number;
    danPoints: number;
    ratePoints: number;
    seasonPoints?: number;
    positionDistribution: {
        first: number;
        second: number;
        third: number;
        fourth: number;
    };
    gameTypeStats: {
        hanchan: GameTypeStats;
        tonpuusen: GameTypeStats;
        total: GameTypeStats;
    };
}

export interface GameTypeStats {
    games: number;
    winRate: number;
    avgPosition: number;
    positionDistribution: {
        first: number;
        second: number;
        third: number;
        fourth: number;
    };
}

// Interfaces para gráficos y visualizaciones
export interface ChartDataPoint {
    gameId: number;
    date: string;
    danPoints: number;
    ratePoints: number;
    seasonPoints?: number;
    position: number;
    finalScore: number;
}

// Interfaces para respuestas de API
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}

// Tipos de utilidad
export type SortDirection = 'asc' | 'desc';
export type GameType = 'HANCHAN' | 'TONPUUSEN';
export type PointsType = 'DAN' | 'RATE' | 'SEASON';
export type UserRole = 'OWNER' | 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER';
export type LinkRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PendingGameStatus = 'PENDING' | 'VALIDATED' | 'REJECTED';
