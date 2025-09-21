import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

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
            // 1. Eliminar resultados existentes del torneo
            await tx.tournamentResult.deleteMany({
                where: { tournamentId: parseInt(tournamentId) }
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

            // 3. Actualizar estadísticas del torneo
            await tx.tournament.update({
                where: { id: parseInt(tournamentId) },
                data: {
                    // Si no estaba completado y ahora tiene resultados, marcarlo como completado
                    isCompleted: !tournament.isCompleted ? true : tournament.isCompleted,
                    endDate: !tournament.endDate ? new Date() : tournament.endDate
                }
            });

            return createdResults;
        });

        console.log(`✅ Resultados de torneo ${tournamentId} actualizados: ${result.length} resultados`);

        return NextResponse.json({
            success: true,
            message: `Resultados del torneo actualizados exitosamente`,
            data: {
                tournamentId: parseInt(tournamentId),
                resultsCount: result.length,
                results: result
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
