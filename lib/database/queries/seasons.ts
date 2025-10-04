import { prisma } from '../client';

export interface Season {
  id: bigint;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  extraData?: any;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface SeasonWithStats extends Season {
  gamesCount: number;
  playersCount: number;
  tournamentsCount: number;
  rulesetsCount: number; rulesetNames: string[];
}

// Get all seasons with statistics
export async function getAllSeasons(): Promise<SeasonWithStats[]> {
  try {
    const seasons = await prisma.season.findMany({
      orderBy: [
        { isActive: 'desc' },
        { startDate: 'desc' }
      ]
    });

    // Get counts for each season
    const seasonsWithStats = await Promise.all(
      seasons.map(async (season) => {
        const gamesCount = await prisma.game.count({
          where: {
            seasonId: season.id
          }
        });

        const playersCount = await prisma.gameResult.findMany({
          where: {
            game: {
              seasonId: season.id
            }
          },
          select: {
            playerId: true
          },
          distinct: ['playerId']
        }).then(result => result.length);

        const tournamentsCount = await prisma.tournament.count({
          where: { seasonId: season.id }
        });

        // Get distinct ruleset names for this season
        const rulesetData = await prisma.game.findMany({
          where: {
            seasonId: season.id
          },
          select: {
            ruleset: {
              select: {
                name: true
              }
            }
          },
          distinct: ['rulesetId']
        });

        const rulesetNames = rulesetData.map(r => r.ruleset.name);
        const rulesetsCount = rulesetNames.length;

        return {
          id: season.id,
          name: season.name,
          startDate: season.startDate,
          endDate: season.endDate,
          isActive: season.isActive,
          extraData: season.extraData,
          createdAt: season.createdAt,
          updatedAt: season.updatedAt,
          gamesCount,
          playersCount,
          tournamentsCount,
          rulesetsCount,
          rulesetNames
        };
      })
    );

    return seasonsWithStats;
  } catch (error) {
    console.error('Error getting seasons:', error);
    throw new Error('Failed to fetch seasons');
  }
}

// Get active season
export async function getActiveSeason(): Promise<SeasonWithStats | null> {
  try {
    const season = await prisma.season.findFirst({
      where: { isActive: true }
    });

    if (!season) {
      return null;
    }

    const gamesCount = await prisma.game.count({
      where: {
        seasonId: season.id
      }
    });

    const playersCount = await prisma.gameResult.findMany({
      where: {
        game: {
          seasonId: season.id
        }
      },
      select: {
        playerId: true
      },
      distinct: ['playerId']
    }).then(result => result.length);

    const tournamentsCount = await prisma.tournament.count({
      where: { seasonId: season.id }
    });

    // Get distinct ruleset names for this season
    const rulesetData = await prisma.game.findMany({
      where: {
        seasonId: season.id
      },
      select: {
        ruleset: {
          select: {
            name: true
          }
        }
      },
      distinct: ['rulesetId']
    });

    const rulesetNames = rulesetData.map(r => r.ruleset.name);
    const rulesetsCount = rulesetNames.length;

    return {
      id: season.id,
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
      isActive: season.isActive,
      extraData: season.extraData,
      createdAt: season.createdAt,
      updatedAt: season.updatedAt,
      gamesCount,
      playersCount,
      tournamentsCount,
      rulesetsCount,
      rulesetNames
    };
  } catch (error) {
    console.error('Error getting active season:', error);
    throw new Error('Failed to fetch active season');
  }
}

// Get season by ID
export async function getSeasonById(id: number): Promise<SeasonWithStats | null> {
  try {
    const season = await prisma.season.findUnique({
      where: { id }
    });

    if (!season) {
      return null;
    }

    const gamesCount = await prisma.game.count({
      where: {
        seasonId: season.id
      }
    });

    const playersCount = await prisma.gameResult.findMany({
      where: {
        game: {
          seasonId: season.id
        }
      },
      select: {
        playerId: true
      },
      distinct: ['playerId']
    }).then(result => result.length);

    const tournamentsCount = await prisma.tournament.count({
      where: { seasonId: season.id }
    });

    // Get distinct ruleset names for this season
    const rulesetData = await prisma.game.findMany({
      where: {
        seasonId: season.id
      },
      select: {
        ruleset: {
          select: {
            name: true
          }
        }
      },
      distinct: ['rulesetId']
    });

    const rulesetNames = rulesetData.map(r => r.ruleset.name);
    const rulesetsCount = rulesetNames.length;

    return {
      id: season.id,
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
      isActive: season.isActive,
      extraData: season.extraData,
      createdAt: season.createdAt,
      updatedAt: season.updatedAt,
      gamesCount,
      playersCount,
      tournamentsCount,
      rulesetsCount,
      rulesetNames
    };
  } catch (error) {
    console.error('Error getting season by ID:', error);
    throw new Error('Failed to fetch season');
  }
}

// Create new season
export async function createSeason(data: {
  name: string;
  startDate: Date;
  endDate: Date;
}): Promise<Season> {
  try {
    const season = await prisma.season.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: false // New seasons are not active by default
      }
    });

    return {
      id: season.id,
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
      isActive: season.isActive,
      extraData: season.extraData,
      createdAt: season.createdAt,
      updatedAt: season.updatedAt
    };
  } catch (error) {
    console.error('Error creating season:', error);
    throw new Error('Failed to create season');
  }
}

