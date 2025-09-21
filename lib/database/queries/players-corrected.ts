import { prisma } from '../client';
import { PlayerWithRanking } from './types';

// Helper para determinar el rango Dan basado en puntos Dan - CORREGIDO
function getDanRank(danPoints: number): string {
  // Sistema Dan más realista para Mahjong
  if (danPoints >= 300) return '6 Dan';
  if (danPoints >= 200) return '5 Dan';
  if (danPoints >= 120) return '4 Dan';
  if (danPoints >= 60) return '3 Dan';
  if (danPoints >= 30) return '2 Dan';
  if (danPoints >= 10) return '1 Dan';
  return 'Kyu';
}

// Get all players with their REAL ranking information from historical games
export async function getPlayersWithRanking(seasonId?: number): Promise<PlayerWithRanking[]> {
  try {
    console.log('🔍 getPlayersWithRanking called - using REAL stats from 1962 historical games!');

    // Obtener jugadores con sus estadísticas reales
    const playersWithStats = await prisma.player.findMany({
      include: {
        country: true,
        gameResults: {
          include: {
            game: true
          },
          where: seasonId ? {
            game: {
              seasonId: seasonId
            }
          } : undefined
        }
      },
      orderBy: {
        playerNumber: 'asc' // Ordenar por legajo
      }
    });

    console.log('✅ Found players with game data:', playersWithStats.length);

    // Calcular estadísticas reales para cada jugador
    const playersWithRanking: PlayerWithRanking[] = playersWithStats.map(player => {
      const gameResults = player.gameResults;
      const totalGames = gameResults.length;

      // Contadores por posición y tipo de juego
      let firstPlaceH = 0, secondPlaceH = 0, thirdPlaceH = 0, fourthPlaceH = 0;
      let firstPlaceT = 0, secondPlaceT = 0, thirdPlaceT = 0, fourthPlaceT = 0;
      let totalScore = 0;
      let positionSum = 0;

      gameResults.forEach(result => {
        positionSum += result.finalPosition;
        totalScore += Number(result.finalScore);

        const isHanchan = result.game.gameType === 'HANCHAN';

        switch (result.finalPosition) {
          case 1:
            if (isHanchan) firstPlaceH++; else firstPlaceT++;
            break;
          case 2:
            if (isHanchan) secondPlaceH++; else secondPlaceT++;
            break;
          case 3:
            if (isHanchan) thirdPlaceH++; else thirdPlaceT++;
            break;
          case 4:
            if (isHanchan) fourthPlaceH++; else fourthPlaceT++;
            break;
        }
      });

      // Calcular estadísticas CORREGIDAS
      const averagePosition = totalGames > 0 ? positionSum / totalGames : 4.0;
      const totalFirst = firstPlaceH + firstPlaceT;

      // Win rate CORREGIDO - debug para verificar
      const winRate = totalGames > 0 ? (totalFirst / totalGames) * 100 : 0;

      // DEBUG: Para jugadores con muchos juegos, mostrar cálculo
      if (totalGames > 100) {
        console.log(`🔍 DEBUG ${player.nickname}: ${totalFirst} wins de ${totalGames} juegos = ${winRate.toFixed(2)}%`);
      }

      const totalSecond = secondPlaceH + secondPlaceT;
      const totalThird = thirdPlaceH + thirdPlaceT;
      const totalFourth = fourthPlaceH + fourthPlaceT;

      // Sistema de puntos Dan: 1º=+3, 2º=+1, 3º=-1, 4º=-3
      const danPoints = (totalFirst * 3) + (totalSecond * 1) + (totalThird * -1) + (totalFourth * -3);

      // Rate points corregido (ELO-like system)
      const baseRate = 1500;
      const positionBonus = (2.5 - averagePosition) * 50; // Reducido el factor
      const gameBonus = Math.min(totalGames, 100) * 1; // Reducido el bonus
      const danBonus = danPoints * 0.5; // Bonus basado en puntos Dan
      const ratePoints = Math.max(1000, Math.round(baseRate + positionBonus + gameBonus + danBonus));

      return {
        id: player.id,
        nickname: player.nickname,
        fullname: player.fullname,
        country_id: player.countryId,           // Mapeo correcto
        player_id: player.playerNumber,            // Mapeo correcto
        birthday: player.birthday,
        country_iso: player.country?.isoCode || '',
        country_name: player.country?.fullName || '',
        createdAt: player.createdAt,          // Mapeo correcto
        updatedAt: player.updatedAt,          // Mapeo correcto
        position: 0, // Se asignará después del ordenamiento
        total_games: totalGames,
        average_position: Math.round(averagePosition * 100) / 100,
        dan_points: danPoints,
        rate_points: ratePoints,
        max_rate: ratePoints,
        win_rate: Math.round(winRate * 100) / 100, // Win rate corregido
        rank: getDanRank(danPoints),
        first_place_h: firstPlaceH,
        second_place_h: secondPlaceH,
        third_place_h: thirdPlaceH,
        fourth_place_h: fourthPlaceH,
        first_place_t: firstPlaceT,
        second_place_t: secondPlaceT,
        third_place_t: thirdPlaceT,
        fourth_place_t: fourthPlaceT,
      };
    });

    // Ordenamiento CORREGIDO: Dan → Rate → Puntos Dan acumulados → Promedio posición
    const sortedPlayers = playersWithRanking
      .sort((a, b) => {
        // 1. Por rango Dan (descendente)
        const aDanRankValue = getDanRankValue(a.rank);
        const bDanRankValue = getDanRankValue(b.rank);
        if (bDanRankValue !== aDanRankValue) {
          return bDanRankValue - aDanRankValue;
        }

        // 2. Por rate points (descendente)
        if (b.rate_points !== a.rate_points) {
          return b.rate_points - a.rate_points;
        }

        // 3. Por puntos Dan acumulados (descendente)
        if (b.dan_points !== a.dan_points) {
          return b.dan_points - a.dan_points;
        }

        // 4. Por promedio de posición (ascendente - mejor promedio)
        return a.average_position - b.average_position;
      })
      .map((player, index) => ({
        ...player,
        position: index + 1
      }));

    console.log('✅ Calculated CORRECTED rankings for players:', sortedPlayers.length);

    if (sortedPlayers.length > 0) {
      console.log('🏆 CORRECTED Top player:', {
        nickname: sortedPlayers[0].nickname,
        legajo: sortedPlayers[0].player_id,
        games: sortedPlayers[0].total_games,
        danPoints: sortedPlayers[0].dan_points,
        avgPosition: sortedPlayers[0].average_position,
        winRate: sortedPlayers[0].win_rate,
        ratePoints: sortedPlayers[0].rate_points,
        rank: sortedPlayers[0].rank
      });
    }

    return sortedPlayers;

  } catch (error) {
    console.error('❌ Error in getPlayersWithRanking:', error);
    throw new Error(`Failed to fetch players with ranking: ${error}`);
  }
}

