// app/api/players/count-games/route.ts
;

import { prisma } from '@/lib/database/client';

export const dynamic = 'force-dynamic';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const type = (searchParams.get('type') as 'GENERAL' | 'TEMPORADA') || 'GENERAL';
    const sanmaStr = searchParams.get('sanma'); // 'true' | 'false' | null
    const sanmaVal = sanmaStr === 'true' ? true : sanmaStr === 'false' ? false : null;

    // 1) Cláusulas dinámicas
    const clauses: Prisma.Sql[] = [
      Prisma.sql`g.is_validated = true`,
      Prisma.sql`g.deleted = false`,
    ];

    if (sanmaVal !== null) {
      clauses.push(Prisma.sql`r.sanma = ${sanmaVal}`);
    }

    if (type === 'TEMPORADA') {
      clauses.push(Prisma.sql`g.season_id IS NOT NULL`);
      clauses.push(Prisma.sql`g.tournament_id IS NOT NULL`);
    }

    if (!includeInactive) {
      clauses.push(Prisma.sql`
        EXISTS (
          SELECT 1
          FROM active_players ap
          JOIN game_result gr2
            ON gr2.game_id = g.id
           AND gr2.player_id = ap.player_id
        )
      `);
    }

    // 2) WHERE final
    const whereSql =
      clauses.length ? Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}` : Prisma.empty;

    // 3) Query única con CTEs
    const rows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      WITH s AS (
        SELECT start_date, COALESCE(end_date, NOW()) AS end_date
        FROM season
        WHERE is_active = true
        ORDER BY start_date DESC
        LIMIT 1
      ),
      active_players AS (
        SELECT DISTINCT gr.player_id
        FROM game_result gr
        JOIN game g2 ON g2.id = gr.game_id
        WHERE
          (EXISTS (SELECT 1 FROM s)
            AND g2.game_date BETWEEN (SELECT start_date FROM s) AND (SELECT end_date FROM s))
          OR g2.game_date >= NOW() - INTERVAL '1 year'
      )
      SELECT COUNT(DISTINCT g.id) AS count
      FROM game g
      LEFT JOIN ruleset r ON r.id = g.ruleset_id
      ${whereSql}
    `);

    // 4) bigint -> number (si esperás volúmenes enormes, podrías devolver string)
    const totalUniqueGames = rows.length ? Number(rows[0].count) : 0;

    return NextResponse.json({
      success: true,
      totalUniqueGames,
      message: `Found ${totalUniqueGames} unique games`,
    });
  } catch (error) {
    console.error('Error in GET /api/players/count-games:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to count games', message: (error as Error).message },
      { status: 500 }
    );
  }
}