// Update season
export async function updateSeason(id: number, data: {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}): Promise<Season> {
  try {
    const season = await prisma.season.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate && { endDate: data.endDate }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    });

    return {
      id: season.id,
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
      isActive: season.isActive,
      extraData: season.extraData,
      createdAt: season.createdAt,
      updatedAt: season.updatedAt
    };
  } catch (error) {
    console.error('Error updating season:', error);
    throw new Error('Failed to update season');
  }
}

// Delete season
export async function deleteSeason(id: number): Promise<void> {
  try {
    await prisma.season.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting season:', error);
    throw new Error('Failed to delete season');
  }
}

// Set season as active (deactivates all others)
export async function setSeasonAsActive(id: number): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      // Find currently active season
      const currentActive = await tx.season.findFirst({ where: { isActive: true } });

      // Deactivate all seasons
      await tx.season.updateMany({ data: { isActive: false } });

      // If there was an active season, set its endDate to now if missing
      if (currentActive) {
        await tx.season.update({
          where: { id: currentActive.id },
          data: { endDate: currentActive.endDate ?? new Date() }
        });
      }

      // Activate the specified season
      await tx.season.update({
        where: { id },
        data: { isActive: true }
      });

      // Reset season points for all players for the new season in PlayerRanking
      await tx.playerRanking.updateMany({
        where: {},
        data: { seasonPoints: 0 }
      });
    });
  } catch (error) {
    console.error('Error setting season as active:', error);
    throw new Error('Failed to set season as active');
  }
}

// Activate a season and end the previous active one
export async function activateSeason(id: number) {
  await setSeasonAsActive(id);
  const season = await prisma.season.findUnique({ where: { id } });
  return season;
}

// Archivar una temporada
export async function archiveSeason(id: number): Promise<Season | null> {
  try {
    const season = await prisma.season.update({
      where: { id },
      data: {
        isActive: false,
        // Agregar campo archived si existe en el schema
      }
    });
    return season;
  } catch (error) {
    console.error('Error archiving season:', error);
    return null;
  }
}

// Obtener estadísticas de una temporada
export async function getSeasonStatistics(id: number) {
  try {
    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        games: {
          select: {
            id: true,
            gameDate: true,
            gameType: true
          }
        },
        tournaments: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!season) return null;

    // Calcular estadísticas
    const gamesCount = season.games.length;
    const tournamentsCount = season.tournaments.length;

    // Obtener jugadores únicos de la temporada
    const playerRankings = await prisma.playerRanking.findMany({
      where: {
        // Filtrar por temporada si hay relación
      },
      select: {
        playerId: true
      }
    });

    const uniquePlayersCount = new Set(playerRankings.map(r => r.playerId)).size;

    return {
      ...season,
      gamesCount,
      tournamentsCount,
      playersCount: uniquePlayersCount
    };
  } catch (error) {
    console.error('Error getting season statistics:', error);
    return null;
  }
}