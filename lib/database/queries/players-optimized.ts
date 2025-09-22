import { configCache } from '../../config-cache';
import { getDanRank } from '../../game-helpers';
import { prisma } from '../client';
import { PlayerWithRanking } from './types';

// Función optimizada para verificar actividad de múltiples jugadores de una vez
async function batchCheckPlayersActivity(playerNumbers: number[]): Promise<Set<number>> {
  try {
    if (playerNumbers.length === 0) return new Set();

    console.log(`🔍 Verificando actividad para ${playerNumbers.length} jugadores`);

    // Obtener todos los players de una vez
    const players = await prisma.player.findMany({
      where: { playerNumber: { in: playerNumbers } },
      select: { id: true, playerNumber: true }
    });

    const playerIdMap = new Map(players.map(p => [p.playerNumber, p.id]));
    const playerIds = Array.from(playerIdMap.values());

    if (playerIds.length === 0) return new Set();

    // Obtener la temporada activa actual
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
      select: { id: true }
    });

    const activePlayerNumbers = new Set<number>();

    // Verificar jugadores activos en temporada actual
    if (activeSeason) {
      const activeInSeason = await prisma.gameResult.groupBy({
        by: ['playerId'],
        where: {
          playerId: { in: playerIds },
          game: {
            tournament: {
              seasonId: activeSeason.id
            }
          }
        }
      });

      // Agregar jugadores activos en temporada
      for (const result of activeInSeason) {
        const playerNumber = [...playerIdMap.entries()].find(([, id]) => id === result.playerId)?.[0];
        if (playerNumber) {
          activePlayerNumbers.add(playerNumber);
        }
      }
    }

    // Para los que no están activos en temporada, verificar último año
    const remainingPlayerIds = playerIds.filter(id => {
      const playerNumber = [...playerIdMap.entries()].find(([, pid]) => pid === id)?.[0];
      return playerNumber && !activePlayerNumbers.has(playerNumber);
    });

    if (remainingPlayerIds.length > 0) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const activeInLastYear = await prisma.gameResult.groupBy({
        by: ['playerId'],
        where: {
          playerId: { in: remainingPlayerIds },
          game: {
            gameDate: { gte: oneYearAgo }
          }
        }
      });

      // Agregar jugadores activos en último año
      for (const result of activeInLastYear) {
        const playerNumber = [...playerIdMap.entries()].find(([, id]) => id === result.playerId)?.[0];
        if (playerNumber) {
          activePlayerNumbers.add(playerNumber);
        }
      }
    }

    console.log(`✅ Jugadores activos encontrados: ${activePlayerNumbers.size}/${playerNumbers.length}`);
    return activePlayerNumbers;

  } catch (error) {
    console.error('Error checking players activity in batch:', error);
    return new Set();
  }
}

// Tabla de conversión hardcodeada según la especificación del usuario
function convertirDanAEspanol(danJapon: string): string {
  const conversionMap: { [key: string]: string } = {
    "新人": "Principiante",
    "9級": "9no kyu",
    "8級": "8vo kyu",
    "7級": "7mo kyu",
    "6級": "6to kyu",
    "5級": "5to kyu",
    "4級": "4to kyu",
    "3級": "3er kyu",
    "2級": "2do kyu",
    "1級": "1er kyu",
    "初段": "1er dan",
    "二段": "2do dan",
    "三段": "3er dan",
    "四段": "4to dan",
    "五段": "5to dan",
    "六段": "6to dan",
    "七段": "7mo dan",
    "八段": "8vo dan",
    "九段": "9no dan",
    "十段": "10mo dan",
    "神室王": "Rey Dios"
  };

  return conversionMap[danJapon] || danJapon;
}