// Helper para convertir rango Dan a valor numérico para ordenamiento
function getDanRankValue(rank: string): number {
  switch (rank) {
    case '6 Dan': return 6;
    case '5 Dan': return 5;
    case '4 Dan': return 4;
    case '3 Dan': return 3;
    case '2 Dan': return 2;
    case '1 Dan': return 1;
    case 'Kyu': return 0;
    default: return 0;
  }
}

// Get a single player by legajo - USE PlayerRanking (data warehouse) like the main ranking  
export async function getPlayerByLegajo(legajo: number): Promise<PlayerWithRanking | null> {
  try {
    // First find the player by legajo to get internal ID
    const player = await prisma.player.findUnique({
      where: { playerNumber: legajo },
      include: { country: true }
    });

    if (!player) return null;

    // Then find PlayerRanking using internal ID (4 jugadores por defecto)
    const ranking = await (prisma as any).playerRanking.findFirst({
      where: {
        playerId: player.id,  // Use internal ID, not legajo
        isSanma: false // 4 jugadores por defecto
      }
    });

    if (!ranking) return null;

    const totalWins = ranking.firstPlaceH + ranking.firstPlaceT;
    const winRate = ranking.totalGames > 0 ? ((totalWins / ranking.totalGames) * 100) : 0;

    return {
      id: player.id,
      nickname: player.nickname,
      fullname: player.fullname,
      country_id: player.countryId,
      player_id: player.playerNumber,
      birthday: player.birthday,
      country_iso: player.country?.isoCode || '',
      country_name: player.country?.fullName || '',
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
      position: 0, // Se calculará en el ranking general
      total_games: ranking.totalGames,
      average_position: Math.round(ranking.averagePosition * 100) / 100,
      dan_points: Math.round(ranking.danPoints),
      rate_points: Math.round(ranking.ratePoints),
      max_rate: Math.round(ranking.maxRate),
      win_rate: Math.round(winRate * 100) / 100,
      rank: getDanRank(ranking.danPoints),
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
    console.error('❌ Error in getPlayerByLegajo:', error);
    throw new Error(`Failed to fetch player by legajo: ${error}`);
  }
}

// Create a new player
export async function createPlayer(playerData: {
  nickname: string;
  fullname?: string;
  countryId: number;
  playerId: number;
  birthday?: Date;
}): Promise<PlayerWithRanking> {
  try {
    const newPlayer = await prisma.player.create({
      data: {
        nickname: playerData.nickname,
        fullname: playerData.fullname || playerData.nickname,
        countryId: playerData.countryId,    // Corregido
        playerNumber: playerData.playerId,      // Corregido
        birthday: playerData.birthday,
      },
      include: {
        country: true,
      },
    });

    return {
      id: newPlayer.id,
      nickname: newPlayer.nickname,
      fullname: newPlayer.fullname,
      country_id: newPlayer.countryId,
      player_id: newPlayer.playerNumber,
      birthday: newPlayer.birthday,
      country_iso: newPlayer.country?.isoCode || '',
      country_name: newPlayer.country?.fullName || '',
      createdAt: newPlayer.createdAt,
      updatedAt: newPlayer.updatedAt,
      position: 0,
      total_games: 0,
      average_position: 0,
      dan_points: 0,
      rate_points: 1500,
      max_rate: 1500,
      win_rate: 0,
      rank: getDanRank(0),
      first_place_h: 0,
      second_place_h: 0,
      third_place_h: 0,
      fourth_place_h: 0,
      first_place_t: 0,
      second_place_t: 0,
      third_place_t: 0,
      fourth_place_t: 0,
    };
  } catch (error) {
    console.error('❌ Error in createPlayer:', error);
    throw new Error(`Failed to create player: ${error}`);
  }
}

// Get all players (simple list)
export async function getAllPlayers(): Promise<PlayerWithRanking[]> {
  try {
    const players = await prisma.player.findMany({
      include: {
        country: true,
      },
      orderBy: {
        playerNumber: 'asc',
      },
    });

    return players.map(player => ({
      id: player.id,
      nickname: player.nickname,
      fullname: player.fullname,
      country_id: player.countryId,
      player_id: player.playerNumber,
      birthday: player.birthday,
      country_iso: player.country?.isoCode || '',
      country_name: player.country?.fullName || '',
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
      position: 0,
      total_games: 0,
      average_position: 0,
      dan_points: 0,
      rate_points: 1500,
      max_rate: 1500,
      win_rate: 0,
      rank: getDanRank(0),
      first_place_h: 0,
      second_place_h: 0,
      third_place_h: 0,
      fourth_place_h: 0,
      first_place_t: 0,
      second_place_t: 0,
      third_place_t: 0,
      fourth_place_t: 0,
    }));
  } catch (error) {
    console.error('❌ Error in getAllPlayers:', error);
    throw new Error(`Failed to fetch all players: ${error}`);
  }
}

// Search players by nickname
export async function searchPlayers(searchTerm: string): Promise<PlayerWithRanking[]> {
  try {
    const players = await prisma.player.findMany({
      where: {
        nickname: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      include: {
        country: true,
      },
      orderBy: [
        { nickname: 'asc' },
        { playerNumber: 'asc' }
      ],
    });

    return players.map(player => ({
      id: player.id,
      nickname: player.nickname,
      fullname: player.fullname,
      country_id: player.countryId,
      player_id: player.playerNumber,
      birthday: player.birthday,
      country_iso: player.country?.isoCode || '',
      country_name: player.country?.fullName || '',
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
      position: 0,
      total_games: 0,
      average_position: 0,
      dan_points: 0,
      rate_points: 1500,
      max_rate: 1500,
      win_rate: 0,
      rank: getDanRank(0),
      first_place_h: 0,
      second_place_h: 0,
      third_place_h: 0,
      fourth_place_h: 0,
      first_place_t: 0,
      second_place_t: 0,
      third_place_t: 0,
      fourth_place_t: 0,
    }));
  } catch (error) {
    console.error('❌ Error in searchPlayers:', error);
    throw new Error(`Failed to search players: ${error}`);
  }
}
