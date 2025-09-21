import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

interface SeasonCloseRequest {
    newSeasonId: number | null;
    confirmationText: string;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const currentSeasonId = parseInt(id);

        if (isNaN(currentSeasonId)) {
            return NextResponse.json(
                { error: "ID de temporada inválido" },
                { status: 400 }
            );
        }

        const body: SeasonCloseRequest = await request.json();

        // Validar confirmación
        if (body.confirmationText?.toUpperCase() !== "CONFIRMAR") {
            return NextResponse.json(
                { error: "Confirmación requerida" },
                { status: 400 }
            );
        }

        // Validar que la temporada actual existe y está activa
        const currentSeason = await prisma.season.findUnique({
            where: { id: currentSeasonId },
            select: { id: true, name: true, isActive: true, deleted: true }
        });

        if (!currentSeason) {
            return NextResponse.json(
                { error: "Temporada no encontrada" },
                { status: 404 }
            );
        }

        if (currentSeason.deleted) {
            return NextResponse.json(
                { error: "La temporada está eliminada" },
                { status: 400 }
            );
        }

        if (!currentSeason.isActive) {
            return NextResponse.json(
                { error: "La temporada no está activa" },
                { status: 400 }
            );
        }

        // Validar que la nueva temporada existe (si se especifica)
        let newSeason = null;
        if (body.newSeasonId) {
            newSeason = await prisma.season.findUnique({
                where: { id: body.newSeasonId },
                select: { id: true, name: true, deleted: true }
            });

            if (!newSeason || newSeason.deleted) {
                return NextResponse.json(
                    { error: "Nueva temporada no encontrada" },
                    { status: 404 }
                );
            }
        }

        // Ejecutar el cierre de temporada en una transacción
        const result = await prisma.$transaction(async (tx) => {
            console.log(`🔄 Iniciando cierre de temporada ${currentSeasonId} -> ${body.newSeasonId}`);

            // 1. Obtener todos los rankings de jugadores para guardar en SeasonResult
            const rankings = await tx.playerRanking.findMany({
                where: { deleted: false },
                include: {
                    player: {
                        select: { id: true, nickname: true }
                    }
                }
            });

            console.log(`📊 Encontrados ${rankings.length} rankings para procesar`);

            // 2. Crear SeasonResults para cada jugador y modo (4p y 3p)
            const seasonResultsCreated = [];

            for (const ranking of rankings) {
                // Verificar si el jugador tiene datos de temporada para guardar
                const hasSeasonData = ranking.seasonTotalGames > 0 ||
                    ranking.seasonPoints > 0 ||
                    ranking.seasonFirstPlaceH > 0 ||
                    ranking.seasonSecondPlaceH > 0 ||
                    ranking.seasonThirdPlaceH > 0 ||
                    ranking.seasonFourthPlaceH > 0 ||
                    ranking.seasonFirstPlaceT > 0 ||
                    ranking.seasonSecondPlaceT > 0 ||
                    ranking.seasonThirdPlaceT > 0 ||
                    ranking.seasonFourthPlaceT > 0;

                if (hasSeasonData) {
                    // Crear SeasonResult para este jugador
                    const seasonResult = await tx.seasonResult.create({
                        data: {
                            seasonId: currentSeasonId,
                            playerId: ranking.playerId,
                            isSanma: ranking.isSanma,

                            // Datos agregados de la temporada
                            seasonTotalGames: ranking.seasonTotalGames,
                            seasonAveragePosition: ranking.seasonAveragePosition,

                            // Desglose Hanchan
                            seasonFirstPlaceH: ranking.seasonFirstPlaceH,
                            seasonSecondPlaceH: ranking.seasonSecondPlaceH,
                            seasonThirdPlaceH: ranking.seasonThirdPlaceH,
                            seasonFourthPlaceH: ranking.seasonFourthPlaceH,

                            // Desglose Tonpuusen
                            seasonFirstPlaceT: ranking.seasonFirstPlaceT,
                            seasonSecondPlaceT: ranking.seasonSecondPlaceT,
                            seasonThirdPlaceT: ranking.seasonThirdPlaceT,
                            seasonFourthPlaceT: ranking.seasonFourthPlaceT,
                        }
                    });

                    seasonResultsCreated.push({
                        playerId: ranking.playerId,
                        playerNickname: ranking.player.nickname,
                        isSanma: ranking.isSanma,
                        seasonPoints: ranking.seasonPoints,
                        totalGames: ranking.seasonTotalGames
                    });
                }
            }

            console.log(`✅ Creados ${seasonResultsCreated.length} SeasonResults`);

            // 3. Reset de todos los campos season_* en PlayerRanking
            const resetResult = await tx.playerRanking.updateMany({
                where: { deleted: false },
                data: {
                    seasonPoints: 0,
                    seasonTotalGames: 0,
                    seasonAveragePosition: 0,
                    seasonFirstPlaceH: 0,
                    seasonSecondPlaceH: 0,
                    seasonThirdPlaceH: 0,
                    seasonFourthPlaceH: 0,
                    seasonFirstPlaceT: 0,
                    seasonSecondPlaceT: 0,
                    seasonThirdPlaceT: 0,
                    seasonFourthPlaceT: 0,
                }
            });

            console.log(`🔄 Reset aplicado a ${resetResult.count} rankings`);

            // 4. Cerrar temporada actual
            const closedSeason = await tx.season.update({
                where: { id: currentSeasonId },
                data: {
                    isActive: false,
                    isClosed: true,
                    endDate: new Date()
                }
            });

            console.log(`🔒 Temporada ${currentSeasonId} cerrada`);

            // 5. Activar nueva temporada (si se especifica)
            let activatedSeason = null;
            if (body.newSeasonId) {
                activatedSeason = await tx.season.update({
                    where: { id: body.newSeasonId },
                    data: { isActive: true }
                });
                console.log(`🎯 Temporada ${body.newSeasonId} activada`);
            }

            return {
                closedSeason: {
                    id: closedSeason.id,
                    name: closedSeason.name,
                    endDate: closedSeason.endDate
                },
                activatedSeason: activatedSeason ? {
                    id: activatedSeason.id,
                    name: activatedSeason.name
                } : null,
                seasonResultsCreated: seasonResultsCreated.length,
                playersReset: resetResult.count,
                seasonResults: seasonResultsCreated
            };
        });

