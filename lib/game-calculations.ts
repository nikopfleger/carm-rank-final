/**
 * Sistema unificado de cálculos de Dan y Rate para Mahjong
 * Usa configuraciones dinámicas desde base de datos con cache en memoria
 */

import { getDan, getDanDirect, getRate, getRateDirect, getSeasonConfigs, getSeasonConfigsDirect } from '@/lib/cache/core-cache';

// ===============================
// HELPER FUNCTIONS CON FALLBACK
// ===============================

/**
 * Obtiene configuración DAN con fallback a DB directa si Redis no está disponible
 */
async function getDanWithFallback() {
  try {
    return getDan();
  } catch (error) {
    console.log('📊 getDan fallback: Redis no disponible, usando DB directo');
    return await getDanDirect();
  }
}

/**
 * Obtiene configuración RATE con fallback a DB directa si Redis no está disponible
 */
async function getRateWithFallback() {
  try {
    return getRate();
  } catch (error) {
    console.log('📊 getRate fallback: Redis no disponible, usando DB directo');
    return await getRateDirect();
  }
}

/**
 * Obtiene configuración SEASON con fallback a DB directa si Redis no está disponible
 */
async function getSeasonConfigsWithFallback() {
  try {
    return getSeasonConfigs();
  } catch (error) {
    console.log('📊 getSeasonConfigs fallback: Redis no disponible, usando DB directo');
    return await getSeasonConfigsDirect();
  }
}

// ===============================
// TIPOS Y INTERFACES
// ===============================

export type GameType = 'H' | 'T'; // Hanchan | Tonpuusen
export type Position = 1 | 2 | 3 | 4;

export interface PlayerScore {
  id: bigint;
  finalScore: number; // Puntaje final del jugador (puede ser negativo)
}

export interface PlayerPosition {
  id: bigint;
  finalPosition: Position;
  finalScore: number;
}

// Las interfaces DanConfig, RateConfig y SeasonConfig están ahora en config-cache.ts

export interface GameCalculationResult {
  playerId: bigint;
  finalPosition: Position;
  finalScore: number;
  newDanPoints: number;
  newRatePoints: number;
  danChange: number;
  rateChange: number;
  newSeasonPoints?: number;
  seasonChange?: number;
}

// Las configuraciones DAN ahora se obtienen dinámicamente desde la base de datos

// Las funciones auxiliares para DAN ahora están en game-helpers.ts y usan el cache

// ===============================
// FUNCIONES PRINCIPALES
// ===============================

/**
 * Calcula posiciones finales considerando empates
 * @param players Array de jugadores con puntajes finales
 * @returns Array de jugadores con posiciones asignadas
 */
export function calculateFinalPositions(players: PlayerScore[]): PlayerPosition[] {
  const SCALE = 10; // 1 decimal

  // index para desempate estable en empates
  const indexed = players.map((player, index) => ({
    id: player.id,
    score: player.finalScore,
    norm: Math.round(player.finalScore * SCALE) / SCALE, // normaliza a 1 decimal
    index
  }));

  // Orden: puntaje desc; si empatan, por índice de entrada (estable)
  indexed.sort((a, b) => (b.norm - a.norm) || (a.index - b.index));

  const positions: PlayerPosition[] = [];
  let currentPosition = 1;
  for (let i = 0; i < indexed.length; i++) {
    if (i > 0 && indexed[i].norm !== indexed[i - 1].norm) {
      currentPosition = i + 1;
    }
    positions.push({
      id: indexed[i].id,
      finalPosition: currentPosition as Position,
      finalScore: indexed[i].score // guardamos el original tal cual
    });
  }

  return positions;
}


/**
 * Calcula los nuevos puntos Dan para un jugador
 * @param position Posición final en la mesa (1-4)
 * @param gameType Tipo de juego ('H' = Hanchan, 'T' = Tonpuusen)
 * @param currentDanPoints Puntos Dan actuales del jugador
 * @param finalPositions Array con posiciones finales de todos los jugadores
 * @returns Nuevos puntos Dan (mínimo 0)
 */
