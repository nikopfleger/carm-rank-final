// lib/database/queries/players-optimized.ts
import 'server-only';

// Evitar dependencia de cache en warm-up: resolvemos rank con configs locales
import { prisma } from '../client';
import type { PlayerWithRanking } from './types';

// ----------------------------------------------
// Tipos mínimos locales (lo que realmente usamos)
// ----------------------------------------------
type DanConfig = {
  id: number;
  rank: string;
  sanma: boolean;
  minPoints: number;
  maxPoints: number | null;
  color: string;
};

function getDanRankFromConfigs(danPoints: number, isSanma: boolean, configs: DanConfig[]): string {
  const sameMode = configs.filter(c => c.sanma === isSanma).sort((a, b) => a.minPoints - b.minPoints);
  const lowest = sameMode[0];
  const lowestRank = lowest?.rank || 'N/A';
  if (lowest && danPoints < (lowest.minPoints ?? 0)) return lowestRank;
  const current = sameMode.find(c => danPoints >= c.minPoints && (c.maxPoints === null || danPoints <= c.maxPoints));
  return current?.rank || lowestRank;
}

// ----------------------------------------------
// Helper: obtener todas las configs de Dan (DB)
// ----------------------------------------------
async function fetchDanConfigs(): Promise<DanConfig[]> {
  const rows = await prisma.danConfig.findMany({
    where: { deleted: false },
    orderBy: [{ sanma: 'asc' }, { minPoints: 'asc' }],
    select: {
      id: true,
      rank: true,
      sanma: true,
      minPoints: true,
      maxPoints: true,
      color: true,
    },
  });
  return rows;
}

// ----------------------------------------------
// Actividad de jugadores (batched)
// ----------------------------------------------
type PlayerActivity = {
  player_number: number;
  active_general: boolean;
  active_seasonal: boolean;
};

async function batchCheckPlayersActivity(playerNumbers: number[]): Promise<PlayerActivity[]> {
  try {
    if (playerNumbers.length === 0) return [];

    console.log(`🔍 Verificando actividad para ${playerNumbers.length} jugadores`);

    const rows = await prisma.$queryRaw<PlayerActivity[]>`
      WITH active_season AS (
        SELECT s.id
        FROM season s
        WHERE s.is_active = true AND s.deleted = false
        LIMIT 1
      )
      SELECT
        tp.player_number,
        (
          EXISTS (
            SELECT 1
            FROM game_result gr
            JOIN game g ON g.id = gr.game_id
            JOIN active_season a ON a.id = g.season_id
            WHERE gr.player_id = tp.id
            LIMIT 1
          )
          OR EXISTS (
            SELECT 1
            FROM game_result gr
            JOIN game g ON g.id = gr.game_id
            WHERE gr.player_id = tp.id
              AND g.game_date >= (now() AT TIME ZONE 'utc' - INTERVAL '1 year')
            LIMIT 1
          )
        ) AS active_general,
        (
          EXISTS (
            SELECT 1
            FROM game_result gr
            JOIN game g ON g.id = gr.game_id
            JOIN active_season a ON a.id = g.season_id
            WHERE gr.player_id = tp.id
              AND g.tournament_id IS NOT NULL
            LIMIT 1
          )
        ) AS active_seasonal
      FROM player tp
      WHERE tp.player_number = ANY(${playerNumbers})
    `;

    return rows;
  } catch (error) {
    console.error('Error checking players activity in batch:', error);
    return [];
  }
}

