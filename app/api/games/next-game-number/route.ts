import { prisma } from "@/lib/database/client";
import { ensureGameSubmit } from "@/lib/server-authorization";
import { PendingGameStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

;

export async function GET(request: NextRequest) {
    try {
        const authz = await ensureGameSubmit();
        if ("error" in authz) return authz.error;

        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date");

        if (!date) {
            return NextResponse.json(
                { error: "Fecha es requerida" },
                { status: 400 }
            );
        }

        // Validar formato de fecha
        const gameDate = new Date(date);
        if (isNaN(gameDate.getTime())) {
            return NextResponse.json(
                { error: "Formato de fecha inválido" },
                { status: 400 }
            );
        }

        // Debug: Ver cómo se están manejando las fechas
        const dateStart = new Date(gameDate.getFullYear(), gameDate.getMonth(), gameDate.getDate());
        const dateEnd = new Date(gameDate.getFullYear(), gameDate.getMonth(), gameDate.getDate() + 1);
        console.log('🔍 Debug dates:', {
            originalDate: date,
            parsedGameDate: gameDate.toISOString(),
            dateStart: dateStart.toISOString(),
            dateEnd: dateEnd.toISOString()
        });

        // Buscar juegos pendientes válidos (PENDING o VALIDATED) y juegos regulares para esa fecha
        const whereClause = {
            gameDate: new Date(date + 'T00:00:00.000Z'), // Usar la fecha directamente
            status: { in: [PendingGameStatus.PENDING, PendingGameStatus.VALIDATED] }, // Solo contar los que no están rechazados
            deleted: false
        };

        console.log('🔍 Debug where clause:', JSON.stringify(whereClause, null, 2));

        const pendingGames = await prisma.pendingGame.findMany({
            where: whereClause,
            select: {
                nroJuegoDia: true,
                gameDate: true,
                status: true,
                deleted: true,
                id: true
            }
        });

        // Buscar juegos regulares para esa fecha
        // Nota: El modelo Game parece no tener nroJuegoDia, así que omitimos esta consulta por ahora
        const regularGames: { nroJuegoDia: number | null }[] = [];

        // Obtener números de juegos existentes (pendientes + regulares)
        const pendingNumbers = pendingGames.map(g => g.nroJuegoDia).filter(n => n !== null);
        const regularNumbers = regularGames.map(g => g.nroJuegoDia).filter(n => n !== null);
        const existingNumbers = new Set([...pendingNumbers, ...regularNumbers]);

        // Debug: Log para ver qué está pasando
        console.log('🔍 Debug next-game-number:', {
            date: date,
            pendingGamesFound: pendingGames.length,
            pendingGamesDetails: pendingGames,
            pendingNumbers,
            existingNumbers: Array.from(existingNumbers)
        });

        // Encontrar el siguiente número disponible
        let nextNumber = 1;
        while (existingNumbers.has(nextNumber)) {
            nextNumber++;
        }

        // Encontrar gaps (números faltantes en la secuencia)
        const sortedNumbers = Array.from(existingNumbers).filter((n): n is number => n !== null).sort((a, b) => a - b);
        const gaps: number[] = [];
        for (let i = 1; i < nextNumber; i++) {
            if (!existingNumbers.has(i)) {
                gaps.push(i);
            }
        }

        return NextResponse.json({
            nextNumber,
            existingNumbers: sortedNumbers,
            gaps,
            hasGaps: gaps.length > 0,
            date: date
        });

    } catch (error) {
        console.error("Error obteniendo siguiente número de juego:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

// Endpoint para validar si un número específico está disponible
export async function POST(request: NextRequest) {
    try {
        const authz = await ensureGameSubmit();
        if ("error" in authz) return authz.error;

        const { date, gameNumber } = await request.json();

        if (!date || !gameNumber) {
            return NextResponse.json(
                { error: "Fecha y número de juego son requeridos" },
                { status: 400 }
            );
        }

        const gameDate = new Date(date);
        if (isNaN(gameDate.getTime())) {
            return NextResponse.json(
                { error: "Formato de fecha inválido" },
                { status: 400 }
            );
        }

        // Verificar si el número ya existe en juegos pendientes válidos
        const existingPendingGame = await prisma.pendingGame.findFirst({
            where: {
                gameDate: new Date(date + 'T00:00:00.000Z'), // Usar la fecha directamente
                nroJuegoDia: gameNumber,
                status: { in: [PendingGameStatus.PENDING, PendingGameStatus.VALIDATED] }, // Solo contar los que no están rechazados
                deleted: false
            }
        });

        // Verificar si el número ya existe en juegos regulares
        // Nota: El modelo Game parece no tener nroJuegoDia, así que solo verificamos pending games
        const existingRegularGame = null;

        const isAvailable = !existingPendingGame && !existingRegularGame;

        // Debug: Log para ver qué está pasando en la validación
        console.log('🔍 Debug game-number validation:', {
            date: date,
            gameNumber,
            existingPendingGame: existingPendingGame ? { id: existingPendingGame.id, nroJuegoDia: existingPendingGame.nroJuegoDia } : null,
            isAvailable
        });

        return NextResponse.json({
            available: isAvailable,
            gameNumber,
            date
        });

    } catch (error) {
        console.error("Error validando número de juego:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
