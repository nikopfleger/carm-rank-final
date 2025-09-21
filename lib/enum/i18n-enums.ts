// ============================================================================
// 🌍 ENUMS CON I18N CENTRALIZADO
// ============================================================================

import { GameType } from './game-type';
import { OnlinePlatform } from './online-platform';
import { PointsType } from './points-type';

// Tipos de torneo
export enum TournamentType {
    INDIVIDUAL = 'individual',
    TEAM = 'team',
    LEAGUE = 'league',
    CHAMPIONSHIP = 'championship'
}

// Tipos de juego
export enum GameTypeEnum {
    HANCHAN = 'hanchan',
    TONPUUSEN = 'tonpuusen'
}

// Tipos de puntos
export enum PointsTypeEnum {
    DAN = 'dan',
    RATE = 'rate',
    SEASON = 'season'
}

// Vientos del mahjong
export enum WindEnum {
    EAST = '東',
    SOUTH = '南',
    WEST = '西',
    NORTH = '北'
}

// Duración de juego
export enum GameDurationEnum {
    HANCHAN = 'HANCHAN',
    TONPUUSEN = 'TONPUUSEN'
}

// Función para obtener opciones de enum con i18n
export function getEnumOptions<T extends string>(
    enumObject: Record<string, T>,
    translations: Record<string, string>
): Array<{ value: T; label: string }> {
    return Object.values(enumObject).map(value => ({
        value,
        label: translations[value] || value
    }));
}

// Función para obtener la traducción de un valor de enum
export function getEnumTranslation<T extends string>(
    value: T,
    translations: Record<string, string>
): string {
    const key = String(value);
    return (
        translations[key] ??
        translations[key.toLowerCase()] ??
        translations[key.toUpperCase()] ??
        key
    );
}

// Exportar todos los enums para uso directo
export { GameType, OnlinePlatform, PointsType };