export async function getPlayersWithRanking(
  seasonId?: number,
  type: 'GENERAL' | 'TEMPORADA' = 'GENERAL',
  includeInactive: boolean = false,
  sanma?: boolean // true = 3 jugadores, false = 4 jugadores, undefined = todos
): Promise<PlayerWithRanking[]> {
  try {

    // Obtener la fecha límite para jugadores activos (1 año atrás)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Obtener la temporada actual (más reciente por fecha)
    // Usar la temporada real "2024-25" como temporada actual
    const currentSeason = await prisma.season.findFirst({
      where: { name: '2024-25' },
      orderBy: { startDate: 'desc' }
    });

    // Nota: El filtro de actividad se aplicará después de obtener los datos
    // usando el endpoint /api/players/[legajo]/is-active

    // Consultar datos precalculados desde la tabla PlayerRanking
    const rankings = await prisma.playerRanking.findMany({
      where: {
        ...(sanma !== undefined ? { isSanma: sanma } : {}) // Filtrar por cantidad de jugadores
      },
      include: {
        player: {
          include: {
            country: true
          }
        }
      },
      orderBy: (() => {
        const orderBy = type === 'TEMPORADA'
          ? [
            { seasonPoints: 'desc' as const },
            { seasonAveragePosition: 'asc' as const }
          ]
          : [
            { danPoints: 'desc' as const },
            { ratePoints: 'desc' as const },
            { averagePosition: 'asc' as const }
          ];
        console.log(`📊 OrderBy para ${type}:`, JSON.stringify(orderBy));
        return orderBy;
      })()
    });

    // Si no se incluyen inactivos, filtrar por actividad usando el endpoint

    // Obtener temporada activa una sola vez
    const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
    const sanmaMode: boolean = sanma !== undefined ? Boolean(sanma) : false;

    // Precargar todas las tendencias de una vez
    const playerIds = rankings.map(r => r.player.id);

    // Obtener todas las tendencias DAN de una vez
    const allDanPointsHistory = await prisma.points.findMany({
      where: {
        playerId: { in: playerIds },
        pointsType: 'DAN',
        isSanma: sanmaMode
      },
      orderBy: [{ playerId: 'asc' }, { id: 'desc' }, { createdAt: 'desc' }],
      take: playerIds.length * 10 // máximo 10 por jugador
    });

    // Obtener todas las tendencias SEASON de una vez
    const allSeasonPointsHistory = activeSeason ? await prisma.points.findMany({
      where: {
        playerId: { in: playerIds },
        pointsType: 'SEASON',
        isSanma: sanmaMode,
        seasonId: activeSeason.id
      },
      orderBy: [{ playerId: 'asc' }, { id: 'desc' }, { createdAt: 'desc' }],
      take: playerIds.length * 10 // máximo 10 por jugador
    }) : [];

    // Agrupar por jugador
    const danHistoryByPlayer = new Map<number, any[]>();
    const seasonHistoryByPlayer = new Map<number, any[]>();

    allDanPointsHistory.forEach(point => {
      if (!danHistoryByPlayer.has(point.playerId)) {
        danHistoryByPlayer.set(point.playerId, []);
      }
      if (danHistoryByPlayer.get(point.playerId)!.length < 10) {
        danHistoryByPlayer.get(point.playerId)!.push(point);
      }
    });

    allSeasonPointsHistory.forEach(point => {
      if (!seasonHistoryByPlayer.has(point.playerId)) {
        seasonHistoryByPlayer.set(point.playerId, []);
      }
      if (seasonHistoryByPlayer.get(point.playerId)!.length < 10) {
        seasonHistoryByPlayer.get(point.playerId)!.push(point);
      }
    });

    // Convertir a formato esperado (ahora sin async en el map)
    const playersWithRanking: PlayerWithRanking[] = await Promise.all(rankings.map(async (ranking: any, index: number) => {
      const totalGamesForMode = type === 'TEMPORADA' ? ranking.seasonTotalGames : ranking.totalGames;
      const firstPlaceHForMode = type === 'TEMPORADA' ? ranking.seasonFirstPlaceH : ranking.firstPlaceH;
      const secondPlaceHForMode = type === 'TEMPORADA' ? ranking.seasonSecondPlaceH : ranking.secondPlaceH;
      const thirdPlaceHForMode = type === 'TEMPORADA' ? ranking.seasonThirdPlaceH : ranking.thirdPlaceH;
      const fourthPlaceHForMode = type === 'TEMPORADA' ? ranking.seasonFourthPlaceH : ranking.fourthPlaceH;
      const firstPlaceTForMode = type === 'TEMPORADA' ? ranking.seasonFirstPlaceT : ranking.firstPlaceT;
      const secondPlaceTForMode = type === 'TEMPORADA' ? ranking.seasonSecondPlaceT : ranking.secondPlaceT;
      const thirdPlaceTForMode = type === 'TEMPORADA' ? ranking.seasonThirdPlaceT : ranking.thirdPlaceT;
      const fourthPlaceTForMode = type === 'TEMPORADA' ? ranking.seasonFourthPlaceT : ranking.fourthPlaceT;

      const totalWins = firstPlaceHForMode + firstPlaceTForMode;
      const winRate = totalGamesForMode > 0 ? ((totalWins / totalGamesForMode) * 100) : 0;

      // Usar sanmaMode precalculado
      const rankingSanmaMode: boolean = sanma !== undefined ? Boolean(sanma) : Boolean(ranking.isSanma);

      // Obtener ranking Dan y su color
      const danRankJapon = await getDanRank(ranking.danPoints);
      const danRankEspanol = convertirDanAEspanol(danRankJapon);

      // Obtener color del rango desde la base de datos
      const danConfig = await configCache.getDanConfigByPoints(ranking.danPoints, rankingSanmaMode);
      const rankColor = danConfig?.color || '#3b82f6'; // fallback al azul por defecto

      // Obtener datos para progreso de rango
      const currentRankConfig = danConfig;
      const nextRankConfig = currentRankConfig ?
        await configCache.getDanConfigByPoints(currentRankConfig.maxPoints + 1, rankingSanmaMode) :
        null;

      // Usar datos precargados para tendencias
      const danPointsHistory = danHistoryByPlayer.get(ranking.player.id) || [];
      const trendDanDelta10 = danPointsHistory.length >= 2
        ? Number(danPointsHistory[0].pointsValue) - Number(danPointsHistory[danPointsHistory.length - 1].pointsValue)
        : 0;

      const seasonPointsHistory = seasonHistoryByPlayer.get(ranking.player.id) || [];
      const trendSeasonDelta10 = seasonPointsHistory.length >= 2
        ? Number(seasonPointsHistory[0].pointsValue) - Number(seasonPointsHistory[seasonPointsHistory.length - 1].pointsValue)
        : 0;

      return {
        id: ranking.player.id,
        nickname: ranking.player.nickname,
        fullname: ranking.player.fullname,
        country_id: ranking.player.countryId,
        player_id: ranking.player.playerNumber, // legajo
        birthday: ranking.player.birthday,
        country_iso: ranking.player.country?.isoCode || '',
        country_name: ranking.player.country?.fullName || '',
        createdAt: ranking.player.createdAt,
        updatedAt: ranking.player.updatedAt,

        // Ranking fields - datos precalculados
        position: index + 1, // Se recalculará después del filtro si se excluyen inactivos
        total_games: totalGamesForMode,
        average_position: Math.round(((type === 'TEMPORADA' ? ranking.seasonAveragePosition : ranking.averagePosition) || 0) * 100) / 100,
        dan_points: Math.round(ranking.danPoints),
        rate_points: Math.round(ranking.ratePoints),
        season_points: Math.round(ranking.seasonPoints),
        season_average_position: Math.round((ranking.seasonAveragePosition || 0) * 100) / 100,
        max_rate: Math.round(ranking.maxRate),
        win_rate: Math.round(winRate * 100) / 100, // 2 decimales
        rank: danRankJapon, // Usar japonés como principal
        rank_spanish: danRankEspanol, // Añadir español para tooltip
        rank_color: rankColor, // Color del rango desde la base de datos

        // Datos para progreso de rango
        rank_min_points: currentRankConfig?.minPoints,
        rank_max_points: currentRankConfig?.maxPoints,
        next_rank: nextRankConfig?.rank,

        // Estadísticas detalladas por tipo de juego
        first_place_h: firstPlaceHForMode,
        second_place_h: secondPlaceHForMode,
        third_place_h: thirdPlaceHForMode,
        fourth_place_h: fourthPlaceHForMode,
        first_place_t: firstPlaceTForMode,
        second_place_t: secondPlaceTForMode,
        third_place_t: thirdPlaceTForMode,
        fourth_place_t: fourthPlaceTForMode,

        // Tendencias
        trend_dan_delta10: Math.round(trendDanDelta10 * 100) / 100,
        trend_season_delta10: Math.round(trendSeasonDelta10 * 100) / 100
      };
    }));

    // Ordenamiento adicional para temporada: agregar win rate como tercer criterio
    if (type === 'TEMPORADA') {
      console.log(`🔄 Aplicando ordenamiento JavaScript para TEMPORADA`);
      playersWithRanking.sort((a, b) => {
        // 1. Puntos de temporada (descendente)
        const aSeasonPoints = a.season_points || 0;
        const bSeasonPoints = b.season_points || 0;
        if (bSeasonPoints !== aSeasonPoints) {
          return bSeasonPoints - aSeasonPoints;
        }

        // 2. Promedio de posición (ascendente - mejor promedio)
        const aSeasonAvgPos = a.season_average_position || 0;
        const bSeasonAvgPos = b.season_average_position || 0;
        if (aSeasonAvgPos !== bSeasonAvgPos) {
          return aSeasonAvgPos - bSeasonAvgPos;
        }

        // 3. Win rate (descendente)
        return b.win_rate - a.win_rate;
      });
    }

    // Filtrar jugadores inactivos si se requiere
    if (!includeInactive) {
      console.log(`🔍 Filtrando jugadores inactivos. Total antes del filtro: ${playersWithRanking.length}`);

      // Verificar actividad de todos los jugadores de una vez (batch)
      const playerNumbers = playersWithRanking.map(p => p.player_id);
      const activePlayerNumbers = await batchCheckPlayersActivity(playerNumbers);

      // Filtrar solo jugadores activos
      const activePlayersWithRanking = playersWithRanking.filter(player =>
        activePlayerNumbers.has(player.player_id)
      );

      console.log(`✅ Jugadores activos encontrados: ${activePlayersWithRanking.length}`);

      // Recalcular posiciones consecutivas para jugadores activos
      const activePlayersWithConsecutivePositions = activePlayersWithRanking.map((player, index) => ({
        ...player,
        position: index + 1  // Posiciones consecutivas: 1, 2, 3, 4, etc.
      }));

      return activePlayersWithConsecutivePositions;
    }

    return playersWithRanking;

  } catch (error) {
    console.error('❌ Error en consulta optimizada:', error);
    throw new Error(`Failed to get optimized ranking: ${error}`);
  }
}

