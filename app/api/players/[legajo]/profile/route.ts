import { auth } from "@/lib/auth-vercel";
import { ensureCacheReady, getDan } from "@/lib/cache/core-cache";
import { prisma } from "@/lib/database/client";
import { getDanRank } from "@/lib/game-helpers";
import { NextRequest, NextResponse } from "next/server";

;

// Función para calcular si un jugador está activo
async function calculatePlayerActivity(playerId: number): Promise<boolean> {
    // Obtener la temporada activa actual
    const activeSeason = await prisma.season.findFirst({
        where: { isActive: true },
        select: { id: true }
    });

    if (activeSeason) {
        // Verificar si el jugador tiene juegos en la temporada activa
        const gamesInActiveSeason = await prisma.gameResult.count({
            where: {
                playerId: playerId,
                game: {
                    tournament: {
                        seasonId: activeSeason.id
                    }
                }
            }
        });

        if (gamesInActiveSeason > 0) {
            return true;
        }
    }

    // Si no está activo en la temporada actual, verificar último año
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const gamesInLastYear = await prisma.gameResult.count({
        where: {
            playerId: playerId,
            game: {
                gameDate: {
                    gte: oneYearAgo
                }
            }
        }
    });

    return gamesInLastYear > 0;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ legajo: string }> }
) {
    try {
        const { legajo: legajoParam } = await params;
        const legajo = parseInt(legajoParam);
        if (isNaN(legajo)) {
            return NextResponse.json({ error: "Legajo inválido" }, { status: 400 });
        }

        // Obtener datos básicos del jugador
        const player = await prisma.player.findUnique({
            where: { playerNumber: legajo },
            include: {
                country: {
                    select: { fullName: true, isoCode: true }
                },
                onlineUsers: {
                    where: { deleted: false },
                    select: { platform: true, username: true, idOnline: true }
                }
            }
        });

        if (!player) {
            return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
        }

        // Verificar si el jugador está vinculado a un usuario
        const userPlayerLink = await prisma.userPlayerLink.findUnique({
            where: { playerId: player.id },
            select: { userId: true }
        });

        // Verificar si hay una solicitud pendiente para este jugador
        const pendingRequest = await prisma.userPlayerLinkRequest.findFirst({
            where: {
                playerId: player.id,
                status: 'PENDING'
            },
            select: { id: true, userId: true }
        });

        // Calcular si el jugador está activo
        const isPlayerActive = await calculatePlayerActivity(player.id);

        // ✅ Verificar si el usuario actual tiene alguna vinculación (para prevenir múltiples solicitudes)
        const session = await auth();
        let userHasAnyLink = false;
        let userHasRejectedRequest = false;
        if (session?.user?.id) {
            const existingUserLink = await prisma.userPlayerLink.findFirst({
                where: {
                    userId: session.user.id,
                    deleted: false
                }
            });
            userHasAnyLink = !!existingUserLink;

            // ✅ Verificar si el usuario tiene solicitudes rechazadas (para prevenir spam)
            const rejectedRequest = await prisma.userPlayerLinkRequest.findFirst({
                where: {
                    userId: session.user.id,
                    status: 'REJECTED'
                }
            });
            userHasRejectedRequest = !!rejectedRequest;
        }

        // Obtener rankings por modo (4p y 3p)
        const rankingFour = await prisma.playerRanking.findFirst({
            where: {
                playerId: player.id,
                isSanma: false // 4 jugadores por defecto
            }
        });

        const rankingThree = await prisma.playerRanking.findFirst({
            where: {
                playerId: player.id,
                isSanma: true // 3 jugadores
            }
        });

        // Ranking actual por defecto: 4 jugadores si existe, si no 3 jugadores
        const currentRanking = rankingFour || rankingThree || null;

        // Debug: verificar si encontramos ranking
        console.log(`Player ${player.id} - currentRanking:`, currentRanking);

        // Debug: verificar todos los rankings disponibles para este jugador
        const allRankings = await prisma.playerRanking.findMany({
            where: { playerId: player.id },
            select: { isSanma: true, maxRate: true, seasonPoints: true }
        });
        console.log(`Player ${player.id} - allRankings:`, allRankings);

        // Obtener puntos actuales de dan y rate desde PlayerRanking (último dato)
        const danPointsYonma = rankingFour?.danPoints || 0;
        const danPointsSanma = rankingThree?.danPoints || 0;
        const danPoints = danPointsYonma; // mantener compatibilidad
        const ratePoints = currentRanking?.ratePoints || 0;

        // Obtener ratePoints específicos por modo
        const ratePointsYonma = rankingFour?.ratePoints || 0;
        const ratePointsSanma = rankingThree?.ratePoints || 0;

        // Obtener maxRate y seasonPoints específicos por modo
        const maxRateYonma = rankingFour?.maxRate || 0;
        const maxRateSanma = rankingThree?.maxRate || 0;
        const seasonPointsYonma = rankingFour?.seasonPoints || 0;
        const seasonPointsSanma = rankingThree?.seasonPoints || 0;

        // Obtener estadísticas de juegos separadas por tipo
        const gameStats = await prisma.gameResult.aggregate({
            where: { playerId: player.id },
            _count: { id: true },
            _avg: { finalPosition: true }
        });

        // Estadísticas por cantidad de jugadores (sanma)
        // Estadísticas por tipo de juego y cantidad de jugadores
        // 4 jugadores - Hanchan
        const fourPlayerHanchanStats = await prisma.gameResult.aggregate({
            where: {
                playerId: player.id,
                game: {
                    ruleset: { sanma: false },
                    gameType: 'HANCHAN'
                }
            },
            _count: { id: true },
            _avg: { finalPosition: true }
        });

        // 4 jugadores - Tonpuusen
        const fourPlayerTonpuusenStats = await prisma.gameResult.aggregate({
            where: {
                playerId: player.id,
                game: {
                    ruleset: { sanma: false },
                    gameType: 'TONPUUSEN'
                }
            },
            _count: { id: true },
            _avg: { finalPosition: true }
        });

        // 3 jugadores - Hanchan
        const threePlayerHanchanStats = await prisma.gameResult.aggregate({
            where: {
                playerId: player.id,
                game: {
                    ruleset: { sanma: true },
                    gameType: 'HANCHAN'
                }
            },
            _count: { id: true },
            _avg: { finalPosition: true }
        });

        // 3 jugadores - Tonpuusen
        const threePlayerTonpuusenStats = await prisma.gameResult.aggregate({
            where: {
                playerId: player.id,
                game: {
                    ruleset: { sanma: true },
                    gameType: 'TONPUUSEN'
                }
            },
            _count: { id: true },
            _avg: { finalPosition: true }
        });

        // Distribución de posiciones por tipo y cantidad
        const fourPlayerHanchanPositions = await prisma.gameResult.groupBy({
            by: ['finalPosition'],
            where: {
                playerId: player.id,
                game: {
                    ruleset: { sanma: false },
                    gameType: 'HANCHAN'
                }
            },
            _count: { id: true }
        });

        const fourPlayerTonpuusenPositions = await prisma.gameResult.groupBy({
            by: ['finalPosition'],
            where: {
                playerId: player.id,
                game: {
                    ruleset: { sanma: false },
                    gameType: 'TONPUUSEN'
                }
            },
            _count: { id: true }
        });

        const threePlayerHanchanPositions = await prisma.gameResult.groupBy({
            by: ['finalPosition'],
            where: {
                playerId: player.id,
                game: {
                    ruleset: { sanma: true },
                    gameType: 'HANCHAN'
                }
            },
            _count: { id: true }
        });

        const threePlayerTonpuusenPositions = await prisma.gameResult.groupBy({
            by: ['finalPosition'],
            where: {
                playerId: player.id,
                game: {
                    ruleset: { sanma: true },
                    gameType: 'TONPUUSEN'
                }
            },
            _count: { id: true }
        });

        // Obtener juegos recientes para el gráfico con información completa
        const recentGames = await prisma.gameResult.findMany({
            where: { playerId: player.id },
            include: {
                game: {
                    select: {
                        id: true,
                        gameDate: true,
                        gameType: true,
                        ruleset: {
                            select: {
                                sanma: true
                            }
                        },
                        gameResults: {
                            include: {
                                player: {
                                    select: {
                                        nickname: true
                                    }
                                }
                            },
                            orderBy: {
                                finalPosition: 'asc'
                            }
                        }
                    }
                }
            },
            orderBy: { game: { createdAt: "desc" } },
            take: 50
        });

        // Obtener temporada activa (para filtrar season points por temporada)
        const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });

        // Obtener puntos históricos para cada juego (valores acumulados para el gráfico)
        const gameIds = recentGames.map(gr => gr.game.id);
        const historicalPoints = await (prisma as any).points.findMany({
            where: {
                playerId: player.id,
                gameId: { in: gameIds },
                pointsType: { in: ["DAN", "RATE", "SEASON"] }
            },
            select: {
                gameId: true,
                tournamentId: true,
                pointsType: true,
                pointsValue: true,
                isSanma: true,
                seasonId: true,
                createdAt: true,
                extraData: true,
                game: {
                    select: {
                        gameDate: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // historicalPoints ya están en orden cronológico (más antiguos primero)

        // Crear un mapa gameId -> sanma del juego
        const gameIdToSanma: Record<number, boolean> = {};
        for (const gr of recentGames) {
            gameIdToSanma[gr.game.id] = gr.game.ruleset.sanma;
        }

        // Debug en desarrollo para verificar historicalPoints
        if (process.env.NODE_ENV === 'development') {
            console.log('Historical Points Debug:', {
                totalHistoricalPoints: historicalPoints.length,
                samplePoints: historicalPoints.slice(0, 5).map((p: any) => ({
                    gameId: p.gameId,
                    pointsType: p.pointsType,
                    pointsValue: p.pointsValue,
                    isSanma: p.isSanma,
                    seasonId: p.seasonId,
                    createdAt: p.createdAt,
                    gameDate: p.game.gameDate
                }))
            });
        }

        // Crear un mapa de puntos por juego, filtrando por isSanma correspondiente
        const pointsByGame = historicalPoints.reduce((acc: Record<number, Record<string, any>>, point: { gameId: number | null; pointsType: string; pointsValue: number; isSanma: boolean; seasonId: number | null; }) => {
            if (point.gameId && !acc[point.gameId]) {
                acc[point.gameId] = {};
            }
            if (point.gameId) {
                const expectedSanma = gameIdToSanma[point.gameId];
                const isSameSeason = point.pointsType !== 'SEASON' || (activeSeason ? point.seasonId === activeSeason.id : true);
                if (point.isSanma === expectedSanma && isSameSeason) {
                    acc[point.gameId][point.pointsType] = point.pointsValue;
                }
            }
            return acc;
        }, {} as Record<number, Record<string, any>>);

        // Debug en desarrollo para verificar pointsByGame
        if (process.env.NODE_ENV === 'development') {
            console.log('Points By Game Debug:', {
                totalGames: Object.keys(pointsByGame).length,
                sampleGames: Object.entries(pointsByGame).slice(0, 3).map(([gameId, points]) => ({
                    gameId: parseInt(gameId),
                    points
                }))
            });
        }

        // Formatear datos para el gráfico (invertir para orden cronológico)
        console.log('RecentGames orden:', recentGames.slice(0, 3).map(gr => ({ id: gr.game.id, date: gr.game.gameDate })));
        const reversedGames = [...recentGames].reverse();
        const chartData = reversedGames.map((gr, index) => {
            const gamePoints = pointsByGame[gr.game.id] || {};

            // Para el gráfico: valores acumulados (de Points)
            const danPoints = Number(gamePoints.DAN || 0);
            const ratePoints = Number(gamePoints.RATE || 0);
            const seasonPoints = Number(gamePoints.SEASON || 0);

            // Obtener createdAt del historicalPoints para este juego
            const seasonPoint = historicalPoints.find((p: any) => p.gameId === gr.game.id && p.pointsType === 'SEASON');
            const createdAt = seasonPoint ? seasonPoint.createdAt : null;
            const extraData = seasonPoint ? seasonPoint.extraData : null;
            const tournamentId = seasonPoint ? seasonPoint.tournamentId : null;

            // Para el tooltip: variaciones específicas del juego (de GameResult)
            const danVariation = Number(gr.danPointsEarned || 0);
            const rateVariation = Number(gr.rateChange || 0);
            const seasonVariation = Number((gr as any).seasonPointsEarned || 0);

            // Debug en desarrollo para todos los juegos con season points
            if (process.env.NODE_ENV === 'development' && seasonVariation !== 0) {
                console.log(`Debug Juego #${gr.game.id} (Season: ${seasonVariation}):`, {
                    gameId: gr.game.id,
                    gameDate: gr.game.gameDate,
                    tournamentId: (gr.game as any).tournamentId,
                    seasonId: (gr.game as any).seasonId,
                    seasonPointsEarned: (gr as any).seasonPointsEarned,
                    seasonPoints: seasonPoints,
                    seasonVariation: seasonVariation,
                    finalPosition: gr.finalPosition,
                    gamePoints: gamePoints
                });
            }

            return {
                gameId: gr.game.id,
                gameDate: gr.game.gameDate.toISOString().split('T')[0],
                createdAt: createdAt, // Timestamp cuando se creó el registro en Points
                position: gr.finalPosition,
                gameType: gr.game.gameType,
                sanma: gr.game.ruleset.sanma, // Campo para filtrar por cantidad de jugadores
                finalScore: Number(gr.finalScore), // Mostrar en la escala correcta
                danPoints: danPoints, // Valores acumulados para el gráfico
                ratePoints: ratePoints, // Valores acumulados para el gráfico
                seasonPoints: seasonPoints, // Valores acumulados para el gráfico
                danVariation: danVariation, // Variación específica del juego para tooltip
                rateVariation: rateVariation, // Variación específica del juego para tooltip
                seasonVariation: seasonVariation, // Variación específica del juego para tooltip
                tournamentId: tournamentId, // ID del torneo si es punto de torneo
                extraData: extraData, // Datos extra para identificar torneos
                players: gr.game.gameResults.map(result => ({
                    name: result.player.nickname,
                    position: result.finalPosition,
                    finalScore: Number(result.finalScore) // Mostrar en la escala correcta
                }))
            };
        }).reverse(); // Ordenar cronológicamente

        // Obtener eventos de temporada solo para el gráfico de season
        // Usar raw SQL optimizado para traer datos del juego cuando sea necesario
        const seasonEventsRaw = await prisma.$queryRaw`
            SELECT 
                COALESCE(game.game_date, tr.end_date) as date_,
                po.game_id,
                po.tournament_id,
                po.points_value,
                po.id,
                tr.name as tournament_name,
                tr.start_date as tournament_start_date,
                tr.sanma as tournament_sanma,
                -- Datos del juego cuando game_id no es null
                game.game_type,
                ruleset.sanma as game_sanma,
                gr.final_position,
                gr.final_score
            FROM points po 
            JOIN player pl ON pl.id = po.player_id
            LEFT JOIN game game ON game.id = po.game_id
            LEFT JOIN ruleset ruleset ON ruleset.id = game.ruleset_id
            LEFT JOIN game_result gr ON gr.player_id = po.player_id AND gr.game_id = po.game_id
            LEFT JOIN tournament tr ON tr.id = po.tournament_id
            WHERE pl.id = ${player.id} 
            AND po.points_type = 'SEASON'
            ORDER BY COALESCE(game.game_date, tr.end_date), po.game_id ASC NULLS LAST, po.id
        ` as any[];

        // Convertir directamente al formato que necesitamos
        const seasonEvents = seasonEventsRaw.map(raw => ({
            id: raw.id,
            gameId: raw.game_id,
            tournamentId: raw.tournament_id,
            pointsValue: raw.points_value,
            date: raw.date_,
            tournamentName: raw.tournament_name,
            tournamentStartDate: raw.tournament_start_date,
            tournamentSanma: raw.tournament_sanma,
            // Datos del juego cuando existe
            gameType: raw.game_type,
            gameSanma: raw.game_sanma,
            finalPosition: raw.final_position,
            finalScore: raw.final_score
        }));

        // Obtener gameResults para los juegos que aparecen en seasonEvents
        const seasonGameIds = seasonEvents
            .filter(ev => ev.gameId)
            .map(ev => ev.gameId);

        let gameResultsMap: { [gameId: number]: any[] } = {};

        if (seasonGameIds.length > 0) {
            const gameResults = await prisma.gameResult.findMany({
                where: {
                    gameId: { in: seasonGameIds }
                },
                include: {
                    player: {
                        select: {
                            nickname: true,
                            fullname: true
                        }
                    }
                },
                orderBy: [
                    { gameId: 'asc' },
                    { finalPosition: 'asc' }
                ]
            });

            // Agrupar por gameId para acceso rápido
            gameResultsMap = gameResults.reduce((acc, result) => {
                if (!acc[result.gameId]) {
                    acc[result.gameId] = [];
                }
                acc[result.gameId].push({
                    name: result.player.nickname,
                    position: result.finalPosition,
                    finalScore: Number(result.finalScore)
                });
                return acc;
            }, {} as { [gameId: number]: any[] });
        }

        // Obtener tournamentResults para los torneos que aparecen en seasonEvents
        const seasonTournamentIds = seasonEvents
            .filter(ev => ev.tournamentId)
            .map(ev => ev.tournamentId);

        let tournamentResultsMap: { [tournamentId: number]: any[] } = {};
        let playerTournamentPositions: { [tournamentId: number]: number } = {};

        if (seasonTournamentIds.length > 0) {
            const tournamentResults = await prisma.tournamentResult.findMany({
                where: {
                    tournamentId: { in: seasonTournamentIds }
                },
                include: {
                    player: {
                        select: {
                            nickname: true,
                            fullname: true
                        }
                    }
                },
                orderBy: [
                    { tournamentId: 'asc' },
                    { position: 'asc' }
                ]
            });

            // Agrupar por tournamentId para acceso rápido
            tournamentResultsMap = tournamentResults.reduce((acc, result) => {
                if (!acc[result.tournamentId]) {
                    acc[result.tournamentId] = [];
                }
                acc[result.tournamentId].push({
                    name: result.player.nickname,
                    position: result.position,
                    finalScore: Number(result.pointsWon)
                });
                return acc;
            }, {} as { [tournamentId: number]: any[] });

            // Obtener la posición del jugador específico en cada torneo
            const playerTournamentResults = await prisma.tournamentResult.findMany({
                where: {
                    tournamentId: { in: seasonTournamentIds },
                    playerId: player.id
                },
                select: {
                    tournamentId: true,
                    position: true
                }
            });

            // Crear mapa de posiciones del jugador por torneo
            playerTournamentPositions = playerTournamentResults.reduce((acc, result) => {
                acc[result.tournamentId] = result.position;
                return acc;
            }, {} as { [tournamentId: number]: number });
        }

        // Mapear seasonEvents al formato correcto
        // Los datos ya vienen ordenados correctamente por la consulta SQL
        type SeasonEvent = {
            source: 'GAME' | 'TOURNAMENT';
            id: number;
            poId: number;
            date: string;
            label: string;
            points: number;
            // Datos del juego (solo para source: 'GAME')
            gameType?: string;
            gameSanma?: boolean;
            finalPosition?: number;
            finalScore?: number;
            // Datos del torneo (solo para source: 'TOURNAMENT')
            tournamentSanma?: boolean;
        };

        const mappedSeasonEvents: SeasonEvent[] = seasonEvents.map(p => {
            const pointsValue = Number(p.pointsValue);

            if (p.gameId) {
                // Evento de juego
                return {
                    source: 'GAME',
                    id: p.gameId,
                    poId: p.id,
                    date: p.date.toISOString().slice(0, 10),
                    label: `Juego ${p.gameId}`,
                    points: pointsValue,
                    // Datos del juego
                    gameType: p.gameType,
                    gameSanma: p.gameSanma,
                    finalPosition: p.finalPosition,
                    finalScore: p.finalScore
                };
            } else if (p.tournamentId) {
                // Evento de torneo
                return {
                    source: 'TOURNAMENT',
                    id: p.tournamentId,
                    poId: p.id,
                    date: p.date.toISOString().slice(0, 10),
                    label: p.tournamentName || 'Torneo',
                    points: pointsValue,
                    // Datos del torneo
                    tournamentSanma: p.tournamentSanma
                };
            }
            return null;
        }).filter(Boolean) as SeasonEvent[];

        // Los datos ya vienen ordenados correctamente por la consulta SQL:
        // ORDER BY COALESCE(game.game_date, tr.end_date), po.game_id ASC NULLS LAST, po.id

        // Crear seasonData separado para el gráfico de season
        // Calcular variaciones correctamente (pointsValue es acumulado)
        let previousValue = 0;
        const seasonData = mappedSeasonEvents.map(ev => {
            const currentValue = Number(ev.points);
            const delta = currentValue - previousValue;
            previousValue = currentValue;

            // Determinar si es sanma según el tipo de evento
            const isSanma = ev.source === 'GAME'
                ? (ev.gameSanma || false)
                : (ev.tournamentSanma || false);

            // Obtener players del juego o torneo según corresponda
            const players = ev.source === 'GAME' && ev.id
                ? (gameResultsMap[ev.id] || [])
                : ev.source === 'TOURNAMENT' && ev.id
                    ? (tournamentResultsMap[ev.id] || [])
                    : [];

            // Obtener la posición del jugador (para juegos viene de ev.finalPosition, para torneos de playerTournamentPositions)
            const playerPosition = ev.source === 'GAME'
                ? (ev.finalPosition || 0)
                : ev.source === 'TOURNAMENT' && ev.id
                    ? (playerTournamentPositions[ev.id] || 0)
                    : 0;

            return {
                gameId: ev.source === 'GAME' ? ev.id : undefined,
                gameDate: ev.date,
                createdAt: undefined,
                position: playerPosition,      // ← posición correcta del jugador
                gameType: ev.source === 'TOURNAMENT' ? 'TOURNAMENT' : (ev.gameType || 'HANCHAN'),
                sanma: isSanma,
                finalScore: ev.source === 'GAME' ? (ev.finalScore || 0) : 0,
                danPoints: 0,
                ratePoints: 0,
                seasonPoints: currentValue,    // ← acumulado para escalar y mostrar +90
                danVariation: 0,
                rateVariation: 0,
                seasonVariation: delta,        // ← variación real (debería ser +90 para torneos)
                tournamentId: ev.source === 'TOURNAMENT' ? ev.id : undefined,
                tournamentName: ev.source === 'TOURNAMENT' ? ev.label : undefined,
                extraData: undefined,
                players: players,              // ← ahora incluye los players del juego/torneo
            };
        });

        // Calcular estadísticas generales
        const totalGames = gameStats._count.id || 0;
        const avgPosition = gameStats._avg.finalPosition || 0;
        const firstPlaces = (fourPlayerHanchanPositions.find(p => p.finalPosition === 1)?._count.id || 0) +
            (fourPlayerTonpuusenPositions.find(p => p.finalPosition === 1)?._count.id || 0) +
            (threePlayerHanchanPositions.find(p => p.finalPosition === 1)?._count.id || 0) +
            (threePlayerTonpuusenPositions.find(p => p.finalPosition === 1)?._count.id || 0);

        // Función para calcular estadísticas detalladas por tipo
        const calculateDetailedStats = (positions: any[], total: number, isThreePlayer: boolean = false) => {
            const first = positions.find(p => p.finalPosition === 1)?._count.id || 0;
            const second = positions.find(p => p.finalPosition === 2)?._count.id || 0;
            const third = positions.find(p => p.finalPosition === 3)?._count.id || 0;
            const fourth = isThreePlayer ? 0 : (positions.find(p => p.finalPosition === 4)?._count.id || 0);

            const rentaiRate = total > 0 ? ((first + second) / total * 100) : 0;

            return {
                first, second, third, fourth,
                firstPercent: total > 0 ? (first / total * 100) : 0,
                secondPercent: total > 0 ? (second / total * 100) : 0,
                thirdPercent: total > 0 ? (third / total * 100) : 0,
                fourthPercent: total > 0 ? (fourth / total * 100) : 0,
                rentaiRate
            };
        };

        // Calcular estadísticas por tipo y cantidad
        const fourPlayerHanchanTotal = fourPlayerHanchanStats._count.id || 0;
        const fourPlayerTonpuusenTotal = fourPlayerTonpuusenStats._count.id || 0;
        const threePlayerHanchanTotal = threePlayerHanchanStats._count.id || 0;
        const threePlayerTonpuusenTotal = threePlayerTonpuusenStats._count.id || 0;

        const fourPlayerHanchanAvgPosition = fourPlayerHanchanStats._avg.finalPosition || 0;
        const fourPlayerTonpuusenAvgPosition = fourPlayerTonpuusenStats._avg.finalPosition || 0;
        const threePlayerHanchanAvgPosition = threePlayerHanchanStats._avg.finalPosition || 0;
        const threePlayerTonpuusenAvgPosition = threePlayerTonpuusenStats._avg.finalPosition || 0;

        const fourPlayerHanchanDetailed = calculateDetailedStats(fourPlayerHanchanPositions, fourPlayerHanchanTotal);
        const fourPlayerTonpuusenDetailed = calculateDetailedStats(fourPlayerTonpuusenPositions, fourPlayerTonpuusenTotal);
        const threePlayerHanchanDetailed = calculateDetailedStats(threePlayerHanchanPositions, threePlayerHanchanTotal, true);
        const threePlayerTonpuusenDetailed = calculateDetailedStats(threePlayerTonpuusenPositions, threePlayerTonpuusenTotal, true);

        // Obtener colores de rangos desde la base de datos
        const danRankYonma = await getDanRank(danPointsYonma, false);
        const danRankSanma = await getDanRank(danPointsSanma, true);

        await ensureCacheReady();
        const danConfigs = getDan();
        const danConfigYonma = danConfigs.find(config =>
            !config.sanma &&
            danPointsYonma >= config.minPoints &&
            (config.maxPoints === null || danPointsYonma <= config.maxPoints)
        );
        const danConfigSanma = danConfigs.find(config =>
            config.sanma &&
            danPointsSanma >= config.minPoints &&
            (config.maxPoints === null || danPointsSanma <= config.maxPoints)
        );

        const rankColorYonma = danConfigYonma?.color || '#3b82f6';
        const rankColorSanma = danConfigSanma?.color || '#3b82f6';

        const response = {
            player: {
                id: player.id,
                playerId: player.playerNumber,
                nickname: player.nickname,
                fullname: player.fullname,
                birthday: player.birthday,
                country: player.country?.isoCode,
                isActive: isPlayerActive,
                onlineUsers: player.onlineUsers
            },
            stats: {
                totalGames,
                firstPlaces,
                avgPosition: Number(avgPosition.toFixed(2)),
                currentDan: danPoints,
                currentDanYonma: danPointsYonma,
                currentDanSanma: danPointsSanma,
                currentRate: ratePoints,
                currentRateYonma: ratePointsYonma,
                currentRateSanma: ratePointsSanma,
                // Colores de rangos desde la base de datos
                rankColorYonma: rankColorYonma,
                rankColorSanma: rankColorSanma,
                maxRate: maxRateYonma, // Usar maxRate de 4p por defecto
                maxRateYonma: maxRateYonma,
                maxRateSanma: maxRateSanma,
                seasonPoints: seasonPointsYonma, // Usar seasonPoints de 4p por defecto
                seasonPointsYonma: seasonPointsYonma,
                seasonPointsSanma: seasonPointsSanma,
                // Estadísticas separadas por tipo de juego y cantidad de jugadores
                fourPlayerHanchan: {
                    total: fourPlayerHanchanTotal,
                    avgPosition: Number(fourPlayerHanchanAvgPosition.toFixed(2)),
                    ...fourPlayerHanchanDetailed
                },
                fourPlayerTonpuusen: {
                    total: fourPlayerTonpuusenTotal,
                    avgPosition: Number(fourPlayerTonpuusenAvgPosition.toFixed(2)),
                    ...fourPlayerTonpuusenDetailed
                },
                threePlayerHanchan: {
                    total: threePlayerHanchanTotal,
                    avgPosition: Number(threePlayerHanchanAvgPosition.toFixed(2)),
                    ...threePlayerHanchanDetailed
                },
                threePlayerTonpuusen: {
                    total: threePlayerTonpuusenTotal,
                    avgPosition: Number(threePlayerTonpuusenAvgPosition.toFixed(2)),
                    ...threePlayerTonpuusenDetailed
                }
            },
            rankings: currentRanking ? {
                totalGames: currentRanking.totalGames,
                averagePosition: currentRanking.averagePosition,
                danPoints: currentRanking.danPoints,
                ratePoints: currentRanking.ratePoints,
                maxRate: currentRanking.maxRate,
                seasonPoints: currentRanking.seasonPoints,
                // Usar valores calculados dinámicamente en lugar de los de la base de datos
                firstPlaceH: fourPlayerHanchanDetailed.first,
                secondPlaceH: fourPlayerHanchanDetailed.second,
                thirdPlaceH: fourPlayerHanchanDetailed.third,
                fourthPlaceH: fourPlayerHanchanDetailed.fourth,
                firstPlaceT: fourPlayerTonpuusenDetailed.first,
                secondPlaceT: fourPlayerTonpuusenDetailed.second,
                thirdPlaceT: fourPlayerTonpuusenDetailed.third,
                fourthPlaceT: fourPlayerTonpuusenDetailed.fourth,
                // Season counters (usar any por posibles desfasajes del cliente Prisma)
                seasonTotalGames: (currentRanking as any).seasonTotalGames || 0,
                seasonAveragePosition: (currentRanking as any).seasonAveragePosition || 0,
                seasonFirstPlaceH: (currentRanking as any).seasonFirstPlaceH || 0,
                seasonSecondPlaceH: (currentRanking as any).seasonSecondPlaceH || 0,
                seasonThirdPlaceH: (currentRanking as any).seasonThirdPlaceH || 0,
                seasonFourthPlaceH: (currentRanking as any).seasonFourthPlaceH || 0,
                seasonFirstPlaceT: (currentRanking as any).seasonFirstPlaceT || 0,
                seasonSecondPlaceT: (currentRanking as any).seasonSecondPlaceT || 0,
                seasonThirdPlaceT: (currentRanking as any).seasonThirdPlaceT || 0,
                seasonFourthPlaceT: (currentRanking as any).seasonFourthPlaceT || 0
            } : null,
            chartData,
            seasonData,
            // Información de vinculación
            isLinked: !!userPlayerLink,
            hasPendingRequest: !!pendingRequest,
            userHasAnyLink, // ✅ Agregar información si el usuario ya tiene alguna vinculación
            userHasRejectedRequest, // ✅ Agregar información si el usuario tiene solicitudes rechazadas
            linkInfo: {
                isLinked: !!userPlayerLink,
                hasPendingRequest: !!pendingRequest,
                linkedUserId: userPlayerLink?.userId || null,
                pendingRequestId: pendingRequest?.id || null,
                userHasAnyLink, // ✅ También en linkInfo para compatibilidad
                userHasRejectedRequest // ✅ También en linkInfo
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching player profile:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
