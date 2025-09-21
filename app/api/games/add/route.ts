import { prisma } from '@/lib/database/client';
import { getNuevoRate, puntajeDan } from '@/lib/game-calculations';
import { ensureGameSubmit } from '@/lib/server-authorization';
import { NextRequest, NextResponse } from 'next/server';

interface GamePlayer {
  player: { id: number; playerId: number; nickname: string };
  wind: string;
  oorasuScore?: number;
  gameScore: number;
  uma: number;
  chonbo: number;
  oka: number;
  finalScore: number;
  finalPosition: number;
}

interface GameSubmission {
  date: string;
  venue: string;
  duration: 'HANCHAN' | 'TONPUUSEN';
  rulesetId: number;
  players: GamePlayer[];
}

export async function POST(request: NextRequest) {
  try {
    const authz = await ensureGameSubmit();
    if ("error" in authz) return authz.error;

    console.log('🎮 Recibiendo nuevo juego...');
    const gameData: GameSubmission = await request.json();

    // ================================
    // 1. BUSCAR RULESET
    // ================================

    const gameRuleset = await prisma.ruleset.findUnique({
      where: { id: gameData.rulesetId },
      include: {
        uma: true // Incluir datos del Uma
      }
    });

    if (!gameRuleset) {
      return NextResponse.json(
        { success: false, message: 'Ruleset no encontrado' },
        { status: 400 }
      );
    }

    console.log('📋 Ruleset encontrado:', {
      name: gameRuleset.name,
      inPoints: gameRuleset.inPoints,
      outPoints: gameRuleset.outPoints,
      sanma: gameRuleset.sanma,
      uma: gameRuleset.uma
    });

    // ================================
    // 2. VALIDACIONES BÁSICAS
    // ================================

    // Verificar número de jugadores según el ruleset
    const validPlayers = gameData.players.filter(p => p.player);
    const expectedPlayers = gameRuleset.sanma ? 3 : 4;
    if (validPlayers.length !== expectedPlayers) {
      return NextResponse.json(
        { success: false, message: `Debe haber exactamente ${expectedPlayers} jugadores para este ruleset` },
        { status: 400 }
      );
    }

    // Verificar que no hay jugadores duplicados
    const playerIds = validPlayers.map(p => p.player.id);
    if (new Set(playerIds).size !== playerIds.length) {
      return NextResponse.json(
        { success: false, message: 'No puede haber jugadores duplicados' },
        { status: 400 }
      );
    }

    // Validar suma de puntajes
    const totalGameScore = validPlayers.reduce((sum, p) => sum + p.gameScore, 0);
    const expectedTotal = gameRuleset.inPoints * expectedPlayers;
    if (totalGameScore !== expectedTotal) {
      return NextResponse.json(
        { success: false, message: `Los puntajes deben sumar ${expectedTotal}. Actual: ${totalGameScore}` },
        { status: 400 }
      );
    }

    // Validar suma final ≈ 0
    const totalFinalScore = validPlayers.reduce((sum, p) => sum + p.finalScore, 0);
    if (Math.abs(totalFinalScore) > 1000) { // Tolerancia 1000 puntos
      return NextResponse.json(
        { success: false, message: `El total final debe ser ≈0. Actual: ${totalFinalScore}` },
        { status: 400 }
      );
    }

    console.log('✅ Validaciones básicas pasadas');

    // ================================
    // 2. OBTENER DATOS PREVIOS DE JUGADORES
    // ================================

    // Obtener jugadores completos con sus datos actuales
    const playersData = await prisma.player.findMany({
      where: {
        id: { in: playerIds }
      },
      include: {
        rankings: {
          where: {
            isSanma: gameRuleset.sanma
          },
          take: 1
        }
      }
    });

    if (playersData.length !== 4) {
      return NextResponse.json(
        { success: false, message: 'No se pudieron encontrar todos los jugadores' },
        { status: 404 }
      );
    }

    console.log('✅ Datos de jugadores obtenidos');

    // ================================
    // 3. OBTENER RULESET Y TEMPORADA
    // ================================

    const [ruleset, season] = await Promise.all([
      prisma.ruleset.findFirst({ where: { name: 'Standard' } }),
      prisma.season.findFirst({ where: { name: '2024-25' } })
    ]);

    if (!ruleset || !season) {
      return NextResponse.json(
        { success: false, message: 'No se encontró ruleset o temporada' },
        { status: 500 }
      );
    }

    // ================================
    // 4. CREAR JUEGO EN TRANSACCIÓN
    // ================================

    const result = await prisma.$transaction(async (tx) => {
      console.log('🔄 Iniciando transacción...');

      // 4.1 Crear Game
      const newGame = await tx.game.create({
        data: {
          gameDate: new Date(gameData.date + 'T12:00:00.000Z'),
          gameType: gameData.duration,
          rulesetId: gameRuleset.id,
          seasonId: season.id,
          locationId: null, // No hay ubicación específica por ahora
          extraData: {
            venue: gameData.venue || 'CARM'
          }
        }
      });

      console.log(`✅ Juego creado con ID: ${newGame.id}`);

      // 4.2 Procesar cada jugador
      const gameResults = [];
      const pointsToCreate = [];
      const rankingUpdates = [];

      for (const playerSubmission of validPlayers) {
        const playerData = playersData.find(p => p.id === playerSubmission.player.id);
        if (!playerData) continue;

        // Obtener puntos actuales (desde PlayerRanking si existe, sino defaults)
        const currentRanking = playerData.rankings?.[0];
        const currentDanPoints = currentRanking?.danPoints || 0;
        const currentRatePoints = currentRanking?.ratePoints || 1500;

        console.log(`🎯 Procesando ${playerData.nickname}: Dan=${currentDanPoints}, Rate=${currentRatePoints}`);

        // Calcular nuevos puntos Dan
        const nuevoPuntosDan = await puntajeDan(
          playerSubmission.finalPosition,
          gameData.duration === 'HANCHAN' ? 'hanchan' : 'tonpuusen',
          currentDanPoints
        );

        // Obtener rates de todos los jugadores y calcular promedio
        const allPlayerRates = validPlayers.map(p => {
          const pd = playersData.find(pd => pd.id === p.player.id);
          return pd?.rankings?.[0]?.ratePoints || 1500;
        });
        const promedioMesa = allPlayerRates.reduce((sum, rate) => sum + rate, 0) / allPlayerRates.length;

        // Obtener total de juegos del jugador para cálculo Rate
        const totalJuegos = currentRanking?.totalGames || 0;

        // Calcular nuevo Rate
        const nuevoRate = await getNuevoRate(
          playerSubmission.finalPosition,
          currentRatePoints,
          totalJuegos,
          promedioMesa,
          gameData.duration === 'HANCHAN' ? 'hanchan' : 'tonpuusen'
        );

        const danChange = Number(nuevoPuntosDan) - Number(currentDanPoints);
        const rateChange = Number(nuevoRate) - Number(currentRatePoints);

        // 4.3 Crear GameResult
        const gameResult = await tx.gameResult.create({
          data: {
            gameId: newGame.id,
            playerId: playerData.id,
            finalPosition: playerSubmission.finalPosition,
            finalScore: playerSubmission.finalScore / 1000, // Dividir por 1000 para guardar en la escala correcta
            danPointsEarned: danChange,
            rateChange: rateChange,
            extraData: {
              // 📊 Datos auxiliares para referencia/debugging
              wind: playerSubmission.wind,
              gameScore: playerSubmission.gameScore,
              oorasuScore: playerSubmission.oorasuScore,
              uma: playerSubmission.uma,
              oka: playerSubmission.oka,
              chonbo: playerSubmission.chonbo,
              devolution: ruleset.outPoints / 1000 // Valor fijo del ruleset
            }
          }
        });

        gameResults.push(gameResult);

        // 4.4 Crear registros Points para historial
        pointsToCreate.push(
          {
            playerId: playerData.id,
            seasonId: season.id, // ✅ Requerido por el schema
            gameId: newGame.id,
            pointsType: 'DAN' as const,
            pointsValue: nuevoPuntosDan,
            createdAt: newGame.gameDate,
            isSanma: gameRuleset.sanma
          },
          {
            playerId: playerData.id,
            seasonId: season.id, // ✅ Requerido por el schema
            gameId: newGame.id,
            pointsType: 'RATE' as const,
            pointsValue: nuevoRate,
            createdAt: newGame.gameDate,
            isSanma: gameRuleset.sanma
          }
        );

        // 4.5 Preparar actualización de PlayerRanking
        const existingStats = currentRanking || {
          totalGames: 0,
          firstPlaceH: 0,
          secondPlaceH: 0,
          thirdPlaceH: 0,
          fourthPlaceH: 0,
          firstPlaceT: 0,
          secondPlaceT: 0,
          thirdPlaceT: 0,
          fourthPlaceT: 0,
          maxRate: currentRatePoints,
          averagePosition: 2.5,
          seasonPoints: 0
        };

        // Actualizar contadores de posición
        const isHanchan = gameData.duration === 'HANCHAN';
        const positionField = `${['first', 'second', 'third', 'fourth'][playerSubmission.finalPosition - 1]}Place${isHanchan ? 'H' : 'T'}`;
        const newStats = {
          ...existingStats,
          totalGames: existingStats.totalGames + 1,
          [positionField]: (existingStats as any)[positionField] + 1,
          danPoints: Math.floor(nuevoPuntosDan), // Truncar para display
          ratePoints: Math.round(nuevoRate), // Redondear para display
          maxRate: Math.max(existingStats.maxRate, Math.round(nuevoRate)),
          averagePosition: 0 // Se calculará después
        };

        // Calcular nueva posición promedio
        const totalPositions =
          newStats.firstPlaceH * 1 + newStats.secondPlaceH * 2 + newStats.thirdPlaceH * 3 + newStats.fourthPlaceH * 4 +
          newStats.firstPlaceT * 1 + newStats.secondPlaceT * 2 + newStats.thirdPlaceT * 3 + newStats.fourthPlaceT * 4;
        newStats.averagePosition = totalPositions / newStats.totalGames;

        rankingUpdates.push({
          playerId: playerData.id,
          stats: {
            ...newStats,
            seasonPoints: (existingStats.seasonPoints || 0) + (ruleset && gameData.duration ? (gameRuleset && (gameRuleset as any) ? 0 : 0) : 0)
          }
        });

        console.log(`✅ ${playerData.nickname}: Dan ${currentDanPoints} → ${nuevoPuntosDan} (${danChange >= 0 ? '+' : ''}${danChange})`);
        console.log(`✅ ${playerData.nickname}: Rate ${currentRatePoints} → ${nuevoRate} (${rateChange >= 0 ? '+' : ''}${rateChange.toFixed(1)})`);
      }

      // 4.6 Crear registros Points en batch
      await tx.points.createMany({
        data: pointsToCreate
      });

      console.log(`✅ ${pointsToCreate.length} registros Points creados`);

      // 4.7 Actualizar PlayerRanking
      for (const update of rankingUpdates) {
        // Usar upsert con el compound key correcto (playerId + isSanma)
        await tx.playerRanking.upsert({
          where: {
            playerId_isSanma: {
              playerId: update.playerId,
              isSanma: gameRuleset.sanma
            }
          },
          update: update.stats,
          create: {
            ...update.stats,
            playerId: update.playerId,
            isSanma: gameRuleset.sanma
          }
        });
      }

      console.log('✅ PlayerRanking actualizado para todos los jugadores');

      return {
        game: newGame,
        gameResults: gameResults,
        pointscreatedAt: pointsToCreate.length,
        playersupdatedAt: rankingUpdates.length
      };
    });

    console.log('🎉 Transacción completada exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Juego agregado exitosamente',
      data: {
        gameId: result.game.id,
        gameDate: result.game.gameDate,
        playersupdatedAt: result.playersupdatedAt,
        pointscreatedAt: result.pointscreatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error procesando el juego:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