export async function calculateDanPoints(
  position: Position,
  gameType: GameType,
  currentDanPoints: number,
  finalPositions: PlayerPosition[],
  isSanma: boolean = false
): Promise<number> {
  // Obtener configuración DAN desde cache
  const danConfigs = await getDanWithFallback();
  const danConfig = danConfigs.find(config =>
    config.sanma === isSanma &&
    currentDanPoints >= config.minPoints &&
    (config.maxPoints === null || currentDanPoints <= config.maxPoints)
  );
  if (!danConfig) {
    console.warn(`No DAN config found for points ${currentDanPoints}, sanma: ${isSanma}`);
    return currentDanPoints;
  }

  return await calculateDanPointsWithConfig(
    position,
    gameType,
    currentDanPoints,
    danConfig,
    finalPositions,
    isSanma
  );
}

export async function calculateRatePoints(
  position: Position,
  currentRatePoints: number,
  totalGames: number,
  tableAverageRate: number,
  gameType: GameType,
  isSanma: boolean,
  finalPositions: PlayerPosition[]
): Promise<number> {

  // Obtener configuración RATE desde cache
  const rateConfigs = await getRateWithFallback();
  const rateConfig = rateConfigs.find(config => config.sanma === isSanma);
  if (!rateConfig) {
    console.warn(`No RATE config found for sanma: ${isSanma}`);
    return currentRatePoints;
  }

  // Factor por cantidad de juegos (lineal hasta adjustmentLimit→minAdjustment)
  const j = totalGames;
  const a = j < rateConfig.adjustmentLimit
    ? 1 - (rateConfig.adjustmentRate * j)
    : rateConfig.minAdjustment;

  // Diferencia vs promedio de mesa
  const r = currentRatePoints;
  const rp = tableAverageRate;
  const difference = (rp - r) / 40;

  // UMA según posición usando calcularUmaConEmpates para manejo consistente
  const umaValues = isSanma
    ? [rateConfig.firstPlace, rateConfig.secondPlace, rateConfig.thirdPlace]
    : [rateConfig.firstPlace, rateConfig.secondPlace, rateConfig.thirdPlace, rateConfig.fourthPlace || 0];

  const posicionesArray = finalPositions?.map(p => p.finalPosition) || [position];
  const umaValue = calcularUmaConEmpates(
    posicionesArray,
    position,
    umaValues
  );

  // Variación total = UMA + ajuste por diferencia vs promedio
  const totalVariation = umaValue + difference;

  // Aplicar factor por experiencia
  const adjustedVariation = a * totalVariation;

  // Aplicar multiplicador por tipo de juego (Tonpuusen 2/3)
  const gameMultiplier = gameType === "H" ? 1 : 2 / 3;
  const newRate = currentRatePoints + adjustedVariation * gameMultiplier;


  return newRate;
}

/**
 * Calcula los nuevos puntos de temporada para un jugador
 */
export async function calculateSeasonPoints(
  position: Position,
  gameType: GameType,
  currentSeasonPoints: number,
  isSanma: boolean,
  finalPositions: PlayerPosition[],
  seasonId?: bigint
): Promise<number> {
  // Obtener configuración SEASON para los puntos de posición
  const seasonConfigs = await getSeasonConfigsWithFallback();

  // Buscar configuración específica para la temporada o usar la por defecto
  let seasonConfig = seasonConfigs.find(config =>
    config.sanma === isSanma &&
    config.seasonId === seasonId
  );

  // Si no hay configuración específica para la temporada, usar la por defecto
  if (!seasonConfig) {
    seasonConfig = seasonConfigs.find(config =>
      config.sanma === isSanma &&
      config.isDefault
    );
  }

  if (!seasonConfig) {
    console.warn(`No SEASON config found for sanma: ${isSanma}, seasonId: ${seasonId}`);
    return currentSeasonPoints;
  }

  // Puntos base según posición
  const basePoints = isSanma
    ? [seasonConfig.firstPlace, seasonConfig.secondPlace, seasonConfig.thirdPlace]
    : [seasonConfig.firstPlace, seasonConfig.secondPlace, seasonConfig.thirdPlace, seasonConfig.fourthPlace || 0];

  // Usar calcularUmaConEmpates para manejo consistente de empates
  const posicionesArray = finalPositions?.map(p => p.finalPosition) || [position];
  const gained = calcularUmaConEmpates(
    posicionesArray,
    position,
    basePoints
  );

  // Aplicar multiplicador por tipo de juego (Tonpuusen 2/3)
  const gameMultiplier = gameType === "H" ? 1 : 2 / 3;
  const adjustedGained = gained * gameMultiplier;

  return currentSeasonPoints + adjustedGained;
}

