import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

;

interface SeasonResultInput {
    id?: number;
    seasonId: number;
    playerId: number;
    isSanma: boolean;
    seasonTotalGames: number;
    seasonAveragePosition: number;
    seasonFirstPlaceH: number;
    seasonSecondPlaceH: number;
    seasonThirdPlaceH: number;
    seasonFourthPlaceH: number;
    seasonFirstPlaceT: number;
    seasonSecondPlaceT: number;
    seasonThirdPlaceT: number;
    seasonFourthPlaceT: number;
    seasonPoints: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { seasonId, results } = body;

        // Validar campos requeridos
        if (!seasonId || !Array.isArray(results)) {
            return NextResponse.json(
                { error: "Faltan campos requeridos: seasonId, results" },
                { status: 400 }
            );
        }

        // Validar que la temporada existe
        const season = await prisma.season.findUnique({
            where: { id: parseInt(seasonId) }
        });

        if (!season) {
            return NextResponse.json(
                { error: "La temporada especificada no existe" },
                { status: 400 }
            );
        }

        // Nota: Los resultados de temporada normalmente se generan automáticamente
        // al cerrar una temporada. Esta API es principalmente para casos especiales
        // o correcciones manuales durante migraciones.

        // Permitir edición de temporadas cerradas o que ya tengan resultados
        // (útil para correcciones durante migración)
        if (!season.isClosed) {
            // Para temporadas activas, verificar que ya tengan resultados existentes
            const existingResults = await prisma.seasonResult.findFirst({
                where: { seasonId: parseInt(seasonId) }
            });

            if (!existingResults) {
                return NextResponse.json(
                    {
                        error: "No se pueden crear resultados para una temporada activa sin resultados previos",
                        message: "Los resultados se generan automáticamente al cerrar la temporada"
                    },
                    { status: 400 }
                );
            }
        }

        // Validar resultados
        const validationErrors: string[] = [];
        const playerModeKeys = new Set<string>();

        results.forEach((result: SeasonResultInput, index: number) => {
            if (!result.playerId || result.playerId === 0) {
                validationErrors.push(`Resultado ${index + 1}: Debe especificar un jugador`);
            }

            const playerModeKey = `${result.playerId}-${result.isSanma}`;
            if (playerModeKeys.has(playerModeKey)) {
                validationErrors.push(`Resultado ${index + 1}: El jugador ya tiene resultados para este modo de juego`);
            } else {
                playerModeKeys.add(playerModeKey);
            }

            if (result.seasonTotalGames < 0) {
                validationErrors.push(`Resultado ${index + 1}: Los juegos totales no pueden ser negativos`);
            }

            const maxPosition = result.isSanma ? 3 : 4;
            if (result.seasonAveragePosition < 1 || result.seasonAveragePosition > maxPosition) {
                validationErrors.push(`Resultado ${index + 1}: El promedio de posición debe estar entre 1 y ${maxPosition} para ${result.isSanma ? '3 jugadores (Sanma)' : '4 jugadores'}`);
            }
        });

        if (validationErrors.length > 0) {
            return NextResponse.json(
                { error: "Errores de validación", details: validationErrors },
                { status: 400 }
            );
        }

        // Verificar que todos los jugadores existen
        const playerIds = [...new Set(results.map((r: SeasonResultInput) => r.playerId))];
        const existingPlayers = await prisma.player.findMany({
            where: { id: { in: playerIds } },
            select: { id: true }
        });

        if (existingPlayers.length !== playerIds.length) {
            const existingPlayerIds = existingPlayers.map(p => p.id);
            const missingPlayerIds = playerIds.filter(id => !existingPlayerIds.includes(id));
            return NextResponse.json(
                { error: `Los siguientes jugadores no existen: ${missingPlayerIds.join(', ')}` },
                { status: 400 }
            );
        }

        // Ejecutar en transacción
        const result = await prisma.$transaction(async (tx) => {
            // 1. Eliminar resultados existentes de la temporada
            await tx.seasonResult.deleteMany({
                where: { seasonId: parseInt(seasonId) }
            });

            // 2. Crear nuevos resultados
            const createdResults = [];
            for (const resultData of results) {
                const seasonResult = await tx.seasonResult.create({
                    data: {
                        seasonId: parseInt(seasonId),
                        playerId: resultData.playerId,
                        isSanma: resultData.isSanma,
                        seasonTotalGames: resultData.seasonTotalGames,
                        seasonAveragePosition: resultData.seasonAveragePosition,
                        seasonFirstPlaceH: resultData.seasonFirstPlaceH,
                        seasonSecondPlaceH: resultData.seasonSecondPlaceH,
                        seasonThirdPlaceH: resultData.seasonThirdPlaceH,
                        seasonFourthPlaceH: resultData.seasonFourthPlaceH,
                        seasonFirstPlaceT: resultData.seasonFirstPlaceT,
                        seasonSecondPlaceT: resultData.seasonSecondPlaceT,
                        seasonThirdPlaceT: resultData.seasonThirdPlaceT,
                        seasonFourthPlaceT: resultData.seasonFourthPlaceT,
                        seasonPoints: resultData.seasonPoints
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

                createdResults.push(seasonResult);
            }

            return createdResults;
        });

        console.log(`✅ Resultados de temporada ${seasonId} actualizados: ${result.length} resultados`);

        return NextResponse.json({
            success: true,
            message: `Resultados de la temporada actualizados exitosamente`,
            data: {
                seasonId: parseInt(seasonId),
                resultsCount: result.length,
                results: result
            }
        });

    } catch (error) {
        console.error("❌ Error actualizando resultados de temporada:", error);

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
