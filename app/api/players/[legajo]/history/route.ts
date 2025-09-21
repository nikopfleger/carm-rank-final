import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

interface HistoryPoint {
  gameId?: number;
  tournamentId?: number;
  gameDate: string;
  pointsType: 'DAN' | 'RATE' | 'SEASON';
  pointsValue: number;
  position?: number;
  gameType?: 'HANCHAN' | 'TONPUUSEN';
  finalScore?: number;
  tournamentName?: string;
}

// ...imports y tipos iguales

export async function GET(request: NextRequest, { params }: { params: Promise<{ legajo: string }> }) {
      const { legajo } = await params;
    try {
    const legajoNum = parseInt(legajo);
    if (isNaN(legajoNum)) return NextResponse.json({ error: 'Legajo inválido' }, { status: 400 });

    const player = await prisma.player.findUnique({
      where: { playerNumber: legajoNum },
      select: { id: true, nickname: true }
    });
    if (!player) return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });

    // Trae TODO lo necesario en un solo findMany (como ya tenías)
    const historicalData = await prisma.points.findMany({
      where: {
        playerId: player.id,
        OR: [
          { gameId: { not: null } },                     // puntos asociados a juego
          { tournamentId: { not: null }, pointsType: 'SEASON' } // season por torneo (gameId puede ser null)
        ]
      },
      include: {
        game: {
          include: {
            gameResults: {
              where: { playerId: player.id },
              select: { finalPosition: true, finalScore: true }
            }
          }
        },
        tournament: { select: { id: true, name: true, startDate: true, endDate: true } }
      },
      orderBy: [{ id: 'asc' }] // orden estable y cronológico para acumulados
    });

    // === A) Juegos DAN/RATE (igual que tu lógica) ===
    const gamesMap = new Map<number, {
      gameId: number;
      gameDate: string;
      gameType?: 'HANCHAN' | 'TONPUUSEN';
      position?: number;
      finalScore?: number;
      danPoints?: number;
      ratePoints?: number;
    }>();

    // === B) Eventos SEASON (juego o torneo) ===
    type SeasonEvent = {
      source: 'GAME' | 'TOURNAMENT';
      id: number;                 // gameId o tournamentId (según source)
      poId: number;               // id del registro de points (para desempate estable)
      date: string;               // ISO yyyy-mm-dd
      label: string;              // “Juego 1841” o nombre de torneo
      points: number;             // points_value
    };
    const seasonEvents: SeasonEvent[] = [];

    for (const p of historicalData) {
      const pointsValue = Number(p.pointsValue);

      // ----- juegos (DAN / RATE / SEASON por juego) -----
      if (p.gameId && p.game) {
        // Armo grupo por juego para DAN/RATE
        const g = gamesMap.get(p.gameId) ?? {
          gameId: p.gameId,
          gameDate: p.game.gameDate.toISOString().slice(0, 10),
          gameType: p.game.gameType as 'HANCHAN' | 'TONPUUSEN',
          position: p.game.gameResults[0]?.finalPosition,
          finalScore: Number(p.game.gameResults[0]?.finalScore) || 0
        };
        if (p.pointsType === 'DAN') g.danPoints = pointsValue;
        if (p.pointsType === 'RATE') g.ratePoints = pointsValue;
        gamesMap.set(p.gameId, g);

        // Si además este registro es SEASON por juego, lo agrego a la serie
        if (p.pointsType === 'SEASON') {
          seasonEvents.push({
            source: 'GAME',
            id: p.gameId,
            poId: p.id, // para orden estable
            date: p.game.gameDate.toISOString().slice(0, 10),
            label: `Juego ${p.gameId}`,
            points: pointsValue
          });
        }
      }

      // ----- torneos (SEASON por torneo) -----
      if (!p.gameId && p.tournamentId && p.pointsType === 'SEASON' && p.tournament) {
        // Usá startDate (o endDate si preferís) para ubicar el punto en la línea de tiempo
        const d = (p.tournament.startDate ?? p.createdAt).toISOString().slice(0, 10);
        seasonEvents.push({
          source: 'TOURNAMENT',
          // id lógico para tooltip
          id: p.tournamentId,
          poId: p.id,
          date: d,
          label: p.tournament.name,
          points: pointsValue
        });
      }
    }

    const games = [...gamesMap.values()]
      .filter(g => g.danPoints !== undefined && g.ratePoints !== undefined)
      .sort((a, b) => a.gameDate.localeCompare(b.gameDate));

    // Orden cronológico para el gráfico de SEASON (fecha y, ante empates, poId)
    seasonEvents.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return cmp !== 0 ? cmp : a.poId - b.poId;
    });

    // Acumulado (si tu gráfico lo necesita)
    let running = 0;
    const cumulativeSeason = seasonEvents.map(ev => {
      running += ev.points;
      return { ...ev, cumulative: running };
    });

    // Stats
    const stats = {
      totalGames: games.length,
      totalTournaments: seasonEvents.filter(e => e.source === 'TOURNAMENT').length,
      firstPlaces: games.filter(g => g.position === 1).length,
      avgPosition: games.length ? (games.reduce((s, g) => s + (g.position || 0), 0) / games.length) : 0,
      currentDan: games.at(-1)?.danPoints ?? 0,
      currentRate: games.at(-1)?.ratePoints ?? 1500,
      currentSeason: cumulativeSeason.at(-1)?.cumulative ?? 0,
      dateRange: (games.length || seasonEvents.length)
        ? {
          from: (games[0]?.gameDate ?? seasonEvents[0]?.date),
          to: (games.at(-1)?.gameDate ?? seasonEvents.at(-1)?.date)
        }
        : null
    };

    return NextResponse.json({
      success: true,
      data: {
        games,                // para tus charts de DAN y RATE por juego
        seasonEvents,         // puntos sueltos (juego o torneo)
        cumulativeSeason,     // mismos eventos pero con acumulado
        stats
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
