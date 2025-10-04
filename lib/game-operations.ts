/**
 * Operaciones de alto nivel para gestión de juegos y jugadores
 * Utiliza las funciones de cálculo centralizadas para mantener consistencia
 */

import { PrismaClient } from '@prisma/client';
import {
  calculateFinalPositions,
  calculateGameResults,
  isValidPosition,
  parseGameType,
  type PlayerScore
} from './game-calculations';

// ===============================
// TIPOS PARA OPERACIONES
// ===============================

export interface NewPlayerData {
  nickname: string;
  fullname?: string;
  countryId?: bigint;
  playerId?: number; // Si no se proporciona, se asigna automáticamente
}

export interface GamePlayerInput {
  playerId: bigint; // ID del jugador en la BD
  gameScore: number; // Puntaje final en el juego
  wind?: string; // Viento (E, S, W, N)
  chonbos?: number; // Cantidad de chonbos
  oorasuScore?: number; // Puntaje en oorasu (opcional)
}

export interface NewGameData {
  gameDate: Date;
  venue?: string;
  locationId?: bigint;
  duration: 'HANCHAN' | 'TONPUUSEN';
  sanma: boolean; // true = 3 jugadores, false = 4 jugadores
  rulesetId: bigint;
  players: GamePlayerInput[];
  imageUrl?: string;
}

export interface GameCreationResult {
  success: boolean;
  gameId?: bigint;
  message: string;
  errors?: string[];
}

export interface PlayerCreationResult {
  success: boolean;
  playerId?: bigint;
  playerLegajo?: number;
  message: string;
}

// ===============================
// FUNCIONES DE JUGADORES
// ===============================

/**
 * Crea un nuevo jugador con legajo automático
 */