// Función para obtener ranking de una temporada específica
export async function getSeasonRanking(seasonId: number): Promise<PlayerWithRanking[]> {
  return getPlayersWithRanking(seasonId, 'TEMPORADA');
}

// Función para obtener jugador específico
export async function getPlayerById(playerId: number, sanma: boolean = false): Promise<PlayerWithRanking | null> {
  try {
    const ranking = await prisma.playerRanking.findFirst({
      where: {
        playerId: playerId,
        isSanma: sanma
      },
      include: {
        player: {
          include: {
            country: true
          }
        }
      }
    });

    if (!ranking) return null;

    const totalWins = ranking.firstPlaceH + ranking.firstPlaceT;
    const winRate = ranking.totalGames > 0 ? ((totalWins / ranking.totalGames) * 100) : 0;
    const danRankJapon = await getDanRank(ranking.danPoints);
    const danRankEspanol = convertirDanAEspanol(danRankJapon);

    // Obtener color del rango desde la base de datos
    const danConfig = await configCache.getDanConfigByPoints(ranking.danPoints, sanma);
    const rankColor = danConfig?.color || '#3b82f6'; // fallback al azul por defecto

    // Obtener datos para progreso de rango
    const currentRankConfig = danConfig;
    const nextRankConfig = currentRankConfig ?
      await configCache.getDanConfigByPoints(currentRankConfig.maxPoints + 1, sanma) :
      null;

    return {
      id: ranking.player.id,
      nickname: ranking.player.nickname,
      fullname: ranking.player.fullname,
      country_id: ranking.player.countryId,
      player_id: ranking.player.playerNumber,
      birthday: ranking.player.birthday,
      country_iso: ranking.player.country?.isoCode || '',
      country_name: ranking.player.country?.fullName || '',
      createdAt: ranking.player.createdAt,
      updatedAt: ranking.player.updatedAt,
      position: 0, // Se puede calcular si es necesario
      total_games: ranking.totalGames,
      average_position: Math.round(ranking.averagePosition * 100) / 100,
      dan_points: Math.round(ranking.danPoints),
      rate_points: Math.round(ranking.ratePoints),
      max_rate: Math.round(ranking.maxRate),
      win_rate: Math.round(winRate * 100) / 100,
      rank: danRankJapon, // Usar japonés como principal
      rank_spanish: danRankEspanol, // Añadir español para tooltip
      rank_color: rankColor, // Color del rango desde la base de datos

      // Datos para progreso de rango
      rank_min_points: currentRankConfig?.minPoints,
      rank_max_points: currentRankConfig?.maxPoints,
      next_rank: nextRankConfig?.rank,
      first_place_h: ranking.firstPlaceH,
      second_place_h: ranking.secondPlaceH,
      third_place_h: ranking.thirdPlaceH,
      fourth_place_h: ranking.fourthPlaceH,
      first_place_t: ranking.firstPlaceT,
      second_place_t: ranking.secondPlaceT,
      third_place_t: ranking.thirdPlaceT,
      fourth_place_t: ranking.fourthPlaceT
    };
  } catch (error) {
    console.error(`❌ Error obteniendo jugador ${playerId}:`, error);
    return null;
  }
}