/**
 * Calcula tanto Dan como Rate para todos los jugadores de un juego
 * @param players Array de jugadores con puntajes finales
 * @param gameType Tipo de juego
 * @param currentRankings Mapa de rankings actuales por jugador
 * @param tableAverageRate Promedio de Rate de la mesa
 * @param umaValues Valores Uma del ruleset
 * @returns Array con resultados para cada jugador
 */
export async function calculateGameResults(
  players: PlayerScore[],
  gameType: GameType,
  currentRankings: Map<bigint, { danPoints: number; ratePoints: number; totalGames: number; seasonPoints?: number }>,
  tableAverageRate: number,
  isSanma: boolean,
  seasonEligible: boolean,
  seasonId?: bigint
): Promise<GameCalculationResult[]> {
  // 1. Calcular posiciones finales
  const finalPositions = calculateFinalPositions(players);

  // 2. Calcular resultados para cada jugador
  return Promise.all(finalPositions.map(async playerPosition => {
    const ranking = currentRankings.get(playerPosition.id);
    const currentDanPoints = ranking ? ranking.danPoints : 1000;
    const currentRatePoints = ranking ? ranking.ratePoints : 1500;
    const totalGames = ranking ? ranking.totalGames : 0;
    const currentSeasonPoints = ranking?.seasonPoints ?? 0;

    // Calcular nuevos puntos
    const newDanPoints = await calculateDanPoints(
      playerPosition.finalPosition,
      gameType,
      currentDanPoints,
      finalPositions,
      isSanma
    );

    const newRatePoints = await calculateRatePoints(
      playerPosition.finalPosition,
      currentRatePoints,
      totalGames,
      tableAverageRate,
      gameType,
      isSanma,
      finalPositions
    );

    const newSeasonPoints = seasonEligible
      ? await calculateSeasonPoints(
        playerPosition.finalPosition,
        gameType,
        currentSeasonPoints,
        isSanma,
        finalPositions,
        seasonId
      )
      : currentSeasonPoints;

    // Debug removido - se maneja en API routes si es necesario

    return {
      playerId: playerPosition.id,
      finalPosition: playerPosition.finalPosition,
      finalScore: playerPosition.finalScore,
      newDanPoints,
      newRatePoints,
      danChange: newDanPoints - currentDanPoints,
      rateChange: newRatePoints - currentRatePoints,
      newSeasonPoints: seasonEligible ? newSeasonPoints : undefined,
      seasonChange: seasonEligible ? newSeasonPoints - currentSeasonPoints : undefined
    };
  }));
}

// ===============================
// FUNCIONES AUXILIARES
// ===============================

/**
 * Calcula puntos Dan con una configuración específica
 */
export async function calculateDanPointsWithConfig(
  position: Position,
  gameType: GameType,
  currentPoints: number,
  config: any, // DanConfigCache from config-cache.ts
  finalPositions: PlayerPosition[],
  isSanma: boolean = false
): Promise<number> {
  // 1) Ajuste por Tonpuusen (2/3 del Hanchan) - aplicar a todos los valores
  const adjustedConfig = { ...config };
  if (gameType === "T") {
    adjustedConfig.firstPlace = adjustedConfig.firstPlace * 2 / 3;
    adjustedConfig.secondPlace = adjustedConfig.secondPlace * 2 / 3;
    adjustedConfig.thirdPlace = adjustedConfig.thirdPlace * 2 / 3;
    if (adjustedConfig.fourthPlace !== null) {
      adjustedConfig.fourthPlace = adjustedConfig.fourthPlace * 2 / 3;
    }
  }

  // 2) Para Sanma, solo usar las primeras 3 posiciones
  const pointsByPosition = isSanma
    ? [adjustedConfig.firstPlace, adjustedConfig.secondPlace, adjustedConfig.thirdPlace]
    : [adjustedConfig.firstPlace, adjustedConfig.secondPlace, adjustedConfig.thirdPlace, adjustedConfig.fourthPlace || 0];

  // 3) Usar calcularUmaConEmpates para manejo consistente de empates
  const posicionesArray = finalPositions?.map(p => p.finalPosition) || [position];
  const pointsGained = calcularUmaConEmpates(
    posicionesArray,
    position,
    pointsByPosition
  );

  // 4) Sumar y aplicar piso del dan actual (inmunidad)
  const newDanPoints = currentPoints + pointsGained;
  const currentDanFloor = await getDanFloor(currentPoints, isSanma);
  const finalDanPoints = Math.max(newDanPoints, currentDanFloor);

  // Nunca negativo
  return Math.max(0, finalDanPoints);
}

