import { prisma } from '@/lib/database/client';
import { cleanupImage } from '@/lib/image-cleanup-simple';
import { ensureGameValidate } from '@/lib/server-authorization';
import { emailNotificationService } from '@/lib/services/email-notification-service';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// 🚨 CONFIGURACIÓN GLOBAL DE VALORES INICIALES - NO TOCAR
// ============================================================================
const INITIAL_DAN_POINTS = 0;      // Dan inicia en 0
const INITIAL_RATE_POINTS = 1500;  // Rate inicia en 1500
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación y permisos
    const authz = await ensureGameValidate();
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const pendingGameId = parseInt(id);

    if (isNaN(pendingGameId)) {
      return NextResponse.json(
        { success: false, message: 'ID de juego inválido' },
        { status: 400 }
      );
    }

    // 0) Traer pendingGame + relaciones
    const pendingGame = await prisma.pendingGame.findUnique({
      where: { id: pendingGameId },
      include: {
        ruleset: { include: { uma: true } },
        location: true,
        player1: true,
        player2: true,
        player3: true,
        player4: true
      }
    });

    if (!pendingGame) {
      return NextResponse.json(
        { success: false, message: 'Juego pendiente no encontrado' },
        { status: 404 }
      );
    }

    if (pendingGame.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, message: 'El juego ya fue procesado' },
        { status: 400 }
      );
    }

    // 0.1) Respetar orden de aprobación
    const firstPendingGame = await prisma.pendingGame.findFirst({
      where: { status: 'PENDING' },
      orderBy: [{ gameDate: 'asc' }, { createdAt: 'asc' }]
    });
    if (!firstPendingGame || firstPendingGame.id !== pendingGameId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Solo se puede aprobar el primer juego en orden. Debe respetar el orden por fecha y número de juego.'
        },
        { status: 400 }
      );
    }

    // ===============================
    // 🎯 REGLA DE TEMPORADA
    // ===============================
    // Si el juego trae seasonId, debe existir y estar activa.
    // Si NO trae seasonId, NO actualizamos Dan/Rate/Points/maxRate, pero sí contadores/avg en GENERAL (seasonId=null).
    const selectedSeasonId: number | null = (pendingGame as any).seasonId ?? null;

    let shouldUpdateRatings = false;
    if (selectedSeasonId !== null) {
      const selectedSeason = await prisma.season.findUnique({
        where: { id: selectedSeasonId }
      });
      if (!selectedSeason || !selectedSeason.isActive) {
        return NextResponse.json(
          { success: false, message: 'La temporada seleccionada no existe o no está activa' },
          { status: 400 }
        );
      }
      shouldUpdateRatings = true;
    }

    // 1) Datos base del juego (NO persistimos aún: lo haremos dentro de la transacción)
    const gameData: any = {
      gameDate: pendingGame.gameDate,
      gameType: pendingGame.duration === 'HANCHAN' ? 'HANCHAN' : 'TONPUUSEN',
      rulesetId: pendingGame.rulesetId,
      locationId: pendingGame.locationId || 1, // Usar locationId del pendingGame o Club CAMR por defecto
      isValidated: true,
      // ⚠️ NO incluir imageUrl - es temporal solo para validación
      extraData: {
        nroJuegoDia: (pendingGame as any).nroJuegoDia,
        source: 'pending_game_approval'
      }
    };
    if (selectedSeasonId !== null) {
      gameData.seasonId = selectedSeasonId;
    }
    if ((pendingGame as any).tournamentId !== null) {
      gameData.tournamentId = (pendingGame as any).tournamentId;
    }

    // 2) Armar jugadores (3 o 4 según sanma)
    const players = [
      {
        id: pendingGame.player1.id,
        finalScore: (pendingGame as any).player1FinalScore
          ? parseFloat((pendingGame as any).player1FinalScore.toString())
          : 0,
        originalPosition: 1
      },
      {
        id: pendingGame.player2.id,
        finalScore: (pendingGame as any).player2FinalScore
          ? parseFloat((pendingGame as any).player2FinalScore.toString())
          : 0,
        originalPosition: 2
      },
      {
        id: pendingGame.player3.id,
        finalScore: (pendingGame as any).player3FinalScore
          ? parseFloat((pendingGame as any).player3FinalScore.toString())
          : 0,
        originalPosition: 3
      }
    ];
    if (!pendingGame.sanma && pendingGame.player4) {
      players.push({
        id: pendingGame.player4.id,
        finalScore: (pendingGame as any).player4FinalScore
          ? parseFloat((pendingGame as any).player4FinalScore.toString())
          : 0,
        originalPosition: 4
      });
    }

    // 3) Para logs
    const playerScoresForLogs = players.map(p => ({ id: p.id, finalScore: p.finalScore }));

    // 4) Ranking actual por jugador+sanma (una sola fila)
    const playerRankingsRaw = await prisma.playerRanking.findMany({
      where: {
        playerId: { in: players.map(p => p.id) },
        isSanma: pendingGame.sanma,
      }
    });
    const rankingsMap = new Map<number, any>();
    for (const r of playerRankingsRaw) rankingsMap.set(r.playerId, r);

    // 5) Promedio de mesa (para Rate)
    const currentRates = players.map(p => {
      const ranking = rankingsMap.get(p.id);
      return ranking ? ranking.ratePoints : INITIAL_RATE_POINTS;
    });
    const averageTableRate =
      currentRates.reduce((sum: number, r: number) => sum + r, 0) / currentRates.length;

    // 6) UMA del ruleset
    const umaValues = [
      pendingGame.ruleset.uma.firstPlace,
      pendingGame.ruleset.uma.secondPlace,
      pendingGame.ruleset.uma.thirdPlace,
      pendingGame.ruleset.uma.fourthPlace || 0
    ];

    // 7) Calcular posiciones y nuevos Dan/Rate (aunque luego se “gateen”)

    // Usar calculateGameResults centralizado para todos los cálculos
    const { calculateGameResults } = await import('@/lib/game-calculations');

    const gameType = pendingGame.duration === 'HANCHAN' ? 'H' : 'T';
    const isSanma = pendingGame.sanma;

    // Determinar si el juego es elegible para season points (tiene torneo Y temporada)
    const seasonEligible = !!(pendingGame as any).tournamentId && selectedSeasonId !== null;

    // Preparar datos para calculateGameResults
    const playerScores = players.map(p => ({ id: p.id, finalScore: p.finalScore }));
    const currentRankings = new Map();

    for (const player of players) {
      const ranking = rankingsMap.get(player.id);
      currentRankings.set(player.id, {
        danPoints: ranking ? ranking.danPoints : INITIAL_DAN_POINTS,
        ratePoints: ranking ? ranking.ratePoints : INITIAL_RATE_POINTS,
        totalGames: ranking ? ranking.totalGames : 0,
        seasonPoints: ranking ? ranking.seasonPoints : 0
      });
    }

    const calculatedResults = calculateGameResults(
      playerScores,
      gameType,
      currentRankings,
      averageTableRate,
      isSanma,
      seasonEligible
    );

    // 8) Preparar payloads para rankings (no dependen de gameId)
    const rankingsToUpdate: any[] = [];
    for (const result of await calculatedResults) {
      const ranking = rankingsMap.get(result.playerId);
      const isH = pendingGame.duration === 'HANCHAN';
      const isT = !isH;

      const current = {
        totalGames: ranking ? ranking.totalGames : 0,
        firstPlaceH: ranking ? ranking.firstPlaceH : 0,
        secondPlaceH: ranking ? ranking.secondPlaceH : 0,
        thirdPlaceH: ranking ? ranking.thirdPlaceH : 0,
        fourthPlaceH: ranking ? ranking.fourthPlaceH : 0,
        firstPlaceT: ranking ? ranking.firstPlaceT : 0,
        secondPlaceT: ranking ? ranking.secondPlaceT : 0,
        thirdPlaceT: ranking ? ranking.thirdPlaceT : 0,
        fourthPlaceT: ranking ? ranking.fourthPlaceT : 0,
        danPoints: ranking ? ranking.danPoints : INITIAL_DAN_POINTS,
        ratePoints: ranking ? ranking.ratePoints : INITIAL_RATE_POINTS,
        maxRate: ranking ? ranking.maxRate : INITIAL_RATE_POINTS
      };

      const inc = {
        firstPlaceH: isH && result.finalPosition === 1 ? 1 : 0,
        secondPlaceH: isH && result.finalPosition === 2 ? 1 : 0,
        thirdPlaceH: isH && result.finalPosition === 3 ? 1 : 0,
        fourthPlaceH: isH && result.finalPosition === 4 ? 1 : 0,
        firstPlaceT: isT && result.finalPosition === 1 ? 1 : 0,
        secondPlaceT: isT && result.finalPosition === 2 ? 1 : 0,
        thirdPlaceT: isT && result.finalPosition === 3 ? 1 : 0,
        fourthPlaceT: isT && result.finalPosition === 4 ? 1 : 0
      };

      const newCounts = {
        firstPlaceH: current.firstPlaceH + inc.firstPlaceH,
        secondPlaceH: current.secondPlaceH + inc.secondPlaceH,
        thirdPlaceH: current.thirdPlaceH + inc.thirdPlaceH,
        fourthPlaceH: current.fourthPlaceH + inc.fourthPlaceH,
        firstPlaceT: current.firstPlaceT + inc.firstPlaceT,
        secondPlaceT: current.secondPlaceT + inc.secondPlaceT,
        thirdPlaceT: current.thirdPlaceT + inc.thirdPlaceT,
        fourthPlaceT: current.fourthPlaceT + inc.fourthPlaceT
      };

      const newTotalGames =
        current.totalGames +
        inc.firstPlaceH +
        inc.secondPlaceH +
        inc.thirdPlaceH +
        inc.fourthPlaceH +
        inc.firstPlaceT +
        inc.secondPlaceT +
        inc.thirdPlaceT +
        inc.fourthPlaceT;

      const weightedSum =
        newCounts.firstPlaceH * 1 +
        newCounts.secondPlaceH * 2 +
        newCounts.thirdPlaceH * 3 +
        newCounts.fourthPlaceH * 4 +
        newCounts.firstPlaceT * 1 +
        newCounts.secondPlaceT * 2 +
        newCounts.thirdPlaceT * 3 +
        newCounts.fourthPlaceT * 4;

      const newAveragePosition =
        newTotalGames > 0 ? weightedSum / newTotalGames : 0;

      // Dan/Rate SIEMPRE se actualizan (son globales)
      const targetDan = result.newDanPoints;
      const targetRate = result.newRatePoints;
      const targetMax = Math.max(current.maxRate, result.newRatePoints);

      // Acumulados de temporada (si corresponde)
      const seasonInc = seasonEligible ? {
        seasonFirstPlaceH: (ranking?.seasonFirstPlaceH || 0) + (isH && result.finalPosition === 1 ? 1 : 0),
        seasonSecondPlaceH: (ranking?.seasonSecondPlaceH || 0) + (isH && result.finalPosition === 2 ? 1 : 0),
        seasonThirdPlaceH: (ranking?.seasonThirdPlaceH || 0) + (isH && result.finalPosition === 3 ? 1 : 0),
        seasonFourthPlaceH: (ranking?.seasonFourthPlaceH || 0) + (isH && result.finalPosition === 4 ? 1 : 0),
        seasonFirstPlaceT: (ranking?.seasonFirstPlaceT || 0) + (isT && result.finalPosition === 1 ? 1 : 0),
        seasonSecondPlaceT: (ranking?.seasonSecondPlaceT || 0) + (isT && result.finalPosition === 2 ? 1 : 0),
        seasonThirdPlaceT: (ranking?.seasonThirdPlaceT || 0) + (isT && result.finalPosition === 3 ? 1 : 0),
        seasonFourthPlaceT: (ranking?.seasonFourthPlaceT || 0) + (isT && result.finalPosition === 4 ? 1 : 0),
        seasonTotalGames: (ranking?.seasonTotalGames || 0) + 1,
        // promedio temporada recalculado más abajo
      } : null;

      let seasonAveragePosition = ranking?.seasonAveragePosition || 0;
      if (seasonInc) {
        const sw =
          seasonInc.seasonFirstPlaceH * 1 + seasonInc.seasonSecondPlaceH * 2 + seasonInc.seasonThirdPlaceH * 3 + seasonInc.seasonFourthPlaceH * 4 +
          seasonInc.seasonFirstPlaceT * 1 + seasonInc.seasonSecondPlaceT * 2 + seasonInc.seasonThirdPlaceT * 3 + seasonInc.seasonFourthPlaceT * 4;
        seasonAveragePosition = seasonInc.seasonTotalGames > 0 ? sw / seasonInc.seasonTotalGames : 0;
      }

      rankingsToUpdate.push({
        playerId: result.playerId,
        isSanma: pendingGame.sanma,
        totalGames: newTotalGames,
        averagePosition: newAveragePosition,
        danPoints: targetDan,
        ratePoints: targetRate,
        seasonPoints: seasonEligible ? result.newSeasonPoints : (ranking ? ranking.seasonPoints : 0),
        // season columns
        ...(seasonInc ? {
          seasonFirstPlaceH: seasonInc.seasonFirstPlaceH,
          seasonSecondPlaceH: seasonInc.seasonSecondPlaceH,
          seasonThirdPlaceH: seasonInc.seasonThirdPlaceH,
          seasonFourthPlaceH: seasonInc.seasonFourthPlaceH,
          seasonFirstPlaceT: seasonInc.seasonFirstPlaceT,
          seasonSecondPlaceT: seasonInc.seasonSecondPlaceT,
          seasonThirdPlaceT: seasonInc.seasonThirdPlaceT,
          seasonFourthPlaceT: seasonInc.seasonFourthPlaceT,
          seasonTotalGames: seasonInc.seasonTotalGames,
          seasonAveragePosition,
        } : {}),
        maxRate: targetMax,
        firstPlaceH: newCounts.firstPlaceH,
        secondPlaceH: newCounts.secondPlaceH,
        thirdPlaceH: newCounts.thirdPlaceH,
        fourthPlaceH: newCounts.fourthPlaceH,
        firstPlaceT: newCounts.firstPlaceT,
        secondPlaceT: newCounts.secondPlaceT,
        thirdPlaceT: newCounts.thirdPlaceT,
        fourthPlaceT: newCounts.fourthPlaceT
      });
    }

    // 9) Transacción: TODO adentro para rollback total
    let newGameId: number | null = null;

    await prisma.$transaction(async (tx) => {
      // 9.1) Crear el juego dentro de la transacción
      const createdAtGame = await tx.game.create({ data: gameData });
      newGameId = createdAtGame.id;

      // 9.2) GameResults
      const gameResultsData = (await calculatedResults).map((result) => ({
        gameId: createdAtGame.id,
        playerId: result.playerId,
        finalPosition: result.finalPosition,
        finalScore: result.finalScore / 1000, // Dividir por 1000 para guardar en la escala correcta
        danPointsEarned: shouldUpdateRatings ? result.danChange : 0,
        rateChange: shouldUpdateRatings ? result.rateChange : 0,
        seasonPointsEarned: shouldUpdateRatings && result.seasonChange ? result.seasonChange : null
      }));
      await tx.gameResult.createMany({ data: gameResultsData });

      // 9.3) Points (solo si hay temporada seleccionada/activa)
      if (shouldUpdateRatings) {
        const results = await calculatedResults;
        const pointsData = await Promise.all(results.map(async (result) => {
          const points = [
            {
              playerId: result.playerId,
              seasonId: selectedSeasonId!,            // validada arriba
              gameId: createdAtGame.id,
              pointsType: 'DAN' as const,
              pointsValue: result.newDanPoints,
              description: `Juego ${createdAtGame.id} - Dan acumulado`
            },
            {
              playerId: result.playerId,
              seasonId: selectedSeasonId!,
              gameId: createdAtGame.id,
              pointsType: 'RATE' as const,
              pointsValue: result.newRatePoints,
              description: `Juego ${createdAtGame.id} - Rate acumulado`
            }
          ];

          // Agregar season points ACUMULADOS si el juego es elegible (tiene torneo)
          if (seasonEligible && result.newSeasonPoints !== undefined) {
            // Buscar último valor acumulado de SEASON para este jugador
            const lastSeason = await tx.points.findFirst({
              where: { playerId: result.playerId, pointsType: 'SEASON' as any, seasonId: selectedSeasonId! },
              orderBy: { id: 'desc' }
            });
            const previousAccum = lastSeason ? Number(lastSeason.pointsValue) : 0;
            const previousSeasonInRanking = currentRankings.get(result.playerId)?.seasonPoints || 0;
            const delta = result.newSeasonPoints - previousSeasonInRanking;
            const accumulated = previousAccum + delta;
            points.push({
              playerId: result.playerId,
              seasonId: selectedSeasonId!,
              gameId: createdAtGame.id,
              pointsType: 'SEASON' as any,
              pointsValue: accumulated,
              description: `Juego ${createdAtGame.id} - Season points acumulado`,
              // Nota: si el modelo Points tiene isSanma, Prisma lo permitirá; si no, lo ignorará
            });
          }

          return points;
        }));

        const flatPoints = pointsData.flat();

        if (flatPoints.length) {
          await tx.points.createMany({ data: flatPoints });
        }
      }

      // 9.4) Upsert de rankings (misma fila por jugador+sanma)
      for (const r of rankingsToUpdate) {
        await tx.playerRanking.upsert({
          where: {
            playerId_isSanma: { playerId: r.playerId, isSanma: r.isSanma }
          },
          update: {
            isSanma: r.isSanma,
            totalGames: r.totalGames,
            averagePosition: r.averagePosition,
            danPoints: r.danPoints,
            ratePoints: r.ratePoints,
            seasonPoints: r.seasonPoints,
            maxRate: r.maxRate,

            firstPlaceH: r.firstPlaceH,
            secondPlaceH: r.secondPlaceH,
            thirdPlaceH: r.thirdPlaceH,
            fourthPlaceH: r.fourthPlaceH,
            firstPlaceT: r.firstPlaceT,
            secondPlaceT: r.secondPlaceT,
            thirdPlaceT: r.thirdPlaceT,
            fourthPlaceT: r.fourthPlaceT,
            // season columns (optional merge)
            ...(r.seasonTotalGames ? { seasonTotalGames: r.seasonTotalGames } : {}),
            ...(r.seasonAveragePosition !== undefined ? { seasonAveragePosition: r.seasonAveragePosition } : {}),
            ...(r.seasonFirstPlaceH !== undefined ? { seasonFirstPlaceH: r.seasonFirstPlaceH } : {}),
            ...(r.seasonSecondPlaceH !== undefined ? { seasonSecondPlaceH: r.seasonSecondPlaceH } : {}),
            ...(r.seasonThirdPlaceH !== undefined ? { seasonThirdPlaceH: r.seasonThirdPlaceH } : {}),
            ...(r.seasonFourthPlaceH !== undefined ? { seasonFourthPlaceH: r.seasonFourthPlaceH } : {}),
            ...(r.seasonFirstPlaceT !== undefined ? { seasonFirstPlaceT: r.seasonFirstPlaceT } : {}),
            ...(r.seasonSecondPlaceT !== undefined ? { seasonSecondPlaceT: r.seasonSecondPlaceT } : {}),
            ...(r.seasonThirdPlaceT !== undefined ? { seasonThirdPlaceT: r.seasonThirdPlaceT } : {}),
            ...(r.seasonFourthPlaceT !== undefined ? { seasonFourthPlaceT: r.seasonFourthPlaceT } : {}),
          },
          create: {
            playerId: r.playerId,
            isSanma: r.isSanma,

            totalGames: r.totalGames,
            averagePosition: r.averagePosition,
            danPoints: r.danPoints,
            ratePoints: r.ratePoints,
            seasonPoints: r.seasonPoints,
            maxRate: r.maxRate,

            firstPlaceH: r.firstPlaceH,
            secondPlaceH: r.secondPlaceH,
            thirdPlaceH: r.thirdPlaceH,
            fourthPlaceH: r.fourthPlaceH,
            firstPlaceT: r.firstPlaceT,
            secondPlaceT: r.secondPlaceT,
            thirdPlaceT: r.thirdPlaceT,
            fourthPlaceT: r.fourthPlaceT,
            // season columns
            ...(r.seasonTotalGames ? { seasonTotalGames: r.seasonTotalGames } : {}),
            ...(r.seasonAveragePosition !== undefined ? { seasonAveragePosition: r.seasonAveragePosition } : {}),
            ...(r.seasonFirstPlaceH !== undefined ? { seasonFirstPlaceH: r.seasonFirstPlaceH } : {}),
            ...(r.seasonSecondPlaceH !== undefined ? { seasonSecondPlaceH: r.seasonSecondPlaceH } : {}),
            ...(r.seasonThirdPlaceH !== undefined ? { seasonThirdPlaceH: r.seasonThirdPlaceH } : {}),
            ...(r.seasonFourthPlaceH !== undefined ? { seasonFourthPlaceH: r.seasonFourthPlaceH } : {}),
            ...(r.seasonFirstPlaceT !== undefined ? { seasonFirstPlaceT: r.seasonFirstPlaceT } : {}),
            ...(r.seasonSecondPlaceT !== undefined ? { seasonSecondPlaceT: r.seasonSecondPlaceT } : {}),
            ...(r.seasonThirdPlaceT !== undefined ? { seasonThirdPlaceT: r.seasonThirdPlaceT } : {}),
            ...(r.seasonFourthPlaceT !== undefined ? { seasonFourthPlaceT: r.seasonFourthPlaceT } : {}),
          }
        });
      }

      // 9.5) Vincular el pending game con el juego oficial (también dentro de la transacción)
      await tx.pendingGame.update({
        where: { id: pendingGameId },
        data: {
          status: 'VALIDATED',
          validatedAt: new Date(),
          validatedBy: (authz.session.user.name || authz.session.user.email || 'Administrador') as any,
          gameId: createdAtGame.id
        }
      });
    });

    // 10) LIMPIEZA DE IMAGEN - Eliminar imagen temporal (solo validación)
    if (pendingGame.imageFileName) {
      await cleanupImage(pendingGame.imageFileName, pendingGame.imageUrl || undefined);
    }

    // 📧 Enviar notificación de juego aceptado
    try {
      const playerNames = [
        pendingGame.player1?.nickname || pendingGame.player1?.fullname || 'Jugador 1',
        pendingGame.player2?.nickname || pendingGame.player2?.fullname || 'Jugador 2',
        pendingGame.player3?.nickname || pendingGame.player3?.fullname || 'Jugador 3',
        ...(pendingGame.player4 ? [pendingGame.player4.nickname || pendingGame.player4.fullname || 'Jugador 4'] : [])
      ];

      await emailNotificationService.notifyGameAccepted({
        id: pendingGame.id,
        playerNames,
        acceptedBy: authz.session.user.name || authz.session.user.email || 'Administrador',
        date: pendingGame.gameDate,
        gameType: pendingGame.duration === 'HANCHAN' ? 'Hanchan' : 'Tonpuusen'
      });
    } catch (emailError) {
      console.error('Error enviando notificación de juego aceptado:', emailError);
      // No fallar la aprobación por un error de email
    }

    return NextResponse.json({
      success: true,
      message: 'Juego aprobado exitosamente',
      gameId: newGameId,
      gameResults: (await calculatedResults).length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ============================================================================
// 🚨 RECORDATORIO IMPORTANTE
// ============================================================================
// ⚠️  Si necesitas cambiar los valores iniciales de Dan o Rate:
// ⚠️  1. NO busques números hardcodeados en el código
// ⚠️  2. NO cambies valores como 1000, 1500, etc.
// ⚠️  3. MODIFICA SOLO las constantes al inicio del archivo:
// ⚠️     - INITIAL_DAN_POINTS
// ⚠️     - INITIAL_RATE_POINTS
// ⚠️  4. Estas constantes se usan en TODO el código
// ============================================================================
