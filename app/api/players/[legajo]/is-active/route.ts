import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

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

        // Buscar el jugador
        const player = await prisma.player.findUnique({
            where: { playerNumber: legajo },
            select: { id: true, nickname: true }
        });

        if (!player) {
            return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
        }

        // Obtener la temporada activa actual
        const activeSeason = await prisma.season.findFirst({
            where: { isActive: true },
            select: { id: true, name: true }
        });

        let isActive = false;
        let reason = "";

        if (activeSeason) {
            // Verificar si el jugador tiene juegos en la temporada activa
            const gamesInActiveSeason = await prisma.gameResult.count({
                where: {
                    playerId: player.id,
                    game: {
                        tournament: {
                            seasonId: activeSeason.id
                        }
                    }
                }
            });

            if (gamesInActiveSeason > 0) {
                isActive = true;
                reason = `Tiene ${gamesInActiveSeason} juego(s) en la temporada activa (${activeSeason.name})`;
            }
        }

        // Si no está activo en la temporada actual, verificar último año
        if (!isActive) {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const gamesInLastYear = await prisma.gameResult.count({
                where: {
                    playerId: player.id,
                    game: {
                        gameDate: {
                            gte: oneYearAgo
                        }
                    }
                }
            });

            if (gamesInLastYear > 0) {
                isActive = true;
                reason = `Tiene ${gamesInLastYear} juego(s) en el último año`;
            } else {
                reason = "No tiene juegos en la temporada activa ni en el último año";
            }
        }

        return NextResponse.json({
            playerId: player.id,
            playerNumber: legajo,
            nickname: player.nickname,
            isActive,
            reason,
            activeSeason: activeSeason ? {
                id: activeSeason.id,
                name: activeSeason.name
            } : null
        });

    } catch (error) {
        console.error("Error checking player activity:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
