import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

;

// Tipo para el juego pendiente con todas las relaciones incluidas
type PendingGameWithRelations = {
  id: number;
  gameDate: Date;
  nroJuegoDia: number | null;
  venue: string | null;
  duration: any;
  sanma: boolean;
  seasonId: number | null;
  rulesetId: number;
  imageUrl: string | null;
  imageFileName: string | null;
  imageFormat: string | null;
  player1Id: number;
  player1Wind: string | null;
  player1OorasuScore: number | null;
  player1GameScore: number;
  player1Chonbos: number;
  player1FinalScore: any | null;
  player2Id: number;
  player2Wind: string | null;
  player2OorasuScore: number | null;
  player2GameScore: number;
  player2Chonbos: number;
  player2FinalScore: any | null;
  player3Id: number;
  player3Wind: string | null;
  player3OorasuScore: number | null;
  player3GameScore: number;
  player3Chonbos: number;
  player3FinalScore: any | null;
  player4Id: number | null;
  player4Wind: string | null;
  player4OorasuScore: number | null;
  player4GameScore: number | null;
  player4Chonbos: number | null;
  player4FinalScore: any | null;
  status: any;
  submittedBy: number | null;
  validatedBy: number | null;
  validatedAt: Date | null;
  rejectedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  ruleset: {
    id: number;
    name: string;
    inPoints: number;
    outPoints: number;
    oka: number;
    chonbo: number;
    uma: {
      firstPlace: number;
      secondPlace: number;
      thirdPlace: number;
      fourthPlace: number;
    };
  };
  season: {
    id: number;
    name: string;
  } | null;
  player1: {
    playerId: number;
    nickname: string;
    fullname: string;
  };
  player2: {
    playerId: number;
    nickname: string;
    fullname: string;
  };
  player3: {
    playerId: number;
    nickname: string;
    fullname: string;
  };
  player4: {
    playerId: number;
    nickname: string;
    fullname: string;
  } | null;
};

export async function GET(request: NextRequest) {
  try {
    const pendingGamesRaw = await (prisma.pendingGame.findMany({
      where: {
        deleted: false,
        status: 'PENDING' // Solo juegos pendientes
      },
      include: {
        ruleset: {
          include: { uma: true }
        },
        season: true,
        player1: true,
        player2: true,
        player3: true,
        player4: true
      }
    } as any));

    // Ordenar manualmente para manejar nroJuegoDia con nulos al final
    const pendingGames = (pendingGamesRaw as unknown as PendingGameWithRelations[]).sort((a, b) => {
      // Primero por fecha (más viejo a más nuevo)
      const dateComparison = a.gameDate.getTime() - b.gameDate.getTime();
      if (dateComparison !== 0) return dateComparison;

      // Luego por número de juego (nulos al final)
      if (a.nroJuegoDia === null && b.nroJuegoDia === null) {
        // Si ambos son null, ordenar por createdAt
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
      if (a.nroJuegoDia === null) return 1; // a va después
      if (b.nroJuegoDia === null) return -1; // b va después

      const gameNumberComparison = a.nroJuegoDia - b.nroJuegoDia;
      if (gameNumberComparison !== 0) return gameNumberComparison;

      // Finalmente por fecha de creación como tiebreaker
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Transformar datos para el componente
    const transformedGames = pendingGames.map(game => {
      const players = [
        {
          id: game.player1.playerId, // Usar playerId (legajo) en lugar de id (primary key)
          nickname: game.player1.nickname,
          fullname: game.player1.fullname,
          wind: game.player1Wind,
          oorasuScore: game.player1OorasuScore,
          gameScore: game.player1GameScore,
          chonbos: game.player1Chonbos,
          finalScore: game.player1FinalScore ? parseFloat(game.player1FinalScore.toString()) : null
        },
        {
          id: game.player2.playerId, // Usar playerId (legajo) en lugar de id (primary key)
          nickname: game.player2.nickname,
          fullname: game.player2.fullname,
          wind: game.player2Wind,
          oorasuScore: game.player2OorasuScore,
          gameScore: game.player2GameScore,
          chonbos: game.player2Chonbos,
          finalScore: game.player2FinalScore ? parseFloat(game.player2FinalScore.toString()) : null
        },
        {
          id: game.player3.playerId, // Usar playerId (legajo) en lugar de id (primary key)
          nickname: game.player3.nickname,
          fullname: game.player3.fullname,
          wind: game.player3Wind,
          oorasuScore: game.player3OorasuScore,
          gameScore: game.player3GameScore,
          chonbos: game.player3Chonbos,
          finalScore: game.player3FinalScore ? parseFloat(game.player3FinalScore.toString()) : null
        }
      ];

      // Agregar jugador 4 si no es sanma
      if (!game.sanma && game.player4) {
        players.push({
          id: game.player4.playerId, // Usar playerId (legajo) en lugar de id (primary key)
          nickname: game.player4.nickname,
          fullname: game.player4.fullname,
          wind: game.player4Wind,
          oorasuScore: game.player4OorasuScore,
          gameScore: game.player4GameScore || 0,
          chonbos: game.player4Chonbos || 0,
          finalScore: game.player4FinalScore ? parseFloat(game.player4FinalScore.toString()) : null
        });
      }

      return {
        id: game.id,
        gameDate: game.gameDate,
        nroJuegoDia: game.nroJuegoDia,
        venue: game.venue,
        duration: game.duration,
        sanma: game.sanma,
        seasonId: game.seasonId || null,
        seasonName: game.season?.name || 'Sin temporada',
        imageUrl: game.imageUrl,
        status: game.status,
        createdAt: game.createdAt,
        ruleset: {
          id: game.ruleset.id,
          name: game.ruleset.name,
          inPoints: game.ruleset.inPoints,
          outPoints: game.ruleset.outPoints,
          oka: game.ruleset.oka,
          chonbo: game.ruleset.chonbo,
          uma: {
            firstPlace: game.ruleset.uma.firstPlace,
            secondPlace: game.ruleset.uma.secondPlace,
            thirdPlace: game.ruleset.uma.thirdPlace,
            fourthPlace: game.ruleset.uma.fourthPlace
          }
        },
        players
      };
    });

    return NextResponse.json({
      success: true,
      games: transformedGames
    });

  } catch (error) {
    console.error('Error fetching pending games:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