        // Log de auditoría
        console.log(`✅ Cierre de temporada completado:`, {
            closedSeasonId: currentSeasonId,
            activatedSeasonId: body.newSeasonId,
            seasonResultsCreated: result.seasonResultsCreated,
            playersReset: result.playersReset,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            message: `Temporada cerrada exitosamente`,
            data: result
        });

    } catch (error) {
        console.error("❌ Error cerrando temporada:", error);

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

// GET para obtener estadísticas de la temporada antes del cierre
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const seasonId = parseInt(id);

        if (isNaN(seasonId)) {
            return NextResponse.json(
                { error: "ID de temporada inválido" },
                { status: 400 }
            );
        }

        // Obtener estadísticas de la temporada
        const seasonStats = await prisma.playerRanking.aggregate({
            where: {
                deleted: false,
                seasonTotalGames: { gt: 0 }
            },
            _sum: {
                seasonTotalGames: true
            },
            _count: {
                playerId: true
            }
        });

        // Obtener el jugador con más puntos de temporada
        const topPlayer = await prisma.playerRanking.findFirst({
            where: {
                deleted: false,
                seasonTotalGames: { gt: 0 }
            },
            orderBy: {
                seasonPoints: 'desc'
            },
            include: {
                player: {
                    select: { nickname: true }
                }
            }
        });

        // Calcular promedio de juegos por jugador
        const avgGamesPerPlayer = seasonStats._count.playerId > 0
            ? (seasonStats._sum.seasonTotalGames || 0) / seasonStats._count.playerId
            : 0;

        return NextResponse.json({
            success: true,
            data: {
                totalGames: seasonStats._sum.seasonTotalGames || 0,
                totalPlayers: seasonStats._count.playerId || 0,
                avgGamesPerPlayer: Math.round(avgGamesPerPlayer * 10) / 10,
                topPlayer: topPlayer ? {
                    nickname: topPlayer.player.nickname,
                    seasonPoints: Number(topPlayer.seasonPoints)
                } : null
            }
        });

    } catch (error) {
        console.error("Error obteniendo estadísticas de temporada:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Error interno del servidor"
            },
            { status: 500 }
        );
    }
}
