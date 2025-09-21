/**
 * Helpers de utilidad para validación y transformación de datos de juegos
 */

import { configCache } from './config-cache';
import { type Position } from './game-calculations-client';


// ===============================
// VALIDACIONES
// ===============================

/**
 * Valida que los puntajes de un juego sumen correctamente
 */
export function validateGameScores(
  scores: number[],
  playerCount: number,
  inPoints: number = 25000
): { isValid: boolean; expectedTotal: number; actualTotal: number; difference: number } {
  const expectedTotal = playerCount * inPoints;
  const actualTotal = scores.reduce((sum, score) => sum + score, 0);
  const difference = Math.abs(actualTotal - expectedTotal);

  return {
    isValid: difference <= 100, // Tolerancia de 100 puntos
    expectedTotal,
    actualTotal,
    difference
  };
}

/**
 * Valida que no haya jugadores duplicados
 */
export function validateUniquePlayerIds(playerIds: number[]): boolean {
  const uniqueIds = new Set(playerIds);
  return uniqueIds.size === playerIds.length;
}

/**
 * Valida el formato de nickname (sin caracteres especiales problemáticos)
 */
export function validateNickname(nickname: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!nickname || nickname.trim().length === 0) {
    errors.push('El nickname no puede estar vacío');
  }

  if (nickname.length > 50) {
    errors.push('El nickname no puede tener más de 50 caracteres');
  }

  if (nickname.includes(',') || nickname.includes(';') || nickname.includes('\n')) {
    errors.push('El nickname no puede contener comas, punto y coma o saltos de línea');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ===============================
// TRANSFORMACIONES
// ===============================

/**
 * Convierte una fecha en formato string a Date
 */
export function parseGameDate(dateString: string): Date | null {
  try {
    // Intentar múltiples formatos
    const formats = [
      // ISO format
      /^\d{4}-\d{2}-\d{2}$/,
      // DD/MM/YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      // DD-MM-YYYY
      /^\d{1,2}-\d{1,2}-\d{4}$/
    ];

    let date: Date;

    if (formats[0].test(dateString)) {
      // ISO format
      date = new Date(dateString);
    } else if (formats[1].test(dateString)) {
      // DD/MM/YYYY
      const [day, month, year] = dateString.split('/').map(Number);
      date = new Date(year, month - 1, day);
    } else if (formats[2].test(dateString)) {
      // DD-MM-YYYY
      const [day, month, year] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      // Intentar parse directo
      date = new Date(dateString);
    }

    // Verificar que la fecha es válida
    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
}

/**
 * Normaliza un nickname eliminando espacios extra y caracteres problemáticos
 */
export function normalizeNickname(nickname: string): string {
  return nickname
    .trim()
    .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
    .replace(/[,;]/g, '') // Eliminar comas y punto y coma
    .replace(/\n/g, ''); // Eliminar saltos de línea
}

/**
 * Formatea un puntaje para display (con separadores de miles)
 */
export function formatScore(score: number): string {
  return score.toLocaleString('es-ES');
}

/**
 * Formatea puntos con decimales para display
 */
export function formatPoints(points: number, decimals: number = 1): string {
  return points.toFixed(decimals);
}

// ===============================
// UTILIDADES DE RANKING
// ===============================

/**
 * Calcula el win rate de un jugador
 */
export function calculateWinRate(
  firstPlaceH: number,
  firstPlaceT: number,
  totalGames: number
): number {
  if (totalGames === 0) return 0;
  return ((firstPlaceH + firstPlaceT) / totalGames) * 100;
}

/**
 * Calcula la posición promedio de un jugador
 */
export function calculateAveragePosition(
  firstPlace: number,
  secondPlace: number,
  thirdPlace: number,
  fourthPlace: number
): number {
  const totalGames = firstPlace + secondPlace + thirdPlace + fourthPlace;
  if (totalGames === 0) return 0;

  const weightedSum = (firstPlace * 1) + (secondPlace * 2) + (thirdPlace * 3) + (fourthPlace * 4);
  return weightedSum / totalGames;
}

// Las configuraciones DAN ahora se obtienen dinámicamente desde el cache

/**
 * Obtiene el rango Dan basado en los puntos
 */
export async function getDanRank(danPoints: number, isSanma: boolean = false): Promise<string> {
  // Obtener el rango más bajo de la cache
  const lowestConfig = await configCache.getLowestDanConfig(isSanma);
  const lowestRank = lowestConfig?.rank || 'N/A';

  // Si los puntos están por debajo del mínimo, usar el rango más bajo
  if (lowestConfig && danPoints < (lowestConfig.minPoints)) {
    return lowestRank;
  }

  const danConfig = await configCache.getDanConfigByPoints(danPoints, isSanma);
  return danConfig?.rank || lowestRank;
}

/**
 * Obtiene el próximo rango y puntos faltantes
 */
export async function getNextDanRank(danPoints: number, isSanma: boolean = false): Promise<{ proximo: string; faltantes: number }> {
  // Obtener el rango más bajo de la cache
  const lowestConfig = await configCache.getLowestDanConfig(isSanma);
  const lowestRank = lowestConfig?.rank || 'N/A';
  const lowestMinPoints = lowestConfig ? (lowestConfig.minPoints) : 0;

  if (danPoints < lowestMinPoints) {
    return { proximo: lowestRank, faltantes: Math.max(0, lowestMinPoints - danPoints) };
  }

  const allConfigs = await configCache.getAllDanConfigs(isSanma);

  // Ordenar por puntos mínimos
  const sortedConfigs = allConfigs.sort((a, b) => {
    const aMin = a.minPoints;
    const bMin = b.minPoints;
    return aMin - bMin;
  });

  // Encontrar el rango actual
  const currentIndex = sortedConfigs.findIndex(config => {
    const min = config.minPoints;
    const max = config.maxPoints;
    return danPoints >= min && danPoints < max;
  });

  if (currentIndex === -1 || currentIndex >= sortedConfigs.length - 1) {
    // Ya es el máximo o no se encuentra
    const lastConfig = sortedConfigs[sortedConfigs.length - 1];
    return { proximo: lastConfig?.rank || "N/A", faltantes: 0 };
  }

  // Encontrar el próximo rango
  const nextConfig = sortedConfigs[currentIndex + 1];
  const minNext = nextConfig.minPoints;
  const faltantes = Math.max(0, minNext - danPoints);

  return { proximo: nextConfig.rank, faltantes };
}

/**
 * Obtiene el progreso visual dentro del rango actual
 */
export async function getDanRankProgress(danPoints: number, isSanma: boolean = false): Promise<{
  current: number;
  max: number;
  progress: number;
  rank: string;
  nextRank: string;
}> {
  // Obtener el rango más bajo de la cache
  const lowestConfig = await configCache.getLowestDanConfig(isSanma);
  const lowestRank = lowestConfig?.rank || 'N/A';
  const lowestMinPoints = lowestConfig ? (lowestConfig.minPoints) : 0;

  if (danPoints < lowestMinPoints) {
    return {
      current: danPoints,
      max: lowestMinPoints,
      progress: 0,
      rank: lowestRank,
      nextRank: lowestRank
    };
  }

  const allConfigs = await configCache.getAllDanConfigs(isSanma);

  // Ordenar por puntos mínimos
  const sortedConfigs = allConfigs.sort((a, b) => {
    const aMin = a.minPoints;
    const bMin = b.minPoints;
    return aMin - bMin;
  });

  // Encontrar el rango actual
  const currentIndex = sortedConfigs.findIndex(config => {
    const min = config.minPoints;
    const max = config.maxPoints;
    return danPoints >= min && danPoints < max;
  });

  if (currentIndex === -1) {
    // Ya es el máximo
    const lastConfig = sortedConfigs[sortedConfigs.length - 1];
    const lastRank = lastConfig?.rank || "N/A";
    return {
      current: 0,
      max: 0,
      progress: 100,
      rank: lastRank,
      nextRank: lastRank
    };
  }

  const currentConfig = sortedConfigs[currentIndex];
  const nextConfig = sortedConfigs[currentIndex + 1];
  const nextRank = nextConfig ? nextConfig.rank : currentConfig.rank;

  // Calcular progreso visual (0 a max)
  const min = currentConfig.minPoints;
  const max = currentConfig.maxPoints;
  const current = danPoints - min;
  const maxRange = max - min;
  const progress = maxRange > 0 ? (current / maxRange) * 100 : 100;

  return {
    current: Math.round(current),
    max: Math.round(maxRange),
    progress: Math.round(progress * 10) / 10, // 1 decimal
    rank: currentConfig.rank,
    nextRank
  };
}

/**
 * Obtiene las líneas de referencia para el gráfico de Dan
 */
export async function getDanRankLines(isSanma: boolean = false): Promise<Array<{ value: number; label: string; color: string }>> {
  const allConfigs = await configCache.getAllDanConfigs(isSanma);

  // Ordenar por puntos mínimos
  const sortedConfigs = allConfigs.sort((a, b) => {
    const aMin = a.minPoints;
    const bMin = b.minPoints;
    return aMin - bMin;
  });

  return sortedConfigs.map(config => {
    const min = config.minPoints;

    return {
      value: min,
      label: config.rank,
      color: config.color
    };
  });
}

/**
 * Obtiene el color del badge según el rango
 */
export function getDanRankColor(danPoints: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (danPoints < 0) return 'outline';
  if (danPoints < 2000) return 'default'; // Kyu ranks
  if (danPoints < 4000) return 'secondary'; // Low dan
  if (danPoints < 7000) return 'destructive'; // High dan
  return 'destructive'; // Master ranks
}

// ===============================
// HELPERS DE TIEMPO
// ===============================

/**
 * Calcula la diferencia en días entre dos fechas
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * Verifica si un jugador está activo (jugó en los últimos X días)
 */
export function isPlayerActive(lastGameDate: Date | null, dayThreshold: number = 90): boolean {
  if (!lastGameDate) return false;
  return daysBetween(new Date(), lastGameDate) <= dayThreshold;
}

/**
 * Formatea una fecha para display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Formatea una fecha con hora para display
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calcula el UMA para una posición específica considerando empates.
 * @param position     Posición final de ESTE jugador (1..N)
 * @param finalPositions  Todas las posiciones finales (1..N) con empates
 * @param umaValues    Vector UMA por lugar (1→umaValues[0], 2→umaValues[1], ...)
 *                     Longitud 3 para sanma o 4 para yonma.
 * @returns            UMA en k
 */
export function calculateUmaForPosition(
  position: Position,
  finalPositions: Position[],
  umaValues: number[]
): number {
  // cuántos jugadores tienen este mismo puesto (empate real, no por longitud)
  const tieCount = Math.max(1, finalPositions.filter(p => p === position).length);

  // rango de lugares cubiertos por el empate: [position .. position+tieCount-1]
  const start = position;
  const end = Math.min(umaValues.length, position + tieCount - 1);

  let sum = 0, n = 0;
  for (let pos = start; pos <= end; pos++) {
    const val = umaValues[pos - 1] ?? 0; // pos es 1-based
    sum += val;
    n++;
  }
  return n ? (sum / n) : 0;
}

/**
 * Calcula el UMA para todos los jugadores (con empates).
 * Devuelve un array alineado al orden de jugadores.
 */
export function calculateUmaForAll(
  finalPositions: Position[],
  umaValues: number[]
): number[] {
  return finalPositions.map((pos) => calculateUmaForPosition(pos, finalPositions, umaValues));
}


/**
 * Calcula la distribución del OKA por jugador.
 * @param finalPositions  Posiciones finales (1..N) con empates
 * @param okaAmount       Monto total a repartir entre ganadores (en k)
 * @returns               Array por jugador (longitud N) en k, suma == okaAmount (redondeando a 0.1)
 */
export function calculateOkaDistributionPerPlayer(
  finalPositions: Position[],
  okaAmount: number
): number[] {
  const N = finalPositions?.length ?? 0;
  if (N !== 3 && N !== 4) return [];

  // indices (0..N-1) de ganadores (posición 1)
  const winners: number[] = [];
  finalPositions.forEach((pos, i) => { if (pos === 1) winners.push(i); });

  const out = Array(N).fill(0);

  if (okaAmount === 0 || winners.length === 0) {
    return out; // nada que repartir
  }

  // Redondeo a 0.1 preservando suma
  const DEC = 1;
  const SCALE = 10 ** DEC;

  const baseShare = okaAmount / winners.length;
  const baseRounded = Math.floor(baseShare * SCALE) / SCALE;
  const shares = Array(winners.length).fill(baseRounded);

  let remUnits = Math.round((okaAmount - baseRounded * winners.length) * SCALE);
  for (let t = 0; t < remUnits; t++) {
    const idx = t % winners.length;
    shares[idx] = Math.round((shares[idx] + 1 / SCALE) * SCALE) / SCALE;
  }

  winners.forEach((wIdx, k) => { out[wIdx] = shares[k]; });
  return out;
}

// ===============================
// HELPERS DE EXPORT/IMPORT
// ===============================

/**
 * Convierte datos de juego a formato CSV-friendly
 */
export function gameToCSVFormat(gameData: any): string[] {
  return [
    formatDate(gameData.gameDate),
    gameData.venue || '',
    gameData.duration,
    gameData.sanma ? 'Sanma' : 'Yonma',
    ...gameData.players.map((p: any) => [
      p.nickname,
      p.gameScore.toString(),
      p.wind || '',
      (p.chonbos || 0).toString()
    ]).flat()
  ];
}

/**
 * Valida datos importados desde CSV
 */
export function validateCSVGameData(csvRow: string[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (csvRow.length < 6) {
    errors.push('Fila de CSV incompleta');
  }

  // Validar fecha
  if (!parseGameDate(csvRow[0])) {
    errors.push('Fecha inválida');
  }

  // Validar puntajes (asumiendo 4 jugadores para ejemplo)
  for (let i = 1; i <= 4; i++) {
    const scoreIndex = 2 + (i - 1) * 4 + 1; // Score position for player i
    if (scoreIndex < csvRow.length) {
      const score = parseInt(csvRow[scoreIndex]);
      if (isNaN(score)) {
        errors.push(`Puntaje inválido para jugador ${i}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