// ----------------------------------------------
// Ranking principal optimizado
// ----------------------------------------------
export async function getPlayersWithRanking(
  seasonId?: number,
  type: 'GENERAL' | 'TEMPORADA' = 'GENERAL',
  includeInactive: boolean = false,
  sanma?: boolean,
): Promise<PlayerWithRanking[]> {
  try {
    // Cargamos configs de Dan desde DB para evitar ciclo con la caché
    const danConfigs = await fetchDanConfigs();

    // Si necesitás, podés usar la fecha límite (no se usa directo acá)
    // const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Temporada activa (para tendencias)
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true, deleted: false },
      orderBy: { startDate: 'desc' },
    });

    // Datos precalculados desde PlayerRanking
    const rankings = await prisma.playerRanking.findMany({
      where: {
        ...(sanma !== undefined ? { isSanma: sanma } : {}),
        // Excluir siempre jugadores eliminados del ranking
        player: { deleted: false },
      },
      include: {
        player: { include: { country: true } },
      },
      orderBy: (() => {
        const orderBy =
          type === 'TEMPORADA'
            ? [{ seasonPoints: 'desc' as const }, { seasonAveragePosition: 'asc' as const }]
            : [{ danPoints: 'desc' as const }, { ratePoints: 'desc' as const }, { averagePosition: 'asc' as const }];
        console.log(`📊 OrderBy para ${type}:`, JSON.stringify(orderBy));
        return orderBy;
      })(),
    });

    // Precargamos tendencias en batch
    const playerIds = rankings.map(r => r.player.id);
    const sanmaMode = sanma !== undefined ? Boolean(sanma) : false;

    const allDanPointsHistory = await prisma.points.findMany({
      where: { playerId: { in: playerIds }, pointsType: 'DAN', isSanma: sanmaMode },
      orderBy: [{ playerId: 'asc' }, { id: 'desc' }, { createdAt: 'desc' }],
      take: playerIds.length * 5,
    });

    const allSeasonPointsHistory = activeSeason
      ? await prisma.points.findMany({
        where: {
          playerId: { in: playerIds },
          pointsType: 'SEASON',
          isSanma: sanmaMode,
          seasonId: activeSeason.id,
        },
        orderBy: [{ playerId: 'asc' }, { id: 'desc' }, { createdAt: 'desc' }],
        take: playerIds.length * 5,
      })
      : [];

    const danHistoryByPlayer = new Map<number, any[]>();
    const seasonHistoryByPlayer = new Map<number, any[]>();

    for (const point of allDanPointsHistory) {
      const arr = danHistoryByPlayer.get(point.playerId) ?? [];
      if (arr.length < 10) arr.push(point);
      danHistoryByPlayer.set(point.playerId, arr);
    }
    for (const point of allSeasonPointsHistory) {
      const arr = seasonHistoryByPlayer.get(point.playerId) ?? [];
      if (arr.length < 10) arr.push(point);
      seasonHistoryByPlayer.set(point.playerId, arr);
    }

    // Mapeo final
    const playersWithRanking: PlayerWithRanking[] = await Promise.all(
      rankings.map(async (ranking: any, index: number) => {
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
        const winRate = totalGamesForMode > 0 ? (totalWins / totalGamesForMode) * 100 : 0;

        const rankingSanmaMode: boolean = sanma !== undefined ? Boolean(sanma) : Boolean(ranking.isSanma);

        const danRankJapon = getDanRankFromConfigs(ranking.danPoints, rankingSanmaMode, danConfigs);

        // Resolver color y next rank usando danConfigs locales
        const currentRankConfig = danConfigs.find(
          (c) =>
            c.sanma === rankingSanmaMode &&
            ranking.danPoints >= c.minPoints &&
            (c.maxPoints === null || ranking.danPoints <= c.maxPoints),
        );
        const rankColor = currentRankConfig?.color ?? '#3b82f6';

        const nextRankConfig =
          currentRankConfig && currentRankConfig.maxPoints !== null
            ? danConfigs.find(
              (c) =>
                c.sanma === rankingSanmaMode &&
                (currentRankConfig.maxPoints! + 1) >= c.minPoints &&
                (c.maxPoints === null || currentRankConfig.maxPoints! + 1 <= c.maxPoints),
            )
            : null;

        const danPointsHistory = danHistoryByPlayer.get(ranking.player.id) ?? [];
        const trendDanDelta10 =
          danPointsHistory.length >= 2
            ? Number(danPointsHistory[0].pointsValue) - Number(danPointsHistory[danPointsHistory.length - 1].pointsValue)
            : 0;

        const seasonPointsHistory = seasonHistoryByPlayer.get(ranking.player.id) ?? [];
        const trendSeasonDelta10 =
          seasonPointsHistory.length >= 2
            ? Number(seasonPointsHistory[0].pointsValue) - Number(seasonPointsHistory[seasonPointsHistory.length - 1].pointsValue)
            : 0;

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

          position: index + 1,
          total_games: totalGamesForMode,
          average_position: Math.round(((type === 'TEMPORADA' ? ranking.seasonAveragePosition : ranking.averagePosition) || 0) * 100) / 100,
          dan_points: Math.round(ranking.danPoints),
          rate_points: Math.round(ranking.ratePoints),
          season_points: Math.round(ranking.seasonPoints),
          season_average_position: Math.round((ranking.seasonAveragePosition || 0) * 100) / 100,
          max_rate: Math.round(ranking.maxRate),
          win_rate: Math.round(winRate * 100) / 100,
          rank: danRankJapon,
          rank_color: rankColor,

          rank_min_points: currentRankConfig?.minPoints,
          rank_max_points: currentRankConfig?.maxPoints ?? null,
          next_rank: nextRankConfig?.rank,

          first_place_h: firstPlaceHForMode,
          second_place_h: secondPlaceHForMode,
          third_place_h: thirdPlaceHForMode,
          fourth_place_h: fourthPlaceHForMode,
          first_place_t: firstPlaceTForMode,
          second_place_t: secondPlaceTForMode,
          third_place_t: thirdPlaceTForMode,
          fourth_place_t: fourthPlaceTForMode,

          trend_dan_delta10: Math.round(trendDanDelta10 * 100) / 100,
          trend_season_delta10: Math.round(trendSeasonDelta10 * 100) / 100,
        };
      }),
    );

    // Orden extra para TEMPORADA
    if (type === 'TEMPORADA') {
      console.log(`🔄 Aplicando ordenamiento JavaScript para TEMPORADA`);
      playersWithRanking.sort((a, b) => {
        const aHasGames = (a.total_games || 0) > 0 ? 1 : 0;
        const bHasGames = (b.total_games || 0) > 0 ? 1 : 0;
        if (aHasGames !== bHasGames) return bHasGames - aHasGames;

        const aSeasonPoints = a.season_points || 0;
        const bSeasonPoints = b.season_points || 0;
        if (bSeasonPoints !== aSeasonPoints) return bSeasonPoints - aSeasonPoints;

        const aSeasonAvgPos = a.season_average_position || 0;
        const bSeasonAvgPos = b.season_average_position || 0;
        if (aSeasonAvgPos !== bSeasonAvgPos) return aSeasonAvgPos - bSeasonAvgPos;

        return b.win_rate - a.win_rate;
      });
    }

    // Filtrar inactivos si corresponde
    if (!includeInactive) {
      console.log(`🔍 Filtrando jugadores inactivos. Total antes del filtro: ${playersWithRanking.length}`);
      const playerNumbers = playersWithRanking.map(p => p.player_id);
      const activityRows = await batchCheckPlayersActivity(playerNumbers);
      const activityByPlayer = new Map(activityRows.map(r => [r.player_number, r]));
      const activePlayers = playersWithRanking.filter(p => {
        const flags = activityByPlayer.get(p.player_id);
        if (!flags) return false;
        return type === 'TEMPORADA' ? flags.active_seasonal : flags.active_general;
      });
      console.log(`✅ Jugadores activos encontrados: ${activePlayers.length}`);
      return activePlayers.map((p, i) => ({ ...p, position: i + 1 }));
    }

    return playersWithRanking;
  } catch (error) {
    console.error('❌ Error en consulta optimizada:', error);
    throw new Error(`Failed to get optimized ranking: ${error}`);
  }
}

