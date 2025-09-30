import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

;

interface TournamentResultInput {
    id?: number;
    position: number;
    pointsWon: number;
    prizeWon?: number;
    playerId: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tournamentId, results } = body;

        // Validar campos requeridos
        if (!tournamentId || !Array.isArray(results)) {
            return NextResponse.json(
                { error: "Faltan campos requeridos: tournamentId, results" },
                { status: 400 }
            );
        }

        // Validar que el torneo existe
        const tournament = await prisma.tournament.findUnique({
            where: { id: parseInt(tournamentId) }
        });

        if (!tournament) {
            return NextResponse.json(
                { error: "El torneo especificado no existe" },
                { status: 400 }
            );
        }

        // Verificar que el torneo no esté completado (no se puede modificar)
        if (tournament.isCompleted) {
            return NextResponse.json(
                { error: "No se pueden modificar los resultados de un torneo ya completado. Contacte al administrador si necesita hacer cambios." },
                { status: 400 }
            );
        }

        // Validar resultados
        const validationErrors: string[] = [];
        const playerIds = new Set<number>();
        const positions = new Set<number>();

        results.forEach((result: TournamentResultInput, index: number) => {
            if (!result.playerId || result.playerId === 0) {
                validationErrors.push(`Resultado ${index + 1}: Debe especificar un jugador`);
            } else if (playerIds.has(result.playerId)) {
                validationErrors.push(`Resultado ${index + 1}: El jugador ya está asignado a otra posición`);
            } else {
                playerIds.add(result.playerId);
            }

            if (!result.position || result.position <= 0) {
                validationErrors.push(`Resultado ${index + 1}: La posición debe ser mayor a 0`);
            } else if (positions.has(result.position)) {
                validationErrors.push(`Resultado ${index + 1}: La posición ${result.position} está duplicada`);
            } else {
                positions.add(result.position);
            }

            if (result.pointsWon < 0) {
                validationErrors.push(`Resultado ${index + 1}: Los puntos no pueden ser negativos`);
            }
        });

        if (validationErrors.length > 0) {
            return NextResponse.json(
                { error: "Errores de validación", details: validationErrors },
                { status: 400 }
            );
        }

        // Verificar que todos los jugadores existen
        const playerIdsArray = Array.from(playerIds);
        const existingPlayers = await prisma.player.findMany({
            where: { id: { in: playerIdsArray } },
            select: { id: true }
        });

        if (existingPlayers.length !== playerIdsArray.length) {
            const existingPlayerIds = existingPlayers.map(p => p.id);
            const missingPlayerIds = playerIdsArray.filter(id => !existingPlayerIds.includes(id));
            return NextResponse.json(
                { error: `Los siguientes jugadores no existen: ${missingPlayerIds.join(', ')}` },
                { status: 400 }
            );
        }

        // Ejecutar en transacción
        const result = await prisma.$transaction(async (tx) => {
            // 1. Marcar como eliminados los resultados existentes del torneo (soft delete)
            await tx.tournamentResult.updateMany({
                where: {
                    tournamentId: parseInt(tournamentId),
                    deleted: false
                },
                data: {
                    deleted: true,
                    updatedAt: new Date()
                }
            });

            // 2. Crear nuevos resultados
            const createdResults = [];
            for (const resultData of results) {
                const tournamentResult = await tx.tournamentResult.create({
                    data: {
                        tournamentId: parseInt(tournamentId),
                        playerId: resultData.playerId,
                        position: resultData.position,
                        pointsWon: resultData.pointsWon,
                        prizeWon: resultData.prizeWon || null
                    },
                    include: {
                        player: {
                            select: {
                                id: true,
                                nickname: true,
                                fullname: true,
                                playerNumber: true
                            }
                        }
                    }
                });

                createdResults.push(tournamentResult);
            }

            // 3. Cargar puntos de temporada si el torneo tiene temporada asociada
            if (tournament.seasonId) {
                // Para cada jugador, obtener su último puntaje de temporada y sumarle los puntos del torneo
                const seasonPointsData = [];

                for (const result of createdResults) {
                    // Obtener el último puntaje de temporada del jugador
                    // Usar la misma lógica que el perfil: ordenar por fecha del juego/torneo y luego por ID
                    const lastSeasonPoint = await tx.points.findFirst({
                        where: {
                            playerId: result.playerId,
                            pointsType: 'SEASON',
                            seasonId: tournament.seasonId
                        },
                        orderBy: [
                            // Usar fecha del juego o fecha de fin del torneo
                            { game: { gameDate: 'desc' } },
                            { tournament: { endDate: 'desc' } },
                            { id: 'desc' } // Desempatar por ID descendente
                        ],
                        include: {
                            game: { select: { gameDate: true } },
                            tournament: { select: { endDate: true } }
                        }
                    });

                    // Calcular el nuevo puntaje acumulado
                    const previousPoints = Number(lastSeasonPoint?.pointsValue || 0);
                    const tournamentPoints = Number(result.pointsWon);
                    const newAccumulatedPoints = previousPoints + tournamentPoints;

                    seasonPointsData.push({
                        playerId: result.playerId,
                        seasonId: tournament.seasonId!,
                        pointsValue: newAccumulatedPoints, // Valor acumulado, no solo los puntos del torneo
                        description: `Puntos de torneo - Posición ${result.position}`,
                        pointsType: 'SEASON' as const,
                        gameId: null, // No está asociado a un juego específico
                        tournamentId: parseInt(tournamentId),
                        isSanma: tournament.sanma, // Usar el valor del torneo
                        extraData: JSON.stringify({
                            position: result.position,
                            source: 'tournament_results',
                            previousPoints: previousPoints,
                            tournamentPoints: tournamentPoints
                        })
                    });
                }

                // Insertar los puntos en la tabla Points
                if (seasonPointsData.length > 0) {
                    await tx.points.createMany({
                        data: seasonPointsData
                    });
                }

                console.log(`✅ Cargados ${seasonPointsData.length} puntos de temporada para el torneo ${tournamentId}`);

                // 5. Actualizar PlayerRanking con los nuevos seasonPoints
                for (const data of seasonPointsData) {
                    // Usar el campo sanma del torneo
                    const isSanma = tournament.sanma;

                    await tx.playerRanking.upsert({
                        where: {
                            playerId_isSanma: {
                                playerId: data.playerId,
                                isSanma: isSanma
                            }
                        },
                        update: {
                            seasonPoints: data.pointsValue, // Actualizar con el nuevo valor acumulado
                        },
                        create: {
                            playerId: data.playerId,
                            isSanma: isSanma,
                            seasonPoints: data.pointsValue,
                            // Valores por defecto para campos requeridos
                            totalGames: 0,
                            averagePosition: 0,
                            danPoints: 0,
                            ratePoints: 0,
                            maxRate: 0,
                            firstPlaceH: 0,
                            secondPlaceH: 0,
                            thirdPlaceH: 0,
                            fourthPlaceH: 0,
                            firstPlaceT: 0,
                            secondPlaceT: 0,
                            thirdPlaceT: 0,
                            fourthPlaceT: 0
                        }
                    });
                }

                console.log(`✅ Actualizado PlayerRanking para ${seasonPointsData.length} jugadores`);
            }

            // ÚLTIMO PASO: Actualizar estadísticas del torneo (solo si todo lo anterior fue exitoso)
            await tx.tournament.update({
                where: {
                    id: parseInt(tournamentId),
                    version: tournament.version // Incluir versión para optimistic locking
                },
                data: {
                    // Marcar como completado y finalizado
                    isCompleted: true,
                    endDate: tournament.endDate || new Date().toISOString().split('T')[0],
                    version: { increment: 1 } // Incrementar versión
                }
            });

            return createdResults;
        });

        console.log(`✅ Resultados de torneo ${tournamentId} actualizados: ${result.length} resultados`);

        return NextResponse.json({
            success: true,
            message: tournament.seasonId
                ? `Resultados del torneo guardados y puntos de temporada cargados exitosamente`
                : `Resultados del torneo guardados exitosamente`,
            data: {
                tournamentId: parseInt(tournamentId),
                resultsCount: result.length,
                results: result,
                seasonPointsLoaded: !!tournament.seasonId
            }
        });

    } catch (error) {
        console.error("❌ Error actualizando resultados de torneo:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Error interno del servidor",
                message: error instanceof Error ? error.message : "Error desconocido"
            },
            { status: 500 }
        );
    }
}