/**
 * Obtiene el piso DAN para un jugador (inmunidad)
 */
export async function getDanFloor(points: number, isSanma: boolean): Promise<number> {
  const danConfigs = await getDanWithFallback();
  const danConfig = danConfigs.find(config =>
    config.sanma === isSanma &&
    points >= config.minPoints &&
    (config.maxPoints === null || points <= config.maxPoints)
  );

  // Si está protegido, retornar el mínimo del rango actual
  if (danConfig?.isProtected) {
    return danConfig.minPoints;
  }

  // Si no está protegido, no hay piso (puede caer)
  return 0;
}

/**
 * Convierte string de tipo de juego a enum
 */
export function parseGameType(gameTypeString: string): GameType {
  return gameTypeString.toUpperCase() === 'H' ? 'H' : 'T';
}

/**
 * Valida que una posición sea válida
 */
export function isValidPosition(position: number): position is Position {
  return position >= 1 && position <= 4 && Number.isInteger(position);
}

// ===============================
// FUNCIONES MIGRADAS DESDE calculations-real.ts
// ===============================

// Base rate variations for each position (1st, 2nd, 3rd, 4th)
const VARIACIONES_RATE = [30, 10, -10, -30];

// ============================================================================
// CONFIGURACIÓN CENTRALIZADA DE PUNTOS DAN
// ============================================================================

interface PuntosDanConfig {
  primero: number;
  segundo: number;
  tercero: number;
  cuarto: number;
}

// Configuración centralizada de puntos Dan por rango - CORREGIDA SEGÚN TABLA OFICIAL
function getPuntosDanConfig(puntaje_dan: number, tipo_juego: string): PuntosDanConfig {
  const configs: Array<{ min: number; max: number; puntos: PuntosDanConfig }> = [
    // Principiante a 1er kyu (0-1199): Sin penalización
    { min: 0, max: 1200, puntos: { primero: 60, segundo: 30, tercero: 0, cuarto: 0 } },

    // 1er-2do dan (1200-1999): Penalización leve en 4to
    { min: 1200, max: 2000, puntos: { primero: 60, segundo: 30, tercero: 0, cuarto: -30 } },

    // 3er dan (2000-2599): Igual que 1er-2do dan
    { min: 2000, max: 2600, puntos: { primero: 60, segundo: 30, tercero: 0, cuarto: -30 } },

    // 4to dan (2600-3199): Penalización en 3ro y 4to
    { min: 2600, max: 3200, puntos: { primero: 60, segundo: 30, tercero: -15, cuarto: -45 } },

    // 5to dan (3200-3999): Igual que 4to dan
    { min: 3200, max: 4000, puntos: { primero: 60, segundo: 30, tercero: -15, cuarto: -45 } },

    // 6to dan (4000-4999): Igual que 4to-5to dan
    { min: 4000, max: 5000, puntos: { primero: 60, segundo: 30, tercero: -15, cuarto: -45 } },

    // 7mo dan (5000-5999): Penalización más fuerte
    { min: 5000, max: 6000, puntos: { primero: 60, segundo: 30, tercero: -30, cuarto: -60 } },

    // 8vo dan (6000-7499): Igual que 7mo dan
    { min: 6000, max: 7500, puntos: { primero: 60, segundo: 30, tercero: -30, cuarto: -60 } },

    // 9no dan (7500-8999): Penalización máxima en 4to
    { min: 7500, max: 9000, puntos: { primero: 60, segundo: 30, tercero: -30, cuarto: -75 } },

    // 10mo dan+ (9000+): Penalización máxima en 3ro y 4to
    { min: 9000, max: Infinity, puntos: { primero: 60, segundo: 30, tercero: -45, cuarto: -75 } }
  ];

  // Buscar configuración
  const config_encontrada = configs.find(c => puntaje_dan >= c.min && puntaje_dan < c.max);
  const config = config_encontrada?.puntos || { primero: 60, segundo: 30, tercero: -45, cuarto: -75 };

  return config; // El ajuste de Tonpuusen se aplica en el nivel superior
}