// ----------------------------------------------
// Ranking por temporada
// ----------------------------------------------
export async function getSeasonRanking(seasonId: number): Promise<PlayerWithRanking[]> {
  return getPlayersWithRanking(seasonId, 'TEMPORADA');
}

// ----------------------------------------------
// Jugador individual
// ----------------------------------------------
export async function getPlayerById(playerId: number, sanma: boolean = false): Promise<PlayerWithRanking | null> {
  try {
    // Cargamos dan configs locales (evitar dependencia de cache)
    const danConfigs = await fetchDanConfigs();

    const ranking = await prisma.playerRanking.findFirst({
      where: { playerId, isSanma: sanma },
      include: { player: { include: { country: true } } },
    });

    if (!ranking) return null;

    const totalWins = ranking.firstPlaceH + ranking.firstPlaceT;
    const winRate = ranking.totalGames > 0 ? (totalWins / ranking.totalGames) * 100 : 0;
    const danRankJapon = getDanRankFromConfigs(ranking.danPoints, sanma, danConfigs);

    const currentRankConfig = danConfigs.find(
      (c) =>
        c.sanma === sanma &&
        ranking.danPoints >= c.minPoints &&
        (c.maxPoints === null || ranking.danPoints <= c.maxPoints),
    );
    const rankColor = currentRankConfig?.color ?? '#3b82f6';

    const nextRankConfig =
      currentRankConfig && currentRankConfig.maxPoints !== null
        ? danConfigs.find(
          (c) =>
            c.sanma === sanma &&
            (currentRankConfig.maxPoints! + 1) >= c.minPoints &&
            (c.maxPoints === null || currentRankConfig.maxPoints! + 1 <= c.maxPoints),
        )
        : null;

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

      position: 0,
      total_games: ranking.totalGames,
      average_position: Math.round(ranking.averagePosition * 100) / 100,
      dan_points: Math.round(ranking.danPoints),
      rate_points: Math.round(ranking.ratePoints),
      max_rate: Math.round(ranking.maxRate),
      win_rate: Math.round(winRate * 100) / 100,
      rank: danRankJapon,
      rank_color: rankColor,

      rank_min_points: currentRankConfig?.minPoints,
      rank_max_points: currentRankConfig?.maxPoints ?? null,
      next_rank: nextRankConfig?.rank,

      first_place_h: ranking.firstPlaceH,
      second_place_h: ranking.secondPlaceH,
      third_place_h: ranking.thirdPlaceH,
      fourth_place_h: ranking.fourthPlaceH,
      first_place_t: ranking.firstPlaceT,
      second_place_t: ranking.secondPlaceT,
      third_place_t: ranking.thirdPlaceT,
      fourth_place_t: ranking.fourthPlaceT,
    };
  } catch (error) {
    console.error(`❌ Error obteniendo jugador ${playerId}:`, error);
    return null;
  }
}
