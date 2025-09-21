import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

// Función para cargar puntos de temporada de un torneo
async function loadTournamentSeasonPoints(tournamentId: number, seasonId: number) {
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
                source: 'tournament_close'
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
        const { id } = await params;
        const tournamentId = parseInt(id);

        if (isNaN(tournamentId)) {
            return NextResponse.json(
                { error: "ID de torneo inválido" },
                { status: 400 }
            );
        }

        // Verificar que el torneo existe
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId }
        });

        if (!tournament) {
            return NextResponse.json(
                { error: "Torneo no encontrado" },
                { status: 404 }
            );
        }

        if (tournament.deleted) {
            return NextResponse.json(
                { error: "No se puede cerrar un torneo eliminado" },
                { status: 400 }
            );
        }

        if (tournament.endDate) {
            return NextResponse.json(
                { error: "El torneo ya está cerrado" },
                { status: 400 }
            );
        }

        // Cerrar el torneo estableciendo la fecha de finalización
        const updatedAtTournament = await prisma.tournament.update({
            where: { id: tournamentId },
            data: {
                endDate: new Date(),
                isCompleted: true
            }
        });

        // Cargar puntos de temporada si el torneo tiene temporada asociada
        if (tournament.seasonId) {
            await loadTournamentSeasonPoints(tournamentId, tournament.seasonId);
        }

        return NextResponse.json({
            success: true,
            message: "Torneo cerrado exitosamente",
            tournament: updatedAtTournament
        });

    } catch (error) {
        console.error("Error cerrando torneo:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
