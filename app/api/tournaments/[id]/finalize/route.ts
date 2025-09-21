import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

interface TournamentFinalizeRequest {
    confirmationText: string;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tournamentId = parseInt(id);

        if (isNaN(tournamentId)) {
            return NextResponse.json(
                { error: "ID de torneo inválido" },
                { status: 400 }
            );
        }

        const body: TournamentFinalizeRequest = await request.json();

        // Validar confirmación
        if (body.confirmationText?.toUpperCase() !== "FINALIZAR") {
            return NextResponse.json(
                { error: "Confirmación requerida" },
                { status: 400 }
            );
        }

        // Validar que el torneo existe y no está completado
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: {
                id: true,
                name: true,
                isCompleted: true,
                deleted: true,
                startDate: true,
                endDate: true
            }
        });

        if (!tournament) {
            return NextResponse.json(
                { error: "Torneo no encontrado" },
                { status: 404 }
            );
        }

        if (tournament.deleted) {
            return NextResponse.json(
                { error: "El torneo está eliminado" },
                { status: 400 }
            );
        }

        if (tournament.isCompleted) {
            return NextResponse.json(
                { error: "El torneo ya está completado" },
                { status: 400 }
            );
        }

        // Verificar que el torneo haya terminado (si tiene endDate)
        if (tournament.endDate && new Date(tournament.endDate) > new Date()) {
            return NextResponse.json(
                { error: "El torneo aún no ha terminado según su fecha de fin" },
                { status: 400 }
            );
        }

        // Ejecutar la finalización del torneo en una transacción
        const result = await prisma.$transaction(async (tx) => {
            console.log(`🏆 Iniciando finalización de torneo ${tournamentId}`);

            // 1. Obtener todos los puntos de temporada del torneo
            const tournamentPoints = await tx.points.findMany({
                where: {
                    tournamentId,
                    pointsType: 'SEASON',
                    deleted: false
                },
                include: {
                    player: {
                        select: { id: true, nickname: true }
                    }
                },
                orderBy: { createdAt: 'asc' }
            });

            console.log(`📊 Encontrados ${tournamentPoints.length} puntos de torneo`);

            if (tournamentPoints.length === 0) {
                throw new Error("No se encontraron puntos de torneo para finalizar");
            }

            // 2. Agrupar por jugador y calcular totales
            const playerTotals = new Map<number, {
                playerId: number;
                playerNickname: string;
                totalPoints: number;
                gamesPlayed: number;
            }>();

            for (const point of tournamentPoints) {
                const current = playerTotals.get(point.playerId) || {
                    playerId: point.playerId,
                    playerNickname: point.player.nickname,
                    totalPoints: 0,
                    gamesPlayed: 0
                };

                current.totalPoints += Number(point.pointsValue);
                current.gamesPlayed += 1;
                playerTotals.set(point.playerId, current);
            }

            console.log(`👥 Procesados ${playerTotals.size} jugadores únicos`);

            // 3. Ordenar por puntos y asignar posiciones
            const sortedPlayers = Array.from(playerTotals.values())
                .sort((a, b) => b.totalPoints - a.totalPoints)
                .map((player, index) => ({
                    ...player,
                    position: index + 1
                }));

            console.log(`🏅 Clasificación calculada para ${sortedPlayers.length} jugadores`);

            // 4. Verificar si ya existen TournamentResults (evitar duplicados)
            const existingResults = await tx.tournamentResult.findMany({
                where: { tournamentId },
                select: { playerId: true }
            });

            if (existingResults.length > 0) {
                console.log(`⚠️ Ya existen ${existingResults.length} resultados, eliminándolos primero`);
                await tx.tournamentResult.deleteMany({
                    where: { tournamentId }
                });
            }

            // 5. Crear TournamentResults
            const tournamentResults = [];
            for (const result of sortedPlayers) {
                const tournamentResult = await tx.tournamentResult.create({
                    data: {
                        tournamentId,
                        playerId: result.playerId,
                        position: result.position,
                        pointsWon: Math.round(result.totalPoints * 10) / 10, // Redondear a 1 decimal
                        // prizeWon se puede calcular según posición en el futuro
                        prizeWon: null,
                    }
                });

                tournamentResults.push({
                    playerId: result.playerId,
                    playerNickname: result.playerNickname,
                    position: result.position,
                    pointsWon: result.totalPoints,
                    gamesPlayed: result.gamesPlayed
                });
            }

            console.log(`✅ Creados ${tournamentResults.length} TournamentResults`);

            // 6. Marcar torneo como completado
            const completedTournament = await tx.tournament.update({
                where: { id: tournamentId },
                data: {
                    isCompleted: true,
                    // Si no tiene endDate, usar la fecha actual
                    endDate: tournament.endDate || new Date()
                }
            });

            console.log(`🔒 Torneo ${tournamentId} marcado como completado`);

            return {
                tournament: {
                    id: completedTournament.id,
                    name: completedTournament.name,
                    isCompleted: completedTournament.isCompleted,
                    endDate: completedTournament.endDate
                },
                results: tournamentResults,
                totalParticipants: sortedPlayers.length,
                totalPoints: tournamentPoints.length,
                winner: sortedPlayers[0] || null
            };
        });

        // Log de auditoría
        console.log(`✅ Finalización de torneo completada:`, {
            tournamentId,
            participantsCount: result.totalParticipants,
            winner: result.winner?.playerNickname,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            message: `Torneo finalizado exitosamente`,
            data: result
        });

    } catch (error) {
        console.error("❌ Error finalizando torneo:", error);

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

// GET para obtener información del torneo y participantes antes de finalizar
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tournamentId = parseInt(id);

        if (isNaN(tournamentId)) {
            return NextResponse.json(
                { error: "ID de torneo inválido" },
                { status: 400 }
            );
        }

        // Obtener información del torneo
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: {
                id: true,
                name: true,
                type: true,
                startDate: true,
                endDate: true,
                isCompleted: true,
                deleted: true
            }
        });

        if (!tournament || tournament.deleted) {
            return NextResponse.json(
                { error: "Torneo no encontrado" },
                { status: 404 }
            );
        }

        // Obtener participantes y sus puntos
        const tournamentPoints = await prisma.points.findMany({
            where: {
                tournamentId,
                pointsType: 'SEASON',
                deleted: false
            },
            include: {
                player: {
                    select: { id: true, nickname: true }
                }
            }
        });

        // Agrupar por jugador
        const playerTotals = new Map<number, {
            playerId: number;
            playerNickname: string;
            totalPoints: number;
            gamesPlayed: number;
        }>();

        for (const point of tournamentPoints) {
            const current = playerTotals.get(point.playerId) || {
                playerId: point.playerId,
                playerNickname: point.player.nickname,
                totalPoints: 0,
                gamesPlayed: 0
            };

            current.totalPoints += Number(point.pointsValue);
            current.gamesPlayed += 1;
            playerTotals.set(point.playerId, current);
        }

        // Ordenar por puntos
        const participants = Array.from(playerTotals.values())
            .sort((a, b) => b.totalPoints - a.totalPoints);

        // Contar juegos únicos del torneo
        const gamesCount = await prisma.game.count({
            where: {
                tournamentId,
                deleted: false
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                tournament: {
                    ...tournament,
                    participantsCount: participants.length,
                    gamesCount
                },
                participants
            }
        });

    } catch (error) {
        console.error("Error obteniendo información del torneo:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Error interno del servidor"
            },
            { status: 500 }
        );
    }
}