// Función para crear jugador (mantener compatibilidad)
export async function createPlayer(playerData: any): Promise<any> {
  try {
    const newPlayer = await prisma.player.create({
      data: playerData
    });

    // Crear entradas iniciales en PlayerRanking (4 jugadores)
    await prisma.playerRanking.create({
      data: {
        playerId: newPlayer.id,
        isSanma: false, // 4 jugadores
        totalGames: 0,
        averagePosition: 2.5,
        danPoints: 0, // Empezar en 0 según la memoria
        ratePoints: 1500,
        seasonPoints: 0,
        maxRate: 1500,
        firstPlaceH: 0, secondPlaceH: 0, thirdPlaceH: 0, fourthPlaceH: 0,
        firstPlaceT: 0, secondPlaceT: 0, thirdPlaceT: 0, fourthPlaceT: 0
      }
    });

    // Crear entradas iniciales en PlayerRanking (3 jugadores)
    await prisma.playerRanking.create({
      data: {
        playerId: newPlayer.id,
        isSanma: true, // 3 jugadores
        totalGames: 0,
        averagePosition: 2.0, // Promedio para 3 jugadores
        danPoints: 0, // Empezar en 0 según la memoria
        ratePoints: 1500,
        seasonPoints: 0,
        maxRate: 1500,
        firstPlaceH: 0, secondPlaceH: 0, thirdPlaceH: 0, fourthPlaceH: 0,
        firstPlaceT: 0, secondPlaceT: 0, thirdPlaceT: 0, fourthPlaceT: 0
      }
    });

    return newPlayer;
  } catch (error) {
    console.error('❌ Error creando jugador:', error);
    throw new Error(`Failed to create player: ${error}`);
  }
}
