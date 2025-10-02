import { prisma } from '@/lib/database/client';
import { unstable_noStore as noStore } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  noStore();

  try {
    const pendingGames = await prisma.pendingGame.findMany({
      where: { deleted: false, status: 'PENDING' },
      orderBy: [
        { gameDate: 'asc' },
        // @ts-ignore: prisma supports nulls option in SQL dialects that allow it
        { nroJuegoDia: { sort: 'asc', nulls: 'last' } as any },
        { createdAt: 'asc' }
      ],
      include: {
        ruleset: { include: { uma: true } },
        season: true,
        location: true,
        player1: true,
        player2: true,
        player3: true,
        player4: true
      }
    });

    const games = pendingGames.map((pg: any) => ({
      id: pg.id,
      gameDate: pg.gameDate instanceof Date ? pg.gameDate.toISOString() : pg.gameDate,
      nroJuegoDia: pg.nroJuegoDia ?? null,
      venue: pg.location?.name ?? null,
      duration: pg.duration,
      sanma: pg.sanma,
      seasonId: pg.seasonId ?? null,
      seasonName: pg.season?.name ?? null,
      imageUrl: pg.imageUrl ?? null,
      status: pg.status,
      createdAt: pg.createdAt instanceof Date ? pg.createdAt.toISOString() : pg.createdAt,
      ruleset: {
        id: pg.ruleset.id,
        name: pg.ruleset.name,
        inPoints: pg.ruleset.inPoints,
        outPoints: pg.ruleset.outPoints,
        oka: pg.ruleset.oka,
        chonbo: pg.ruleset.chonbo,
        uma: {
          firstPlace: pg.ruleset.uma.firstPlace,
          secondPlace: pg.ruleset.uma.secondPlace,
          thirdPlace: pg.ruleset.uma.thirdPlace,
          fourthPlace: pg.ruleset.uma.fourthPlace ?? null,
        },
      },
      players: [
        pg.player1 ? {
          id: pg.player1.id,
          nickname: pg.player1.nickname || pg.player1.fullname,
          fullname: pg.player1.fullname || null,
          wind: pg.player1Wind ?? null,
          oorasuScore: pg.player1OorasuScore ?? null,
          gameScore: pg.player1GameScore,
          chonbo: pg.player1Chonbos ?? 0,
          chonbos: pg.player1Chonbos ?? 0,
          finalScore: pg.player1FinalScore ?? null,
          finalPosition: pg.player1FinalPosition ?? null,
        } : null,
        pg.player2 ? {
          id: pg.player2.id,
          nickname: pg.player2.nickname || pg.player2.fullname,
          fullname: pg.player2.fullname || null,
          wind: pg.player2Wind ?? null,
          oorasuScore: pg.player2OorasuScore ?? null,
          gameScore: pg.player2GameScore,
          chonbo: pg.player2Chonbos ?? 0,
          chonbos: pg.player2Chonbos ?? 0,
          finalScore: pg.player2FinalScore ?? null,
          finalPosition: pg.player2FinalPosition ?? null,
        } : null,
        pg.player3 ? {
          id: pg.player3.id,
          nickname: pg.player3.nickname || pg.player3.fullname,
          fullname: pg.player3.fullname || null,
          wind: pg.player3Wind ?? null,
          oorasuScore: pg.player3OorasuScore ?? null,
          gameScore: pg.player3GameScore,
          chonbo: pg.player3Chonbos ?? 0,
          chonbos: pg.player3Chonbos ?? 0,
          finalScore: pg.player3FinalScore ?? null,
          finalPosition: pg.player3FinalPosition ?? null,
        } : null,
        (!pg.sanma && pg.player4) ? {
          id: pg.player4.id,
          nickname: pg.player4.nickname || pg.player4.fullname,
          fullname: pg.player4.fullname || null,
          wind: pg.player4Wind ?? null,
          oorasuScore: pg.player4OorasuScore ?? null,
          gameScore: pg.player4GameScore,
          chonbo: pg.player4Chonbos ?? 0,
          chonbos: pg.player4Chonbos ?? 0,
          finalScore: pg.player4FinalScore ?? null,
          finalPosition: pg.player4FinalPosition ?? null,
        } : null,
      ].filter(Boolean),
    }));

    return NextResponse.json(
      { success: true, games },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching pending games:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