// ============================================================================
// FUNCIÓN GENÉRICA PARA CALCULAR EMPATES
// ============================================================================

function calcularConEmpates<T>(
  posiciones_finales: number[],
  posicion_jugador: number,
  valores_por_posicion: T[],
  promediar: (valores: T[]) => T
): T {
  const N = Math.min(valores_por_posicion.length, posiciones_finales.length);

  // si es inválido o fuera de rango, devolvemos pos1 como fallback
  if (!Array.isArray(posiciones_finales) || posicion_jugador < 1 || posicion_jugador > N) {
    return valores_por_posicion[0];
  }

  const tieCount = posiciones_finales.filter(p => p === posicion_jugador).length;

  // sin empate → valor directo
  if (tieCount <= 1) {
    return valores_por_posicion[posicion_jugador - 1];
  }

  // con empate → promedio del rango cubierto por el empate
  const start = posicion_jugador;
  const end = Math.min(N, start + tieCount - 1);

  const valores: T[] = [];
  for (let pos = start; pos <= end; pos++) {
    valores.push(valores_por_posicion[pos - 1]);
  }
  return promediar(valores);
}

// REAL Dan points calculation system - simplified with centralized config
export async function puntajeDan(
  posicion: number,
  tipo_juego: string,
  puntaje: number,
  posiciones_finales?: number[]
): Promise<number> {
  const config = getPuntosDanConfig(puntaje, tipo_juego);
  const puntos_por_posicion = [config.primero, config.segundo, config.tercero, config.cuarto];

  let puntos_dan_ganados: number;
  if (posiciones_finales && posiciones_finales.length >= 3 && posiciones_finales.length <= 4) {
    puntos_dan_ganados = calcularConEmpates(
      posiciones_finales,
      posicion,
      puntos_por_posicion,
      (vals) => vals.reduce((s, v) => s + v, 0) / vals.length
    );
  } else {
    puntos_dan_ganados = puntos_por_posicion[posicion - 1];
  }

  const nuevo_puntaje = puntaje + puntos_dan_ganados;

  // 🛡️ Inmunidad del piso Dan
  const piso = await pisoDan(puntaje);              // piso del rango actual
  const conPiso = Math.max(nuevo_puntaje, piso);

  return Math.max(0, conPiso);
}

// ============================================================================
// FUNCIONES REUTILIZABLES PARA UMA Y OKA USANDO calcularConEmpates
// ============================================================================

// Calcular variación de Rate con empates
function calcularVariacionRate(posiciones_finales: number[], posicion_jugador: number, variacionesUma: number[]): number {
  return calcularConEmpates(
    posiciones_finales,
    posicion_jugador,
    variacionesUma,
    (valores) => valores.reduce((sum, val) => sum + val, 0) / valores.length
  );
}

// Calcular Uma con empates
export function calcularUmaConEmpates(
  posiciones_finales: number[],
  posicion_jugador: number,
  valoresUma: number[]
): number {
  return calcularConEmpates(
    posiciones_finales,
    posicion_jugador,
    valoresUma,
    (valores) => valores.reduce((sum, val) => sum + val, 0) / valores.length
  );
}

// Calcular Oka con empates
export function calcularOkaConEmpates(
  posiciones_finales: number[],
  posicion_jugador: number,
  okaRuleset: number
): number {
  // Crear array de valores: [oka, 0, 0, 0] para posiciones [1, 2, 3, 4]
  const valoresOka = [okaRuleset, 0, 0, 0];

  return calcularConEmpates(
    posiciones_finales,
    posicion_jugador,
    valoresOka,
    (valores) => valores.reduce((sum, val) => sum + val, 0) / valores.length
  );
}

