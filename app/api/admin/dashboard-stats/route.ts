import { prisma } from '@/lib/database/client';
import { runWithRequestContextAsync } from '@/lib/request-context.server';
import { NextRequest, NextResponse } from 'next/server';

;

export async function GET(request: NextRequest) {
  try {
    const dashboardData = await runWithRequestContextAsync({ includeDeleted: false }, async () => {
      // 1. Obtener juegos pendientes
      const pendingGamesCount = await prisma.pendingGame.count({
        where: { status: 'PENDING' }
      });

      // 2. Obtener temporada activa
      const activeSeason = await prisma.season.findFirst({
        where: { isActive: true }
      });

      // 3. Obtener total de jugadores activos
      // Usar la misma lógica que el endpoint /api/players/[legajo]/is-active
      let totalPlayers = 0;

      if (activeSeason) {
        // Contar jugadores que tienen juegos en la temporada activa
        const activeSeasonPlayers = await prisma.gameResult.groupBy({
          by: ['playerId'],
          where: {
            game: {
              tournament: {
                seasonId: activeSeason.id
              }
            }
          }
        });
        totalPlayers = activeSeasonPlayers.length;
      }

      // Si no hay temporada activa o hay pocos jugadores, usar criterio del último año
      if (totalPlayers === 0) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const lastYearPlayers = await prisma.gameResult.groupBy({
          by: ['playerId'],
          where: {
            game: {
              gameDate: { gte: oneYearAgo }
            }
          }
        });
        totalPlayers = lastYearPlayers.length;
      }

      // 4. Obtener juegos del mes actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const gamesThisMonth = await prisma.game.count({
        where: {
          gameDate: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      // 5. Obtener juegos del mes anterior para comparación
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const gamesLastMonth = await prisma.game.count({
        where: {
          gameDate: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      });

      // 6. Calcular porcentaje de cambio
      const percentageChange = gamesLastMonth > 0
        ? Math.round(((gamesThisMonth - gamesLastMonth) / gamesLastMonth) * 100)
        : 0;

      // 7. Obtener actividad reciente (últimos 10 juegos pendientes y aprobados)
      const recentPendingGames = await prisma.pendingGame.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { player1: true }
      });

      const recentApprovedGames = await prisma.game.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { gameResults: { include: { player: true } } }
      });

      // 8. Obtener top 3 jugadores activos por puntos Dan (misma lógica que la página principal)
      // Obtener la fecha límite para jugadores activos (1 año atrás)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // Obtener todos los rankings generales (4 jugadores)
      const allRankings = await prisma.playerRanking.findMany({
        where: {
          isSanma: false // Solo juegos de 4 jugadores para ranking general
        },
        orderBy: { danPoints: 'desc' },
        include: { player: true }
      });

      // Filtrar jugadores activos usando la misma lógica que la página principal
      const playerIds = allRankings.map(r => r.player.id);

      // Buscar jugadores que jugaron en temporada actual por rango de fechas
      const currentSeasonPlayers = activeSeason && activeSeason.startDate
        ? await prisma.gameResult.groupBy({
          by: ['playerId'],
          where: {
            playerId: { in: playerIds },
            game: {
              gameDate: {
                gte: activeSeason.startDate,
                lte: activeSeason.endDate || new Date()
              }
            }
          }
        })
        : [];

      // Buscar jugadores que jugaron en el último año
      const lastYearPlayers = await prisma.gameResult.groupBy({
        by: ['playerId'],
        where: {
          playerId: { in: playerIds },
          game: {
            gameDate: { gte: oneYearAgo }
          }
        }
      });

      // Combinar ambos conjuntos (temporada actual O último año)
      // Construir set de jugadores activos sin usar spread de Set (compatibilidad TS)
      const activePlayerIds = new Set<number>([
        ...currentSeasonPlayers.map(g => g.playerId),
        ...lastYearPlayers.map(g => g.playerId)
      ]);

      // Filtrar rankings por jugadores activos
      const activeRankings = allRankings.filter(ranking =>
        activePlayerIds.has(ranking.player.id)
      );

      // Tomar top 3
      const topPlayers = activeRankings.slice(0, 3);

      // 9. Construir actividad reciente
      const recentActivity = [];

      // Agregar juegos pendientes recientes
      for (const game of recentPendingGames) {
        const timeAgo = getTimeAgo(game.createdAt);
        recentActivity.push({
          id: game.id,
          type: 'game_submitted',
          description: `Juego #${game.id} enviado`,
          time: timeAgo,
          timestamp: game.createdAt
        });
      }

      // Agregar juegos aprobados recientes
      for (const game of recentApprovedGames) {
        const timeAgo = getTimeAgo(game.createdAt);
        recentActivity.push({
          id: game.id,
          type: 'game_approved',
          description: `Juego #${game.id} aprobado`,
          time: timeAgo,
          timestamp: game.createdAt
        });
      }

      // Ordenar por timestamp y tomar los más recientes
      recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      const finalRecentActivity = recentActivity.slice(0, 4);

      // 10. Construir top players
      const formattedTopPlayers = topPlayers.map((ranking, index) => ({
        nickname: ranking.player.nickname,
        playerNumber: ranking.player.playerNumber, // Agregar el legajo
        position: index + 1,
        points: Math.floor(ranking.danPoints),
        trend: 'up' // Por defecto, se puede mejorar calculando tendencia real
      }));

      return {
        pendingGames: pendingGamesCount,
        activeSeason: activeSeason ? activeSeason.name : 'No hay temporada activa',
        totalPlayers,
        gamesThisMonth,
        percentageChange,
        recentActivity: finalRecentActivity,
        topPlayers: formattedTopPlayers
      };
    });

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función auxiliar para calcular tiempo transcurrido
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'ahora';
  if (diffInMinutes < 60) return `${diffInMinutes} min`;
  if (diffInHours < 24) return `${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  if (diffInDays < 7) return `${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  return `${Math.floor(diffInDays / 7)} semana${Math.floor(diffInDays / 7) > 1 ? 's' : ''}`;
}
