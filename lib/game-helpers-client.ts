// Funciones puras que no dependen de Prisma - para usar en client components

export interface DanConfig {
    rank: string;
    minPoints: number;
    maxPoints: number;
    color: string;
    cssClass: string;
    sanma?: boolean;
}

export interface RateConfig {
    rank: string;
    minPoints: number;
    maxPoints: number;
    color: string;
    cssClass: string;
}

/**
 * Obtiene el rango DAN basado en los puntos
 */
export function getDanRank(points: number, danConfigs: DanConfig[]): DanConfig | null {
    if (!danConfigs || danConfigs.length === 0) return null;

    return danConfigs.find(config =>
        points >= config.minPoints && points <= config.maxPoints
    ) || null;
}

/**
 * Obtiene las líneas de progreso para el rango DAN
 */
export function getDanRankLines(points: number, danConfigs: DanConfig[]): {
    current: DanConfig | null;
    next: DanConfig | null;
    progress: number;
} {
    const current = getDanRank(points, danConfigs);

    if (!current) {
        return { current: null, next: null, progress: 0 };
    }

    // Ordenar configuraciones por minPoints para encontrar el siguiente rango correctamente
    const sortedConfigs = [...danConfigs].sort((a, b) => a.minPoints - b.minPoints);

    // Encontrar el índice del rango actual
    const currentIndex = sortedConfigs.findIndex(config =>
        config.minPoints === current.minPoints && config.maxPoints === current.maxPoints
    );

    // El siguiente rango es el que está después en la lista ordenada
    const next = currentIndex >= 0 && currentIndex < sortedConfigs.length - 1
        ? sortedConfigs[currentIndex + 1]
        : null;

    // Calcular progreso dentro del rango actual
    const rangeSize = current.maxPoints - current.minPoints;
    const progressInRange = points - current.minPoints;
    const progress = rangeSize > 0 ? (progressInRange / rangeSize) * 100 : 0;

    return { current, next, progress };
}

/**
 * Obtiene el progreso hacia el siguiente rango DAN
 */
export function getDanRankProgress(points: number, danConfigs: DanConfig[]): number {
    const { progress } = getDanRankLines(points, danConfigs);
    return progress;
}

/**
 * Obtiene el siguiente rango DAN
 */
export function getNextDanRank(points: number, danConfigs: DanConfig[]): DanConfig | null {
    const { next } = getDanRankLines(points, danConfigs);
    return next;
}
