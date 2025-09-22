import { prisma } from '@/lib/database/client';
import { ensureGameSubmit } from '@/lib/server-authorization';
import { emailNotificationService } from '@/lib/services/email-notification-service';
import { hybridImageStorage } from '@/lib/simplified-image-storage';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // ✅ Verificar autorización y obtener usuario
    const authz = await ensureGameSubmit();
    if ('error' in authz) return authz.error;

    // No necesitamos el jugador vinculado, solo el usuario que envía

    const formData = await request.formData();

    // Extraer datos del formulario
    const date = formData.get('date') as string;
    const nroJuegoDiaStr = formData.get('nroJuegoDia') as string | null;
    const nroJuegoDia = nroJuegoDiaStr ? parseInt(nroJuegoDiaStr) : null;
    const locationIdStr = formData.get('locationId') as string | null;
    const locationId = locationIdStr ? parseInt(locationIdStr) : null;
    const duration = formData.get('duration') as string;
    const sanma = formData.get('sanma') === 'true';
    const seasonIdStr = formData.get('seasonId') as string | null;
    const seasonId = seasonIdStr ? parseInt(seasonIdStr) : null;
    const tournamentIdStr = formData.get('tournamentId') as string | null;
    const tournamentId = tournamentIdStr ? parseInt(tournamentIdStr) : null;
    const rulesetId = parseInt(formData.get('rulesetId') as string);
    const playersData = formData.get('players') as string;
    const imageFile = formData.get('image') as File | null;

    // Parsear datos de jugadores
    const players = JSON.parse(playersData);

    // Procesar imagen si existe
    let imageFileName: string | null = null;
    let imageFormat: string | null = null;
    let imageUrl: string | null = null;

    if (imageFile && imageFile.size > 0) {
      try {
        // Convertir File a Buffer
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const filename = imageFile.name;

        const savedImage = await hybridImageStorage.saveImage(buffer, filename, 'games');
        imageFileName = savedImage.filename;
        imageFormat = imageFile.type.split('/')[1] || 'jpg'; // Extraer formato del MIME type
        imageUrl = savedImage.url; // Ya incluye la URL completa

        // Log para debug
        const imageInfo = hybridImageStorage.getImageInfo(imageFileName, imageUrl);
        console.log(`📸 Imagen procesada: ${imageInfo.storage} (${imageFileName})`);

      } catch (error) {
        console.warn('⚠️ Error procesando imagen, usando imagen default:', error);
        // Usar imagen default en caso de error
        const defaultImage = hybridImageStorage.getDefaultImage();
        imageFileName = defaultImage.filename;
        imageFormat = 'svg';
        imageUrl = defaultImage.url;
      }
    }

    // Validar que tengamos al menos 3 jugadores
    const playerCount = sanma ? 3 : 4;
    const validPlayers = players.filter((p: any) => p.player && p.player.id);

    if (validPlayers.length < 3) {
      return NextResponse.json(
        { success: false, message: 'Se requieren al menos 3 jugadores' },
        { status: 400 }
      );
    }

    // Verificar que los puntajes sumen correctamente
    const ruleset = await prisma.ruleset.findUnique({
      where: { id: rulesetId },
      include: { uma: true }
    });

    if (!ruleset) {
      return NextResponse.json(
        { success: false, message: 'Ruleset no encontrado' },
        { status: 400 }
      );
    }

    const totalGameScore = validPlayers.reduce((sum: number, p: any) => sum + p.gameScore, 0);
    const expectedTotal = ruleset.inPoints * validPlayers.length;

    if (totalGameScore !== expectedTotal) {
      return NextResponse.json(
        { success: false, message: `Los puntajes deben sumar ${expectedTotal}. Actual: ${totalGameScore}` },
        { status: 400 }
      );
    }

    // Validar que no exista el mismo número de juego en el mismo día
    if (nroJuegoDia) {
      const existingGame = await prisma.pendingGame.findFirst({
        where: {
          gameDate: new Date(date),
          nroJuegoDia: nroJuegoDia,
          status: 'PENDING'
        }
      });

      if (existingGame) {
        return NextResponse.json(
          { success: false, message: `Ya existe un juego con el número ${nroJuegoDia} para la fecha ${date}` },
          { status: 400 }
        );
      }
    }

    // Preparar datos para inserción
    const pendingGameData: any = {
      gameDate: new Date(date),
      nroJuegoDia: nroJuegoDia || null,
      locationId: locationId || null,
      duration: duration,
      sanma: sanma,
      seasonId: seasonId || null, // Incluir temporada si se especifica
      tournamentId: tournamentId || null, // Incluir torneo si se especifica
      rulesetId: rulesetId,
      imageUrl: imageUrl || null,
      imageFileName: imageFileName || null,
      imageFormat: imageFormat || null,
      status: 'PENDING', // Estado por defecto
      submittedBy: authz.session.user.name || authz.session.user.email || 'Usuario desconocido', // ✅ Nombre del usuario

      // Datos del jugador 1
      player1Id: validPlayers[0].player.id,
      player1Wind: validPlayers[0].wind || null,
      player1OorasuScore: validPlayers[0].oorasuScore || null,
      player1GameScore: validPlayers[0].gameScore,
      player1Chonbos: validPlayers[0].chonbo || 0,
      player1FinalScore: validPlayers[0].finalScore || null,

      // Datos del jugador 2
      player2Id: validPlayers[1].player.id,
      player2Wind: validPlayers[1].wind || null,
      player2OorasuScore: validPlayers[1].oorasuScore || null,
      player2GameScore: validPlayers[1].gameScore,
      player2Chonbos: validPlayers[1].chonbo || 0,
      player2FinalScore: validPlayers[1].finalScore || null,

      // Datos del jugador 3
      player3Id: validPlayers[2].player.id,
      player3Wind: validPlayers[2].wind || null,
      player3OorasuScore: validPlayers[2].oorasuScore || null,
      player3GameScore: validPlayers[2].gameScore,
      player3Chonbos: validPlayers[2].chonbo || 0,
      player3FinalScore: validPlayers[2].finalScore || null,
    };

    // Agregar jugador 4 si no es sanma
    if (!sanma && validPlayers[3]) {
      pendingGameData.player4Id = validPlayers[3].player.id;
      pendingGameData.player4Wind = validPlayers[3].wind || null;
      pendingGameData.player4OorasuScore = validPlayers[3].oorasuScore || null;
      pendingGameData.player4GameScore = validPlayers[3].gameScore;
      pendingGameData.player4Chonbos = validPlayers[3].chonbo || 0;
      pendingGameData.player4FinalScore = validPlayers[3].finalScore || null;
    } else if (!sanma) {
      // Si no es sanma pero no hay jugador 4, establecer como null
      pendingGameData.player4Id = null;
      pendingGameData.player4Wind = null;
      pendingGameData.player4OorasuScore = null;
      pendingGameData.player4GameScore = null;
      pendingGameData.player4Chonbos = null;
      pendingGameData.player4FinalScore = null;
    }

    // Crear el juego pendiente
    const pendingGame = await prisma.pendingGame.create({
      data: pendingGameData,
      include: {
        ruleset: {
          include: { uma: true }
        },
        player1: true,
        player2: true,
        player3: true,
        player4: true
        // Ya no necesitamos incluir submitter - es solo un string
      }
    });

    // Enviar notificación de nuevo juego pendiente
    try {
      const playerNames = [
        pendingGame.player1?.nickname || pendingGame.player1?.fullname || 'Jugador 1',
        pendingGame.player2?.nickname || pendingGame.player2?.fullname || 'Jugador 2',
        pendingGame.player3?.nickname || pendingGame.player3?.fullname || 'Jugador 3',
        ...(pendingGame.player4 ? [pendingGame.player4.nickname || pendingGame.player4.fullname || 'Jugador 4'] : [])
      ];

      await emailNotificationService.notifyNewPendingGame({
        id: pendingGame.id,
        playerNames,
        submittedBy: String(pendingGame.submittedBy) || 'Usuario desconocido',
        date: pendingGame.gameDate,
        gameType: pendingGame.duration === 'HANCHAN' ? 'Hanchan' : 'Tonpuusen'
      });
    } catch (emailError) {
      console.error('Error enviando notificación de juego pendiente:', emailError);
      // No fallar la creación del juego por un error de email
    }

    return NextResponse.json({
      success: true,
      message: 'Juego enviado para validación',
      pendingGameId: pendingGame.id
    });

  } catch (error) {
    console.error('Error submitting pending game:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
