import { connectToDatabase } from '@/lib/database/connection';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/players/count-games - Count unique games with filters
export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';
        const type = searchParams.get('type') as 'GENERAL' | 'TEMPORADA' || 'GENERAL';
        const sanma = searchParams.get('sanma'); // 'true' o 'false' para filtrar por cantidad de jugadores

        const prismaClient = (await import('@/lib/database/client')).prisma;
        const { Prisma } = await import('@prisma/client');

        // Obtener jugadores activos si es necesario
        let playerIds: number[] = [];
        if (!includeInactive) {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const activeSeason = await prismaClient.season.findFirst({
                where: { isActive: true }
            });

            // Buscar jugadores activos (temporada actual O último año)
            const currentSeasonPlayers = activeSeason && activeSeason.startDate
                ? await prismaClient.gameResult.groupBy({
                    by: ['playerId'],
                    where: {
                        game: {
                            gameDate: {
                                gte: activeSeason.startDate,
                                lte: activeSeason.endDate || new Date()
                            }
                        }
                    }
                })
                : [];

            const lastYearPlayers = await prismaClient.gameResult.groupBy({
                by: ['playerId'],
                where: {
                    game: {
                        gameDate: { gte: oneYearAgo }
                    }
                }
            });

            const currentSeasonPlayerIds = new Set(currentSeasonPlayers.map(g => g.playerId));
            const lastYearPlayerIds = new Set(lastYearPlayers.map(g => g.playerId));
            const activePlayerIds = new Set([...currentSeasonPlayerIds, ...lastYearPlayerIds]);

            playerIds = Array.from(activePlayerIds);
        }

        // Construir filtros para la consulta
        const clauses: any[] = [
            Prisma.sql`g.is_validated = true`,
            Prisma.sql`g.deleted = false`
        ];

        // Filtrar por jugadores si es necesario
        if (!includeInactive && playerIds.length > 0) {
            clauses.push(Prisma.sql`EXISTS (SELECT 1 FROM carm.game_result gr WHERE gr.game_id = g.id AND gr.player_id IN (${Prisma.join(playerIds)}))`);
        }

        // Filtrar por sanma
        if (sanma !== null && sanma !== undefined) {
            clauses.push(Prisma.sql`EXISTS (SELECT 1 FROM carm.ruleset r WHERE r.id = g.ruleset_id AND r.sanma = ${sanma === 'true'})`);
        }

        // Filtrar por temporada si es necesario
        if (type === 'TEMPORADA') {
            clauses.push(Prisma.sql`g.season_id IS NOT NULL`);
            clauses.push(Prisma.sql`g.tournament_id IS NOT NULL`);
        }

        const whereSql = clauses.length ? Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}` : Prisma.empty;

        const rows = await prismaClient.$queryRaw<{ count: bigint }[]>(
            Prisma.sql`SELECT COUNT(DISTINCT g.id) AS count FROM carm.game g ${whereSql}`
        );

        const totalUniqueGames = rows.length ? Number(rows[0].count) : 0;

        return NextResponse.json({
            success: true,
            totalUniqueGames,
            message: `Found ${totalUniqueGames} unique games`
        });

    } catch (error) {
        console.error('Error in GET /api/players/count-games:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to count games',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