export async function createPlayer(
  prisma: PrismaClient,
  playerData: NewPlayerData
): Promise<PlayerCreationResult> {
  try {
    // Si no se proporciona playerId, buscar el próximo disponible
    let legajo = playerData.playerId;

    if (!legajo) {
      legajo = await getNextAvailablePlayerId(prisma);
    }

    // Verificar que el legajo no esté ocupado
    const existingPlayer = await prisma.player.findUnique({
      where: { playerNumber: legajo }
    });

    if (existingPlayer) {
      return {
        success: false,
        message: `El legajo ${legajo} ya está ocupado por ${existingPlayer.nickname}`
      };
    }

    // Obtener país por defecto (Argentina) si no se especifica
    let countryId: bigint | undefined = playerData.countryId ? BigInt(playerData.countryId) : undefined;
    if (!countryId) {
      const defaultCountry = await prisma.country.findFirst({
        where: { isoCode: 'AR' }
      });
      countryId = defaultCountry?.id || BigInt(1);
    }

    // Crear el jugador
    const newPlayer = await prisma.player.create({
      data: {
        playerNumber: legajo,
        nickname: playerData.nickname,
        fullname: playerData.fullname,
        countryId: countryId
      }
    });

    // Crear ranking inicial para el jugador (4 jugadores)
    await prisma.playerRanking.create({
      data: {
        playerId: newPlayer.id,
        isSanma: false,
        danPoints: 0, // Principiante
        ratePoints: 1500, // Rate inicial estándar
        maxRate: 1500,
        totalGames: 0
      }
    });

    // Crear ranking inicial para el jugador (3 jugadores)
    await prisma.playerRanking.create({
      data: {
        playerId: newPlayer.id,
        isSanma: true,
        danPoints: 0, // Principiante
        ratePoints: 1500, // Rate inicial estándar
        maxRate: 1500,
        totalGames: 0
      }
    });

    return {
      success: true,
      playerId: newPlayer.id,
      playerLegajo: newPlayer.playerNumber,
      message: `Jugador ${playerData.nickname} creado exitosamente con legajo ${legajo}`
    };

  } catch (error) {
    console.error('Error creating player:', error);
    return {
      success: false,
      message: `Error al crear jugador: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

/**
 * Busca el próximo legajo disponible empezando desde 1
 */
async function getNextAvailablePlayerId(prisma: PrismaClient): Promise<number> {
  // Obtener todos los legajos ocupados
  const occupiedLegajos = await prisma.player.findMany({
    select: { playerNumber: true },
    orderBy: { playerNumber: 'asc' }
  });

  const occupiedSet = new Set(occupiedLegajos.map(p => p.playerNumber));

  // Buscar el primer número disponible desde 1
  for (let legajo = 1; legajo <= 10000; legajo++) {
    if (!occupiedSet.has(legajo)) {
      return legajo;
    }
  }

  // Si no hay disponibles, usar número alto
  return Math.floor(Math.random() * 90000) + 10000;
}

// ===============================
// FUNCIONES DE JUEGOS
// ===============================

/**
 * Crea un nuevo juego con cálculos automáticos de puntos
 */
export async function createGame(
  prisma: PrismaClient,
  gameData: NewGameData
): Promise<GameCreationResult> {
  try {
    // Validaciones básicas
    const validationErrors = validateGameData(gameData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        message: 'Datos del juego inválidos',
        errors: validationErrors
      };
    }

    // Obtener datos de los jugadores y del ruleset
    const players = await Promise.all(
      gameData.players.map(async (playerInput) => {
        const player = await prisma.player.findUnique({
          where: { id: playerInput.playerId },
          include: {
            rankings: {
              where: { isSanma: gameData.sanma },
              take: 1
            }
          }
        });

        if (!player) {
          throw new Error(`Jugador con ID ${playerInput.playerId} no encontrado`);
        }

        const ranking = player.rankings[0];
        if (!ranking) {
          throw new Error(`Ranking no encontrado para jugador ${playerInput.playerId} en modo ${gameData.sanma ? 'sanma' : 'yonma'}`);
        }

        return {
          ...player,
          ranking,
          gameScore: playerInput.gameScore,
          wind: playerInput.wind,
          chonbos: playerInput.chonbos || 0,
          oorasuScore: playerInput.oorasuScore
        };
      })
    );

    const ruleset = await prisma.ruleset.findUnique({
      where: { id: gameData.rulesetId },
      include: { uma: true }
    });

    if (!ruleset) {
      return {
        success: false,
        message: `Ruleset con ID ${gameData.rulesetId} no encontrado`
      };
    }

    // Calcular posiciones finales basadas en los puntajes
    const playerScores: PlayerScore[] = gameData.players.map(p => ({
      id: BigInt(p.playerId),
      finalScore: p.gameScore
    }));
    const finalPositions = calculateFinalPositions(playerScores);

    // Calcular promedio de Rate de la mesa
    const currentRates = players.map(p => p.ranking.ratePoints);
    const averageTableRate = currentRates.reduce((sum, rate) => sum + rate, 0) / currentRates.length;

    // Obtener valores Uma del ruleset
    const umaValues = [
      ruleset.uma.firstPlace,
      ruleset.uma.secondPlace,
      ruleset.uma.thirdPlace,
      ruleset.uma.fourthPlace || 0
    ];

    const gameType = parseGameType(gameData.duration === 'HANCHAN' ? 'H' : 'T');

    // Crear el juego
    const newGame = await prisma.game.create({
      data: {
        gameDate: gameData.gameDate,
        gameType: gameData.duration,
        rulesetId: gameData.rulesetId,
        locationId: gameData.locationId || 1, // Usar locationId del gameData o Club CAMR por defecto
        imageUrl: gameData.imageUrl,
        seasonId: await getCurrentSeasonId(prisma)
      }
    });

    // Preparar datos para cálculo de resultados
    const currentRankings = new Map();
    players.forEach(player => {
      currentRankings.set(player.id, {
        danPoints: player.ranking.danPoints,
        ratePoints: player.ranking.ratePoints,
        totalGames: player.ranking.totalGames,
        seasonPoints: 0 // Por ahora no usamos season points
      });
    });

    // Calcular resultados usando la función centralizada
    const calculationResults = await calculateGameResults(
      playerScores,
      gameType,
      currentRankings,
      averageTableRate,
      gameData.sanma,
      false, // seasonEligible - por ahora false
      undefined // seasonId
    );

    // Crear GameResults y actualizar estadísticas de jugadores
    const gameResults = await Promise.all(
      players.map(async (player, index) => {
        const playerPosition = finalPositions.find(p => p.id === player.id);
        if (!playerPosition) {
          throw new Error(`Posición no encontrada para jugador ${player.id}`);
        }

        const calculationResult = calculationResults.find(r => r.playerId === player.id);
        if (!calculationResult) {
          throw new Error(`Resultado de cálculo no encontrado para jugador ${player.id}`);
        }

        // Calcular Uma y otros valores
        const umaValue = umaValues[playerPosition.finalPosition - 1];
        const chonboTotal = (player.chonbos * (ruleset.chonbo || -40));
        const finalScore = player.gameScore + umaValue + chonboTotal;

        // Crear GameResult
        const gameResult = await prisma.gameResult.create({
          data: {
            gameId: newGame.id,
            playerId: player.id,
            finalPosition: playerPosition.finalPosition,
            finalScore: finalScore / 1000, // Dividir por 1000 para guardar en la escala correcta
            danPointsEarned: calculationResult.danChange,
            rateChange: calculationResult.rateChange
          }
        });

        // Actualizar ranking del jugador
        await prisma.playerRanking.update({
          where: {
            playerId_isSanma: {
              playerId: player.id,
              isSanma: gameData.sanma
            }
          },
          data: {
            danPoints: calculationResult.newDanPoints,
            ratePoints: calculationResult.newRatePoints,
            maxRate: Math.max(player.ranking.maxRate, calculationResult.newRatePoints),
            totalGames: player.ranking.totalGames + 1,
            // Actualizar contadores de posiciones
            ...(playerPosition.finalPosition === 1 && gameType === 'H' ? { firstPlaceH: { increment: 1 } } : {}),
            ...(playerPosition.finalPosition === 2 && gameType === 'H' ? { secondPlaceH: { increment: 1 } } : {}),
            ...(playerPosition.finalPosition === 3 && gameType === 'H' ? { thirdPlaceH: { increment: 1 } } : {}),
            ...(playerPosition.finalPosition === 4 && gameType === 'H' ? { fourthPlaceH: { increment: 1 } } : {}),
            ...(playerPosition.finalPosition === 1 && gameType === 'T' ? { firstPlaceT: { increment: 1 } } : {}),
            ...(playerPosition.finalPosition === 2 && gameType === 'T' ? { secondPlaceT: { increment: 1 } } : {}),
            ...(playerPosition.finalPosition === 3 && gameType === 'T' ? { thirdPlaceT: { increment: 1 } } : {}),
            ...(playerPosition.finalPosition === 4 && gameType === 'T' ? { fourthPlaceT: { increment: 1 } } : {})
          }
        });

        // Actualizar fecha del último juego en Player
        // lastGameDate field removed from schema

        return gameResult;
      })
    );

    // Calcular y distribuir Oka si aplica
    if (ruleset.oka && ruleset.oka > 0) {
      await distributeOka(prisma, Number(newGame.id), gameResults, ruleset.oka);
    }

    return {
      success: true,
      gameId: newGame.id,
      message: `Juego creado exitosamente con ${players.length} jugadores`
    };

  } catch (error) {
    console.error('Error creating game:', error);
    return {
      success: false,
      message: `Error al crear juego: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

// ===============================
// FUNCIONES AUXILIARES
// ===============================

/**
 * Valida los datos de un juego antes de crearlo
 */
function validateGameData(gameData: NewGameData): string[] {
  const errors: string[] = [];

  // Validar cantidad de jugadores
  const expectedPlayers = gameData.sanma ? 3 : 4;
  if (gameData.players.length !== expectedPlayers) {
    errors.push(`Se esperan ${expectedPlayers} jugadores para ${gameData.sanma ? 'Sanma' : 'Yonma'}`);
  }

  // Validar puntajes
  const totalScore = gameData.players.reduce((sum, p) => sum + p.gameScore, 0);
  const expectedTotal = expectedPlayers * 25000; // Asumiendo 25k inicial estándar

  if (Math.abs(totalScore - expectedTotal) > 100) { // Tolerancia de 100 puntos
    errors.push(`La suma de puntajes (${totalScore}) no coincide con el esperado (${expectedTotal})`);
  }

  // Validar jugadores únicos
  const playerIds = gameData.players.map(p => p.playerId);
  const uniquePlayerIds = new Set(playerIds);
  if (uniquePlayerIds.size !== playerIds.length) {
    errors.push('No puede haber jugadores duplicados en el mismo juego');
  }

  // Validar posiciones de puntajes
  gameData.players.forEach((player, index) => {
    if (!isValidPosition(index + 1)) {
      errors.push(`Posición inválida para jugador ${player.playerId}`);
    }
  });

  return errors;
}

/**
 * Obtiene el ID de la temporada actual
 */
async function getCurrentSeasonId(prisma: PrismaClient): Promise<bigint> {
  const currentSeason = await prisma.season.findFirst({
    where: { isActive: true }
  });

  if (currentSeason) {
    return currentSeason.id;
  }

  // Si no hay temporada actual, crear una por defecto
  const newSeason = await prisma.season.create({
    data: {
      name: `Temporada ${new Date().getFullYear()}`,
      isActive: true,
      startDate: new Date(`${new Date().getFullYear()}-01-01`),
      endDate: new Date(`${new Date().getFullYear()}-12-31`)
    }
  });

  return newSeason.id;
}

/**
 * Distribuye el Oka entre los jugadores en primer lugar
 */
async function distributeOka(
  prisma: PrismaClient,
  gameId: number,
  gameResults: any[],
  okaAmount: number
): Promise<void> {
  // Encontrar jugadores en primer lugar
  const firstPlaceResults = gameResults.filter(result => result.finalPosition === 1);

  if (firstPlaceResults.length === 0) return;

  const okaPerPlayer = okaAmount / firstPlaceResults.length;

  // Actualizar cada GameResult con su parte del Oka
  await Promise.all(
    firstPlaceResults.map(async (result) => {
      await prisma.gameResult.update({
        where: { id: result.id },
        data: {
          finalScore: { increment: okaPerPlayer }
        }
      });
    })
  );
}