// REAL Rate system - simplified with centralized config
export function getNuevoRate(
  posicion: number,
  viejo: number,
  juegos: number,
  promedio_mesa: number,
  tipo_juego: string,
  posiciones_finales?: number[]
): number {
  // Logs detallados para debugging
  const logInicio = [
    '📈 getNuevoRate - CALCULANDO RATE:',
    `   posicion: ${posicion}`,
    `   viejo: ${viejo}`,
    `   juegos: ${juegos}`,
    `   promedio_mesa: ${promedio_mesa}`,
    `   tipo_juego: ${tipo_juego}`,
    `   posiciones_finales: ${posiciones_finales ? `[${posiciones_finales.join(', ')}]` : 'undefined'}`
  ].join('\n');

  console.log(logInicio);
  console.error('DEBUG getNuevoRate inicio:', logInicio);

  const diferencia = (promedio_mesa - viejo) / 40;
  const ajuste = juegos <= 400 ? 1 - (juegos * 0.002) : 0.2;

  const logCalculos = [
    `   diferencia: ${diferencia}`,
    `   ajuste: ${ajuste}`
  ].join('\n');

  console.log(logCalculos);
  console.error('DEBUG cálculos:', logCalculos);

  let variacion_base: number;
  if (posiciones_finales && posiciones_finales.length === 4) {
    const logEmpates = '   🔄 Usando lógica de empates para Rate';
    console.log(logEmpates);
    console.error('DEBUG usando empates rate:', logEmpates);

    variacion_base = calcularVariacionRate(posiciones_finales, posicion, VARIACIONES_RATE);
  } else {
    const logOriginal = '   📊 Usando lógica original (sin empates)';
    console.log(logOriginal);
    console.error('DEBUG usando original rate:', logOriginal);

    variacion_base = VARIACIONES_RATE[posicion - 1] || 0;
  }

  const variacion = variacion_base + diferencia;
  const multiplicador = tipo_juego === "H" ? 1 : 2 / 3;
  const nuevo_rate = viejo + variacion * ajuste * multiplicador;

  const logFinal = [
    `   variacion_base: ${variacion_base}`,
    `   variacion: ${variacion}`,
    `   multiplicador: ${multiplicador}`,
    `   🎯 nuevo_rate: ${nuevo_rate}`,
    '   ---'
  ].join('\n');

  console.log(logFinal);
  console.error('DEBUG getNuevoRate final:', logFinal);

  return nuevo_rate;
}

// Función para calcular posiciones finales a partir de puntajes
export function calcularPosiciones(puntajes: number[]): {
  posiciones_calculo: number[], // p.ej. 2.5, 3.5 en empates
  posiciones_display: number[]  // p.ej. 1,1,3,4 (la menor del bloque)
} {
  const n = puntajes.length;
  if (n < 3 || n > 4) {
    throw new Error('Se requieren 3 o 4 puntajes');
  }

  // index + puntaje
  const jugadores = puntajes.map((puntaje, index) => ({ index, puntaje }));
  jugadores.sort((a, b) => b.puntaje - a.puntaje);

  const posiciones_calculo = new Array<number>(n);
  const posiciones_display = new Array<number>(n);

  let posicion_actual = 1;

  for (let i = 0; i < n; i++) {
    const jActual = jugadores[i];

    // contar empate
    let tie = 1;
    for (let j = i + 1; j < n; j++) {
      if (jugadores[j].puntaje === jActual.puntaje) tie++;
      else break;
    }

    if (tie === 1) {
      posiciones_calculo[jActual.index] = posicion_actual;
      posiciones_display[jActual.index] = posicion_actual;
    } else {
      // promedio aritmético del rango (posicion_actual..posicion_actual+tie-1)
      const sumaPos = (tie * (2 * posicion_actual + tie - 1)) / 2;
      const posProm = sumaPos / tie;

      for (let k = 0; k < tie; k++) {
        const je = jugadores[i + k];
        posiciones_calculo[je.index] = posProm;
        posiciones_display[je.index] = posicion_actual;
      }
      i += tie - 1; // saltamos el bloque empatado
    }

    posicion_actual += tie;
  }

  return { posiciones_calculo, posiciones_display };
}

export async function pisoDan(puntos: number, isSanma: boolean = false): Promise<number> {
  // Importar configCache para usar configuración consolidada


  // Buscar la configuración actual usando los rangos correctos
  const danConfigs = await getDanWithFallback();
  const config = danConfigs.find(c =>
    c.sanma === isSanma &&
    puntos >= c.minPoints &&
    (c.maxPoints === null || puntos <= c.maxPoints)
  );

  // Si está protegido, retornar el mínimo del rango actual
  if (config?.isProtected) {
    return config.minPoints;
  }

  // Si no está protegido, no hay piso (puede caer)
  return 0;
}
