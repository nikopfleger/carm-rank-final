// app/api/abm/tournament-results/bulk/route.ts
import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

interface TournamentResultInput {
    id?: number;
    position: number;
    pointsWon: number;
    prizeWon?: number | null;
    playerId: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tournamentId, results } = body as {
            tournamentId: number | string;
            results: TournamentResultInput[];
        };

        // Validaciones básicas
        const tid = Number(tournamentId);
        if (!tid || !Array.isArray(results)) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: tournamentId, results' },
                { status: 400 }
            );
        }

        // 1) Verificar torneo
        const tournament = await prisma.tournament.findUnique({
            where: { id: tid },
        });

        if (!tournament) {
            return NextResponse.json(
                { error: 'El torneo especificado no existe' },
                { status: 400 }
            );
        }

        if (tournament.isCompleted) {
            return NextResponse.json(
                {
                    error:
                        'No se pueden modificar los resultados de un torneo ya completado. Contacte al administrador si necesita hacer cambios.',
                },
                { status: 400 }
            );
        }

        // 2) Validar resultados
        const validationErrors: string[] = [];
        const playerIds = new Set<number>();
        const positions = new Set<number>();

        results.forEach((r, idx) => {
            if (!r.playerId || r.playerId === 0) {
                validationErrors.push(`Resultado ${idx + 1}: Debe especificar un jugador`);
            } else if (playerIds.has(r.playerId)) {
                validationErrors.push(
                    `Resultado ${idx + 1}: El jugador ya está asignado a otra posición`
                );
            } else {
                playerIds.add(r.playerId);
            }

            if (!r.position || r.position <= 0) {
                validationErrors.push(
                    `Resultado ${idx + 1}: La posición debe ser mayor a 0`
                );
            } else if (positions.has(r.position)) {
                validationErrors.push(
                    `Resultado ${idx + 1}: La posición ${r.position} está duplicada`
                );
            } else {
                positions.add(r.position);
            }

            if (r.pointsWon < 0) {
                validationErrors.push(
                    `Resultado ${idx + 1}: Los puntos no pueden ser negativos`
                );
            }
        });

        if (validationErrors.length > 0) {
            return NextResponse.json(
                { error: 'Errores de validación', details: validationErrors },
                { status: 400 }
            );
        }

        // 3) Chequear existencia de jugadores
        const playerIdsArray = Array.from(playerIds);
        const existingPlayers = await prisma.player.findMany({
            where: { id: { in: playerIdsArray } },
            select: { id: true },
        });

        if (existingPlayers.length !== playerIdsArray.length) {
            const existingIds = new Set(existingPlayers.map((p) => p.id));
            const missing = playerIdsArray.filter((id) => !existingIds.has(id));
            return NextResponse.json(
                { error: `Los siguientes jugadores no existen: ${missing.join(', ')}` },
                { status: 400 }
            );
        }

        // 4) Transacción
        const createdResults = await prisma.$transaction(async (tx) => {
            // 4.1) Soft delete de resultados anteriores
            await tx.tournamentResult.updateMany({
                where: { tournamentId: tid, deleted: false },
                data: { deleted: true, updatedAt: new Date() },
            });

            // 4.2) Crear nuevos resultados
            const created: Array<
                Awaited<ReturnType<typeof tx.tournamentResult.create>>
            > = [];
            for (const r of results) {
                const tr = await tx.tournamentResult.create({
                    data: {
                        tournamentId: tid,
                        playerId: r.playerId,
                        position: r.position,
                        pointsWon: r.pointsWon,
                        prizeWon: r.prizeWon ?? null,
                    },
                    include: {
                        player: {
                            select: {
                                id: true,
                                nickname: true,
                                fullname: true,
                                playerNumber: true,
                            },
                        },
                    },
                });
                created.push(tr);
            }

            // 4.3) Si hay season: registrar puntos acumulados y actualizar ranking
            if (tournament.seasonId) {
                const seasonPointsData: {
                    playerId: number;
                    seasonId: number;
                    pointsValue: number;
                    description: string;
                    pointsType: 'SEASON';
                    gameId: number | null;
                    tournamentId: number | null;
                    isSanma: boolean;
                    extraData: string | null;
                }[] = [];

                for (const tr of created) {
                    // Buscar último acumulado de temporada (SEASON) del jugador en esta season
                    const lastSeasonPoint = await tx.points.findFirst({
                        where: {
                            playerId: tr.playerId,
                            pointsType: 'SEASON',
                            seasonId: tournament.seasonId,
                        },
                        orderBy: [
                            { game: { gameDate: 'desc' } }, // si existe game asociado
                            { tournament: { endDate: 'desc' } }, // si existe tournament asociado
                            { id: 'desc' }, // desempate
                        ],
                        include: {
                            game: { select: { gameDate: true } },
                            tournament: { select: { endDate: true } },
                        },
                    });

                    const previousPoints = Number(lastSeasonPoint?.pointsValue || 0);
                    const tournamentPoints = Number(tr.pointsWon || 0);
                    const newAccumulated = previousPoints + tournamentPoints;

                    seasonPointsData.push({
                        playerId: tr.playerId,
                        seasonId: tournament.seasonId,
                        pointsValue: newAccumulated,
                        description: `Puntos de torneo - Posición ${tr.position}`,
                        pointsType: 'SEASON',
                        gameId: null,
                        tournamentId: tid,
                        isSanma: !!tournament.sanma,
                        extraData: JSON.stringify({
                            position: tr.position,
                            source: 'tournament_results',
                            previousPoints,
                            tournamentPoints,
                        }),
                    });
                }

                if (seasonPointsData.length > 0) {
                    await tx.points.createMany({ data: seasonPointsData as any });
                }

                // 4.4) Actualizar PlayerRanking (usar WhereUniqueInput con la compuesta)
                for (const sp of seasonPointsData) {
                    await tx.playerRanking.upsert({
                        where: {
                            playerId_isSanma: {
                                playerId: sp.playerId,
                                isSanma: !!tournament.sanma,
                            },
                        },
                        update: {
                            seasonPoints: sp.pointsValue,
                        },
                        create: {
                            playerId: sp.playerId,
                            isSanma: !!tournament.sanma,
                            seasonPoints: sp.pointsValue,

                            // defaults requeridos
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
                            fourthPlaceT: 0,
                        },
                    });
                }
            }

            // 4.5) Marcar torneo como completado + optimistic locking por versión
            await tx.tournament.update({
                where: { id: tid, version: tournament.version },
                data: {
                    isCompleted: true,
                    endDate: tournament.endDate ?? new Date(),
                    version: { increment: 1 },
                },
            });

            return created;
        });

        return NextResponse.json({
            success: true,
            message: tournament.seasonId
                ? 'Resultados del torneo guardados y puntos de temporada cargados exitosamente'
                : 'Resultados del torneo guardados exitosamente',
            data: {
                tournamentId: Number(tournamentId),
                resultsCount: createdResults.length,
                results: createdResults,
                seasonPointsLoaded: !!tournament.seasonId,
            },
        });
    } catch (error) {
        console.error('❌ Error actualizando resultados de torneo:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido',
            },
            { status: 500 }
        );
    }
}
