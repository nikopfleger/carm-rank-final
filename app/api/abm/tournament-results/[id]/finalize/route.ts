import { prisma } from "@/lib/database/client";
import { serializeBigInt } from '@/lib/serialize-bigint';
import { NextRequest, NextResponse } from "next/server";

// Función para cargar puntos de temporada de un torneo
async function loadTournamentSeasonPoints(tournamentId: bigint, seasonId: bigint) {
    try {
        // Obtener todos los resultados del torneo
        const tournamentResults = await prisma.tournamentResult.findMany({
            where: {
                tournamentId: tournamentId,
                deleted: false
            },
            include: {
                player: true
            }
        });

        // Crear puntos de temporada para cada resultado
        const seasonPointsData = tournamentResults.map(result => ({
            playerId: result.playerId,
            seasonId: seasonId,
            pointsValue: (result as any).pointsWon,
            description: `Puntos de torneo - Posición ${(result as any).position}`,
            pointsType: 'SEASON' as const,
            gameId: null, // IMPORTANTE: No está asociado a un juego específico, es punto de torneo
            tournamentId: tournamentId, // IMPORTANTE: Asociado al torneo, no al juego
            isSanma: false, // Por defecto, se puede ajustar según el torneo
            extraData: JSON.stringify({
                position: (result as any).position,
                source: 'tournament_finalize'
            })
        }));

        // Insertar los puntos en la tabla Points
        if (seasonPointsData.length > 0) {
            await prisma.points.createMany({
                data: seasonPointsData
            });
        }

        console.log(`Cargados ${seasonPointsData.length} puntos de temporada para el torneo ${tournamentId}`);
    } catch (error) {
        console.error("Error cargando puntos de temporada del torneo:", error);
        throw error;
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: "ID inválido" },
                { status: 400 }
            );
        }

        // Verificar que el torneo existe
        const tournament = await prisma.tournament.findUnique({
            where: { id }
        });

        if (!tournament) {
            return NextResponse.json(
                { success: false, error: "Torneo no encontrado" },
                { status: 404 }
            );
        }

        if (tournament.deleted) {
            return NextResponse.json(
                { success: false, error: "No se puede finalizar un torneo eliminado" },
                { status: 400 }
            );
        }

        if (tournament.isCompleted) {
            return NextResponse.json(
                { success: false, error: "El torneo ya está finalizado" },
                { status: 400 }
            );
        }

        // Verificar que tiene resultados
        const resultsCount = await prisma.tournamentResult.count({
            where: {
                tournamentId: id,
                deleted: false
            }
        });

        if (resultsCount === 0) {
            return NextResponse.json(
                { success: false, error: "No se puede finalizar un torneo sin resultados" },
                { status: 400 }
            );
        }

        // Ejecutar finalización en transacción
        const result = await prisma.$transaction(async (tx) => {
            // 1. Finalizar el torneo
            const updatedTournament = await tx.tournament.update({
                where: { id },
                data: {
                    isCompleted: true,
                    endDate: tournament.endDate || new Date().toISOString().split('T')[0]
                }
            });

            // 2. Cargar puntos de temporada si el torneo tiene temporada asociada
            if (tournament.seasonId) {
                await loadTournamentSeasonPoints(BigInt(id), tournament.seasonId);
            }

            return updatedTournament;
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: "Torneo finalizado correctamente. Los puntos de temporada han sido cargados."
        });
    } catch (error) {
        console.error("Error finalizing tournament:", error);
        return NextResponse.json(
            { success: false, error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
