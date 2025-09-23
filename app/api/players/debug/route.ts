import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

;

export async function GET(request: NextRequest) {
    try {
        // Contar total de jugadores
        const totalPlayers = await prisma.player.count();

        // Obtener algunos jugadores de ejemplo
        const samplePlayers = await prisma.player.findMany({
            take: 5,
            select: {
                id: true,
                playerNumber: true,
                nickname: true,
                fullname: true,
                deleted: true
            },
            orderBy: { playerNumber: "asc" }
        });

        // Buscar jugadores activos usando la lógica del endpoint
        const activeSeason = await prisma.season.findFirst({
            where: { isActive: true }
        });

        let activePlayers = 0;
        if (activeSeason) {
            const activeSeasonPlayers = await prisma.gameResult.groupBy({
                by: ['playerId'],
                where: {
                    game: {
                        tournament: {
                            seasonId: activeSeason.id
                        }
                    }
                }
            });
            activePlayers = activeSeasonPlayers.length;
        }

        if (activePlayers === 0) {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const lastYearPlayers = await prisma.gameResult.groupBy({
                by: ['playerId'],
                where: {
                    game: {
                        gameDate: { gte: oneYearAgo }
                    }
                }
            });
            activePlayers = lastYearPlayers.length;
        }

        return NextResponse.json({
            totalPlayers,
            activePlayers,
            samplePlayers,
            message: "Debug info de jugadores"
        });

    } catch (error) {
        console.error("Error en debug de jugadores:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
