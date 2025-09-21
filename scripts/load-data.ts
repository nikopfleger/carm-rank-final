import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import csv from 'csv-parser';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { configCache } from '../lib/config-cache';
import { getPrismaDatabaseUrl } from '../lib/database/config';
import {
    calculateGameResults
} from '../lib/game-calculations';

// Cargar variables de entorno desde .env
config();

// Fail-fast siempre activo
const FAIL_FAST = true;
const failFastOrLog = (message: string, extra?: unknown): never => {
    const error = new Error(message);
    if (extra) (error as any).context = extra;
    throw error;
};

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
const limitArg = args.find(arg => arg.startsWith('--limit='));
const allArg = args.includes('--all');

const gameLimit = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;
const isAllGames = allArg || gameLimit === Infinity;

console.log(`🎮 Modo: ${isAllGames ? 'TODOS los juegos' : `Primeros ${gameLimit} juegos`}`);


// Crear PrismaClient con URL desencriptada desde JDBC
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: getPrismaDatabaseUrl()
        }
    }
});

// === Reserva de legajos (JSON) y sets de control ===
const legajosRealesPathAbs = path.join(__dirname, '..', 'data', 'legajos-reales-correcto.json');

const legajosReservadosJson: Record<string, number> = fs.existsSync(legajosRealesPathAbs)
    ? JSON.parse(fs.readFileSync(legajosRealesPathAbs, 'utf8'))
    : {};

const legajosReservadosPorNick = new Map<string, number>(Object.entries(legajosReservadosJson));
const legajosReservadosSet = new Set<number>(Object.values(legajosReservadosJson));

// legajos ya usados en DB (se carga una vez) y los asignados en esta corrida antes de tocar DB
let legajosUsadosDB = new Set<number>();
const legajosAsignadosEnEjecucion = new Set<number>();

async function cargarLegajosUsadosDB() {
    const rows = await (prisma as any).player.findMany({ select: { playerNumber: true } });
    legajosUsadosDB = new Set(
        rows
            .map((r: any) => r.playerNumber)
            .filter((n: number): n is number => Number.isFinite(n) && n > 0)
    );
}

async function getLegajoForMigration(nick: string): Promise<number> {
    const n = (nick || '').trim();

    // 1) Si está en JSON → legajo reservado (obligatorio)
    if (legajosReservadosPorNick.has(n)) {
        const legajoReservado = legajosReservadosPorNick.get(n)!;
        legajosAsignadosEnEjecucion.add(legajoReservado);
        return legajoReservado;
    }

    // 2) Si NO está en JSON → buscar el mínimo disponible que:
    //    - no esté usado en DB
    //    - no esté reservado en JSON
    //    - no se haya asignado en esta corrida
    let candidato = 1;
    while (
        legajosUsadosDB.has(candidato) ||
        legajosReservadosSet.has(candidato) ||
        legajosAsignadosEnEjecucion.has(candidato)
    ) {
        candidato++;
    }

    legajosAsignadosEnEjecucion.add(candidato);
    return candidato;
}

async function clearDatabase() {
    console.log('🧹 Limpiando base de datos...');

    try {
        // Limpiar todas las tablas en orden correcto (respetando foreign keys)
        const tables = [
            'GameResult',
            'Points',
            'PlayerRanking',
            'Game',
            'Player',
            'Tournament',
            'Season',
            'Uma',
            'Location',
            'Country',
            'DanConfig',
            'RateConfig',
            'SeasonConfig'
        ];

        for (const table of tables) {
            console.log(`🗑️  Limpiando tabla ${table}...`);
            await (prisma as any)[table].deleteMany({});
        }

        console.log('✅ Base de datos limpiada');
    } catch (error) {
        console.error('❌ Error limpiando base de datos:', error);
        throw error;
    }
}

async function runSeed() {
    console.log('🌱 Ejecutando seed...');
    try {
        execSync('npm run db:seed', { stdio: 'inherit' });
        console.log('✅ Seed completado');
    } catch (error) {
        console.error('❌ Error ejecutando seed:', error);
        throw error;
    }
}

async function runReset() {
    console.log('🔄 Ejecutando reset de Prisma...');
    try {
        execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
        console.log('✅ Reset completado');
    } catch (error) {
        console.error('❌ Error ejecutando reset:', error);
        throw error;
    }
}

async function loadCSV() {
    console.log('📊 Cargando datos del CSV...');

    try {
        // 1. Cargar legajos usados en DB
        await cargarLegajosUsadosDB();
        console.log(`📊 Legajos ya usados en DB: ${legajosUsadosDB.size}`);

        // 2. Verificar que las configuraciones estén cargadas
        const danConfigs = await (prisma as any).danConfig.count();
        const rateConfigs = await (prisma as any).rateConfig.count();
        const seasonConfigs = await (prisma as any).seasonConfig.count();

        console.log(`🥋 DanConfigs: ${danConfigs}`);
        console.log(`📊 RateConfigs: ${rateConfigs}`);
        console.log(`🏆 SeasonConfigs: ${seasonConfigs}`);

        if (danConfigs === 0 || rateConfigs === 0 || seasonConfigs === 0) {
            console.error('❌ ERROR: Las configuraciones no están cargadas. Ejecuta con --seed');
            return;
        }

        // 3. Inicializar cache de configuraciones (temporalmente deshabilitado)
        // console.log('🔄 Inicializando cache de configuraciones...');
        await configCache.initialize();
        // console.log('✅ Cache de configuraciones inicializado');

        // 3. Verificar que existan datos básicos
        const country = await prisma.country.findFirst({ where: { isoCode: 'ARG' } });
        const location = await prisma.location.findFirst({ where: { id: 1 } });
        const uma = await prisma.uma.findFirst({ where: { id: 1 } });
        // Obtener temporada activa (última) para cálculo de season actual
        const activeSeason = await prisma.season.findFirst({ where: { isActive: true }, orderBy: { startDate: 'desc' } });

        console.log(`🌍 Country ARG: ${country ? '✅' : '❌'}`);
        console.log(`📍 Location ID 1: ${location ? '✅' : '❌'}`);
        console.log(`🎯 UMA ID 1: ${uma ? '✅' : '❌'}`);
        console.log(`📅 Active season: ${activeSeason ? `${activeSeason.name} (ID ${activeSeason.id})` : '❌'}`);

        if (!country || !location || !uma || !activeSeason) {
            console.error('❌ ERROR: Datos básicos no encontrados. Ejecuta con --seed');
            return;
        }

        console.log('✅ Datos básicos verificados');

        // 4. Procesar CSV
        const csvPath = path.join(__dirname, '..', 'csv', 'CARM.csv');

        if (!fs.existsSync(csvPath)) {
            console.error(`❌ ERROR: Archivo CSV no encontrado: ${csvPath}`);
            return;
        }

        console.log(`📁 Procesando CSV: ${csvPath}`);

        // 5. Leer y procesar CSV
        const games: any[] = [];
        const playerStats = new Map<number, any>();
        // Stats por temporada actual (solo season activa)
        const seasonPlayerStats = new Map<number, any>();

        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    games.push(row);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`📊 Total de juegos en CSV: ${games.length}`);

        // 6. Procesar cada juego
        let processedGames = 0;
        const tournamentsSeasonPointsInserted = new Set<number>();
        let createdAtPlayers = 0;

        for (const game of games) { // Procesar todos los juegos
            // Verificar límite de juegos
            if (!isAllGames && processedGames >= gameLimit) {
                console.log(`🛑 Limiting to first ${gameLimit} games. Stopping at game ${processedGames + 1}`);
                break;
            }

            try {
                // Parsear datos del juego (formato chileno DD/MM/YYYY)
                let gameDate: Date;
                if (game.date && game.date.includes('/')) {
                    const [day, month, year] = game.date.split('/');
                    gameDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                } else {
                    gameDate = new Date(game.date);
                }

                // Validar que la fecha sea válida, weón
                if (isNaN(gameDate.getTime())) {
                    console.error(`❌ Fecha inválida en juego ${processedGames + 1}: ${game.date}`);
                    continue;
                }

                const isSanmaMode = false; // Por ahora asumimos que todos son de 4 jugadores
                const tournamentId = game.tournament ? parseInt(game.tournament) : null;

                const gameType = game.gameLength;
                // Elegible para season si el juego tiene temporada y torneo
                const seasonEligible = !!(game.season && game.tournament);

                // Debug explícito para líneas finales de torneos 24 y 25
                const gameNumber = Number(game.game);
                if (gameNumber === 1873 || gameNumber === 1966) {
                    console.log('🔎 Debug torneo fin', {
                        gameNumber,
                        date: game.date,
                        tournamentId,
                        tournamentsSeasonPointsInserted: Array.from(tournamentsSeasonPointsInserted)
                    });
                }

                // Resolver seasonId desde CSV (puede ser nombre o id). Si no hay, debe ser null.
                let seasonIdForGame: number | null = null;
                if (game.season) {
                    const numericSeason = Number(game.season);
                    const seasonRow = await prisma.season.findFirst({
                        where: isNaN(numericSeason)
                            ? { name: String(game.season) }
                            : { id: numericSeason }
                    });
                    seasonIdForGame = seasonRow ? seasonRow.id : null;
                }

                // Obtener jugadores (ya están en el seed)
                const playerIds: number[] = [];
                const playerData = [
                    { nick: game.firstNick, score: game.firstPoints },
                    { nick: game.secondNick, score: game.secondPoints },
                    { nick: game.thirdNick, score: game.thirdPoints },
                    { nick: game.fourthNick, score: game.fourthPoints }
                ];

                for (let i = 0; i < playerData.length; i++) {
                    const { nick, score } = playerData[i];
                    if (!nick) continue;


                    const existingPlayer = await prisma.player.findUnique({
                        where: { nickname: nick }
                    });

                    if (!existingPlayer) {
                        const msg = `❌ Jugador no encontrado: "${nick}" (CSV game #${processedGames + 1}, player ${i + 1})`;
                        const ctx = {
                            date: game.date,
                            game: game.game,
                            firstNick: game.firstNick,
                            secondNick: game.secondNick,
                            thirdNick: game.thirdNick,
                            fourthNick: game.fourthNick
                        };
                        failFastOrLog(msg, ctx);
                    }

                    if (existingPlayer) {
                        playerIds.push((existingPlayer as any).id); // Usar el ID del jugador
                    }
                }

                // Crear juego
                const createdAtGame = await (prisma as any).game.create({
                    data: {
                        gameDate,
                        gameType: (() => {
                            if (gameType === 'H') return 'HANCHAN';
                            if (gameType === 'T') return 'TONPUUSEN';
                            throw new Error(`Tipo de juego inválido para base de datos: "${gameType}". Solo se permiten 'H' o 'T'.`);
                        })(),
                        tournamentId: tournamentId,
                        rulesetId: uma.id,
                        seasonId: seasonIdForGame
                    }
                });

                // Crear resultados del juego
                const players = playerIds.map((id, index) => ({
                    id,
                    finalScore: parseFloat(playerData[index].score) || 0
                }));

                // Pre-cargar todos los points del jugador para acumulados (solo para temporada 6)
                const allPointsByPlayer: Record<number, Array<{ playerId: number; pointsType: 'DAN' | 'RATE' | 'SEASON'; gameId: number | null; pointsValue: number }>> = {};
                for (const playerId of playerIds) {
                    const pts = await (prisma as any).points.findMany({
                        where: { playerId, seasonId: 6 }, // Solo temporada 6
                        orderBy: { id: 'asc' }
                    });
                    allPointsByPlayer[playerId] = pts as any;
                }

                // Calcular rankings actuales desde la última fila de points
                const currentRankings = new Map();
                for (const playerId of playerIds) {
                    // Buscar la última fila de points para Dan
                    const lastDanPoints = await (prisma as any).points.findFirst({
                        where: {
                            playerId,
                            pointsType: 'DAN'
                        },
                        orderBy: { id: 'desc' }
                    });

                    // Buscar la última fila de points para Rate
                    const lastRatePoints = await (prisma as any).points.findFirst({
                        where: {
                            playerId,
                            pointsType: 'RATE'
                        },
                        orderBy: { id: 'desc' }
                    });

                    // Contar juegos desde points (más confiable)
                    const totalGamesFromPoints = await (prisma as any).points.count({
                        where: {
                            playerId,
                            pointsType: 'RATE'
                        }
                    });

                    // Obtener estadísticas del jugador
                    const ranking = await (prisma as any).playerRanking.findFirst({
                        where: {
                            playerId,
                            isSanma: isSanmaMode
                        }
                    });

                    // Tomar el último valor ACUMULADO de SEASON desde Points (no desde ranking)
                    const seasonHistory = allPointsByPlayer[playerId] || [];
                    const lastSeasonPoints = seasonHistory
                        .filter((p: any) => p.pointsType === 'SEASON')
                        .at(-1);

                    currentRankings.set(playerId, {
                        danPoints: lastDanPoints ? Number(lastDanPoints.pointsValue) : 0,
                        ratePoints: lastRatePoints ? Number(lastRatePoints.pointsValue) : 1500,
                        totalGames: totalGamesFromPoints, // Usar conteo desde points
                        seasonPoints: lastSeasonPoints ? Number(lastSeasonPoints.pointsValue) : 0
                    });
                }

                // Calcular promedio de mesa ANTES del juego
                const currentRates = players.map(p => {
                    const ranking = currentRankings.get(p.id);
                    return ranking ? ranking.ratePoints : 1500;
                });
                const tableAverageRate = currentRates.reduce((sum, rate) => sum + rate, 0) / currentRates.length;


                // Calcular resultados
                const calculatedResults = await calculateGameResults(
                    players,
                    gameType,
                    currentRankings,
                    tableAverageRate,
                    isSanmaMode,
                    seasonEligible, // Sumar season si tiene temporada y torneo
                    undefined // Usar configuraciones por defecto
                );

                // Crear GameResults
                const results = await calculatedResults;

                for (const result of results) {
                    // Buscar el jugador por su ID (result.playerId ya es el ID de la base de datos)
                    const player = await (prisma as any).player.findUnique({
                        where: { id: result.playerId }
                    });

                    if (!player) {
                        console.error(`❌ Jugador no encontrado: ${result.playerId}`);
                        continue;
                    }

                    await (prisma as any).gameResult.create({
                        data: {
                            gameId: createdAtGame.id,
                            playerId: player.id, // Usar el ID (primary key) del jugador
                            finalPosition: result.finalPosition,
                            finalScore: result.finalScore,
                            danPointsEarned: result.danChange,
                            rateChange: result.rateChange,
                            seasonPointsEarned: result.seasonChange || null
                        }
                    });

                    // Crear registros Points para el historial (usar seasonId del CSV)
                    const pointsData: Array<{
                        playerId: number;
                        seasonId: number;
                        gameId: number;
                        pointsType: 'DAN' | 'RATE' | 'SEASON';
                        pointsValue: number;
                        description: string;
                        isSanma?: boolean;
                    }> = [
                            {
                                playerId: player.id,
                                seasonId: seasonIdForGame || 1, // Usar season del CSV
                                gameId: createdAtGame.id,
                                pointsType: 'DAN' as const,
                                pointsValue: result.newDanPoints,
                                description: `Juego ${createdAtGame.id} - Dan acumulado`,
                                isSanma: false
                            },
                            {
                                playerId: player.id,
                                seasonId: seasonIdForGame || 1, // Usar season del CSV
                                gameId: createdAtGame.id,
                                pointsType: 'RATE' as const,
                                pointsValue: result.newRatePoints,
                                description: `Juego ${createdAtGame.id} - Rate acumulado`,
                                isSanma: false
                            }
                        ];

                    // Si el juego tiene torneo, agregar season points SOLO para temporada 6
                    if (tournamentId && result.newSeasonPoints !== undefined && seasonIdForGame === 6) {
                        // Tomar último valor acumulado y sumar el delta del juego
                        const seasonHistory = allPointsByPlayer[player.id] || [];
                        const lastSeason = seasonHistory
                            .filter((p: any) => p.pointsType === 'SEASON')
                            .at(-1);
                        const previousAccum = lastSeason ? Number(lastSeason.pointsValue) : 0;
                        const delta = result.newSeasonPoints - (currentRankings.get(player.id)?.seasonPoints || 0);
                        const accumulated = previousAccum + delta;

                        pointsData.push({
                            playerId: player.id,
                            seasonId: 6, // Solo temporada 6
                            gameId: createdAtGame.id,
                            pointsType: 'SEASON' as const,
                            pointsValue: accumulated,
                            description: `Juego ${createdAtGame.id} - Season points acumulado (Torneo ${tournamentId})`,
                            isSanma: false
                        });
                    }

                    await prisma.points.createMany({
                        data: pointsData as any
                    });

                    // Actualizar estadísticas del jugador
                    const stats = playerStats.get(player.id) || {
                        totalGames: 0,
                        firstPlace: 0,
                        secondPlace: 0,
                        thirdPlace: 0,
                        fourthPlace: 0,
                        firstPlaceH: 0,
                        secondPlaceH: 0,
                        thirdPlaceH: 0,
                        fourthPlaceH: 0,
                        firstPlaceT: 0,
                        secondPlaceT: 0,
                        thirdPlaceT: 0,
                        fourthPlaceT: 0,
                        positionSum: 0,
                        totalDanPoints: 0,
                        totalRatePoints: 0,
                        totalSeasonPoints: 0,
                        maxRate: 1500 // Valor inicial
                    };

                    stats.totalGames++;
                    stats.positionSum += result.finalPosition;

                    // Contar por tipo de juego
                    if (gameType === 'H') {
                        if (result.finalPosition === 1) stats.firstPlaceH++;
                        else if (result.finalPosition === 2) stats.secondPlaceH++;
                        else if (result.finalPosition === 3) stats.thirdPlaceH++;
                        else if (result.finalPosition === 4) stats.fourthPlaceH++;
                    } else if (gameType === 'T') {
                        if (result.finalPosition === 1) stats.firstPlaceT++;
                        else if (result.finalPosition === 2) stats.secondPlaceT++;
                        else if (result.finalPosition === 3) stats.thirdPlaceT++;
                        else if (result.finalPosition === 4) stats.fourthPlaceT++;
                    } else {
                        throw new Error(`Tipo de juego inválido en conteo: "${gameType}". Solo se permiten 'H' o 'T'.`);
                    }

                    // Actualizar los valores totales (no los cambios incrementales)
                    stats.totalDanPoints = result.newDanPoints;
                    stats.totalRatePoints = result.newRatePoints;
                    // Actualizar maxRate: tomar el máximo entre el actual y el nuevo rate
                    stats.maxRate = Math.max(stats.maxRate, result.newRatePoints);
                    if (result.newSeasonPoints !== undefined) {
                        stats.totalSeasonPoints = result.newSeasonPoints;
                    }

                    playerStats.set(player.id, stats);

                    // Acumular estadísticas SOLO de temporada 6 cuando el juego suma season
                    if (seasonEligible && seasonIdForGame === 6) {
                        const s = seasonPlayerStats.get(player.id) || {
                            totalGames: 0,
                            firstPlaceH: 0,
                            secondPlaceH: 0,
                            thirdPlaceH: 0,
                            fourthPlaceH: 0,
                            firstPlaceT: 0,
                            secondPlaceT: 0,
                            thirdPlaceT: 0,
                            fourthPlaceT: 0,
                            positionSum: 0,
                            seasonPoints: 0
                        };
                        s.totalGames++;
                        s.positionSum += result.finalPosition;
                        const isH = gameType === 'H';
                        const isT = !isH;
                        if (isH) {
                            if (result.finalPosition === 1) s.firstPlaceH++;
                            else if (result.finalPosition === 2) s.secondPlaceH++;
                            else if (result.finalPosition === 3) s.thirdPlaceH++;
                            else if (result.finalPosition === 4) s.fourthPlaceH++;
                        } else if (isT) {
                            if (result.finalPosition === 1) s.firstPlaceT++;
                            else if (result.finalPosition === 2) s.secondPlaceT++;
                            else if (result.finalPosition === 3) s.thirdPlaceT++;
                            else if (result.finalPosition === 4) s.fourthPlaceT++;
                        }
                        if (typeof result.newSeasonPoints === 'number') {
                            s.seasonPoints = result.newSeasonPoints; // acumulado
                        }
                        seasonPlayerStats.set(player.id, s);
                    }
                }

                // Si este juego corresponde a temporada 6 y torneos 24/25, y es la FILA FINAL conocida, insertar puntos de torneo ahora
                const isSeason6 = seasonIdForGame === 6;
                const isFinalRowT24 = tournamentId === 24 && game.date === '02/04/2024' && Number(game.game) === 1873;
                const isFinalRowT25 = tournamentId === 25 && game.date === '07/12/2024' && Number(game.game) === 1966;
                if (isSeason6 && (isFinalRowT24 || isFinalRowT25) && !tournamentsSeasonPointsInserted.has(tournamentId!)) {
                    const t = await prisma.tournament.findFirst({ where: { id: tournamentId, seasonId: seasonIdForGame! }, include: { tournamentResults: true } });
                    if (t && t.tournamentResults && t.tournamentResults.length > 0) {
                        let insertedForTournament = 0;
                        for (const tr of t.tournamentResults as any[]) {
                            const lastSeasonPoint = await prisma.points.findFirst({
                                where: { playerId: tr.playerId, seasonId: seasonIdForGame!, pointsType: 'SEASON' },
                                orderBy: { id: 'desc' }
                            });
                            const previousAccum = lastSeasonPoint ? Number(lastSeasonPoint.pointsValue) : 0;
                            const accumulated = previousAccum + Number(tr.pointsWon || 0);

                            await prisma.points.create({
                                data: {
                                    playerId: tr.playerId,
                                    seasonId: seasonIdForGame!,
                                    pointsType: 'SEASON',
                                    pointsValue: accumulated,
                                    description: `Torneo ${t.name} - puntos acumulados`,
                                    tournamentId: t.id,
                                    createdAt: t.endDate as any
                                } as any
                            });
                            insertedForTournament++;
                        }
                        tournamentsSeasonPointsInserted.add(tournamentId!);
                        console.log(`🏁 Torneo ${t.name} (ID ${t.id}) — puntos de torneo insertados: ${insertedForTournament} — fecha: ${new Date(t.endDate as any).toISOString().slice(0, 10)}`);

                        // Acumular puntos de torneo en seasonPlayerStats
                        for (const tr of t.tournamentResults as any[]) {
                            const lastSeasonPoint = await prisma.points.findFirst({
                                where: { playerId: tr.playerId, seasonId: seasonIdForGame!, pointsType: 'SEASON' },
                                orderBy: { id: 'desc' }
                            });
                            const finalSeasonPoints = lastSeasonPoint ? Number(lastSeasonPoint.pointsValue) : 0;

                            // Acumular en seasonPlayerStats
                            const s = seasonPlayerStats.get(tr.playerId) || {
                                totalGames: 0,
                                firstPlaceH: 0,
                                secondPlaceH: 0,
                                thirdPlaceH: 0,
                                fourthPlaceH: 0,
                                firstPlaceT: 0,
                                secondPlaceT: 0,
                                thirdPlaceT: 0,
                                fourthPlaceT: 0,
                                positionSum: 0,
                                seasonPoints: 0
                            };
                            s.seasonPoints = finalSeasonPoints;
                            seasonPlayerStats.set(tr.playerId, s);
                        }
                    }
                }

                processedGames++;
                if (processedGames % 200 === 0) {
                    console.log(`📊 Procesados ${processedGames}/${games.length} juegos...`);
                }

            } catch (error) {
                const msg = `❌ Error procesando juego ${processedGames + 1}`;
                // Fail-fast: siempre lanzar
                throw error;
            }
        }

        // (La inserción de puntos de torneo ahora ocurre inline al finalizar cada torneo)

        // 7. Crear/actualizar rankings finales
        console.log('📊 Creando rankings finales...');

        for (const [playerId, stats] of playerStats.entries()) {
            // Buscar el jugador por ID
            const player = await (prisma as any).player.findUnique({
                where: { id: playerId }
            });

            if (!player) {
                console.error(`❌ Jugador con ID ${playerId} no encontrado para ranking`);
                continue;
            }

            // Los seasonPoints se manejan en seasonPlayerStats

            await (prisma as any).playerRanking.upsert({
                where: {
                    playerId_isSanma: {
                        playerId: player.id,
                        isSanma: false // Por ahora todos son de 4 jugadores
                    }
                },
                update: {
                    totalGames: stats.totalGames,
                    firstPlaceH: stats.firstPlaceH,
                    secondPlaceH: stats.secondPlaceH,
                    thirdPlaceH: stats.thirdPlaceH,
                    fourthPlaceH: stats.fourthPlaceH,
                    firstPlaceT: stats.firstPlaceT,
                    secondPlaceT: stats.secondPlaceT,
                    thirdPlaceT: stats.thirdPlaceT,
                    fourthPlaceT: stats.fourthPlaceT,
                    averagePosition: stats.totalGames > 0 ? (stats.positionSum / stats.totalGames) : 0,
                    danPoints: stats.totalDanPoints,
                    ratePoints: stats.totalRatePoints,
                    maxRate: stats.maxRate
                },
                create: {
                    playerId: player.id,
                    isSanma: false, // Por ahora todos son de 4 jugadores
                    totalGames: stats.totalGames,
                    firstPlaceH: stats.firstPlaceH,
                    secondPlaceH: stats.secondPlaceH,
                    thirdPlaceH: stats.thirdPlaceH,
                    fourthPlaceH: stats.fourthPlaceH,
                    firstPlaceT: stats.firstPlaceT,
                    secondPlaceT: stats.secondPlaceT,
                    thirdPlaceT: stats.thirdPlaceT,
                    fourthPlaceT: stats.fourthPlaceT,
                    averagePosition: stats.totalGames > 0 ? (stats.positionSum / stats.totalGames) : 0,
                    danPoints: stats.totalDanPoints,
                    ratePoints: stats.totalRatePoints,
                    maxRate: stats.maxRate
                }
            });
        }

        // 7b. Actualizar columnas de temporada en la MISMA fila (playerId + isSanma)
        if (seasonPlayerStats.size > 0) {
            for (const [playerId, s] of seasonPlayerStats.entries()) {
                const player = await (prisma as any).player.findUnique({ where: { id: playerId } });
                if (!player) continue;

                await (prisma as any).playerRanking.upsert({
                    where: {
                        playerId_isSanma: {
                            playerId: player.id,
                            isSanma: false
                        }
                    },
                    update: {
                        seasonTotalGames: s.totalGames,
                        seasonAveragePosition: s.totalGames > 0 ? (s.positionSum / s.totalGames) : 0,
                        seasonFirstPlaceH: s.firstPlaceH,
                        seasonSecondPlaceH: s.secondPlaceH,
                        seasonThirdPlaceH: s.thirdPlaceH,
                        seasonFourthPlaceH: s.fourthPlaceH,
                        seasonFirstPlaceT: s.firstPlaceT,
                        seasonSecondPlaceT: s.secondPlaceT,
                        seasonThirdPlaceT: s.thirdPlaceT,
                        seasonFourthPlaceT: s.fourthPlaceT,
                        seasonPoints: s.seasonPoints
                    },
                    create: {
                        playerId: player.id,
                        isSanma: false,
                        seasonTotalGames: s.totalGames,
                        seasonAveragePosition: s.totalGames > 0 ? (s.positionSum / s.totalGames) : 0,
                        seasonFirstPlaceH: s.firstPlaceH,
                        seasonSecondPlaceH: s.secondPlaceH,
                        seasonThirdPlaceH: s.thirdPlaceH,
                        seasonFourthPlaceH: s.fourthPlaceH,
                        seasonFirstPlaceT: s.firstPlaceT,
                        seasonSecondPlaceT: s.secondPlaceT,
                        seasonThirdPlaceT: s.thirdPlaceT,
                        seasonFourthPlaceT: s.fourthPlaceT,
                        seasonPoints: s.seasonPoints
                    }
                });
            }
        }

        console.log('✅ CSV cargado exitosamente!');
        console.log(`📊 Juegos procesados: ${processedGames}`);
        console.log(`👥 Jugadores creados: ${createdAtPlayers}`);
        console.log(`📈 Rankings actualizados: ${playerStats.size}`);

    } catch (error) {
        console.error('❌ Error cargando CSV:', error);
        throw error;
    }
}

async function recalculateAllPoints() {
    console.log('🔄 Recalculando todos los puntos acumulados...');

    try {
        // Obtener todos los jugadores
        const players = await prisma.player.findMany({
            select: { id: true, nickname: true }
        });

        console.log(`📊 Procesando ${players.length} jugadores...`);

        for (const player of players) {
            console.log(`👤 Procesando ${player.nickname} (ID: ${player.id})...`);

            // Obtener todos los puntos del jugador ordenados por fecha
            const allPoints = await prisma.points.findMany({
                where: { playerId: player.id },
                orderBy: { id: 'asc' }
            });

            // Calcular puntos acumulados por tipo
            const danPoints: Record<number, number> = {};
            const ratePoints: Record<number, number> = {};
            const seasonPoints: Record<number, number> = {};

            for (const point of allPoints) {
                const seasonId = point.seasonId || 1; // Usar season 1 como default si es null

                if (point.pointsType === 'DAN') {
                    danPoints[seasonId] = Number(point.pointsValue);
                } else if (point.pointsType === 'RATE') {
                    ratePoints[seasonId] = Number(point.pointsValue);
                } else if (point.pointsType === 'SEASON') {
                    seasonPoints[seasonId] = Number(point.pointsValue);
                }
            }

            // Actualizar puntos acumulados
            for (const seasonId of Object.keys(danPoints).map(Number)) {
                const pointToUpdate = allPoints.find(p =>
                    p.playerId === player.id &&
                    p.pointsType === 'DAN' &&
                    (p.seasonId || 1) === seasonId
                );

                if (pointToUpdate) {
                    await prisma.points.update({
                        where: { id: pointToUpdate.id },
                        data: { pointsValue: danPoints[seasonId] }
                    });
                }
            }

            for (const seasonId of Object.keys(ratePoints).map(Number)) {
                const pointToUpdate = allPoints.find(p =>
                    p.playerId === player.id &&
                    p.pointsType === 'RATE' &&
                    (p.seasonId || 1) === seasonId
                );

                if (pointToUpdate) {
                    await prisma.points.update({
                        where: { id: pointToUpdate.id },
                        data: { pointsValue: ratePoints[seasonId] }
                    });
                }
            }

            for (const seasonId of Object.keys(seasonPoints).map(Number)) {
                const pointToUpdate = allPoints.find(p =>
                    p.playerId === player.id &&
                    p.pointsType === 'SEASON' &&
                    (p.seasonId || 1) === seasonId
                );

                if (pointToUpdate) {
                    await prisma.points.update({
                        where: { id: pointToUpdate.id },
                        data: { pointsValue: seasonPoints[seasonId] }
                    });
                }
            }

            console.log(`✅ ${player.nickname} procesado`);
        }

        console.log('🎉 Recalculación completada exitosamente!');
    } catch (error) {
        console.error('❌ Error durante la recalculación:', error);
        throw error;
    }
}

// Cerrar temporada: consolidar SeasonResult desde player_ranking y resetear season_* en rankings
async function closeActiveSeason() {
    const season = await prisma.season.findFirst({ where: { isActive: true }, orderBy: { startDate: 'desc' } });
    if (!season) {
        console.error('❌ No hay temporada activa para cerrar');
        return;
    }
    console.log(`🔒 Cerrando temporada ${season.name} (ID ${season.id})...`);
    const rankings = await (prisma as any).playerRanking.findMany({});
    for (const r of rankings) {
        await (prisma as any).seasonResult.upsert({
            where: { seasonId_playerId_isSanma: { seasonId: season.id, playerId: r.playerId, isSanma: r.isSanma } },
            update: {
                seasonTotalGames: r.seasonTotalGames || 0,
                seasonAveragePosition: r.seasonAveragePosition || 0,
                seasonFirstPlaceH: r.seasonFirstPlaceH || 0,
                seasonSecondPlaceH: r.seasonSecondPlaceH || 0,
                seasonThirdPlaceH: r.seasonThirdPlaceH || 0,
                seasonFourthPlaceH: r.seasonFourthPlaceH || 0,
                seasonFirstPlaceT: r.seasonFirstPlaceT || 0,
                seasonSecondPlaceT: r.seasonSecondPlaceT || 0,
                seasonThirdPlaceT: r.seasonThirdPlaceT || 0,
                seasonFourthPlaceT: r.seasonFourthPlaceT || 0,
                seasonPoints: r.seasonPoints || 0
            },
            create: {
                seasonId: season.id,
                playerId: r.playerId,
                isSanma: r.isSanma,
                seasonTotalGames: r.seasonTotalGames || 0,
                seasonAveragePosition: r.seasonAveragePosition || 0,
                seasonFirstPlaceH: r.seasonFirstPlaceH || 0,
                seasonSecondPlaceH: r.seasonSecondPlaceH || 0,
                seasonThirdPlaceH: r.seasonThirdPlaceH || 0,
                seasonFourthPlaceH: r.seasonFourthPlaceH || 0,
                seasonFirstPlaceT: r.seasonFirstPlaceT || 0,
                seasonSecondPlaceT: r.seasonSecondPlaceT || 0,
                seasonThirdPlaceT: r.seasonThirdPlaceT || 0,
                seasonFourthPlaceT: r.seasonFourthPlaceT || 0,
                seasonPoints: r.seasonPoints || 0
            }
        });
        // Reset de campos season_ en ranking
        await (prisma as any).playerRanking.update({
            where: { playerId_isSanma: { playerId: r.playerId, isSanma: r.isSanma } },
            data: {
                seasonTotalGames: 0,
                seasonAveragePosition: 0,
                seasonFirstPlaceH: 0,
                seasonSecondPlaceH: 0,
                seasonThirdPlaceH: 0,
                seasonFourthPlaceH: 0,
                seasonFirstPlaceT: 0,
                seasonSecondPlaceT: 0,
                seasonThirdPlaceT: 0,
                seasonFourthPlaceT: 0,
                seasonPoints: 0
            }
        });
    }
    console.log('✅ Temporada cerrada y resultados consolidados');
}

async function main() {
    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear') || args.includes('-c');
    const shouldReset = args.includes('--reset') || args.includes('-r');
    const shouldSeed = args.includes('--seed') || args.includes('-s');
    const shouldLoadCSV = args.includes('--csv') || args.includes('-l') || args.length === 0;
    const shouldRecalculate = args.includes('--recalculate') || args.includes('-rc');

    console.log('🚀 Iniciando carga de datos...');
    console.log(`📋 Parámetros: clear=${shouldClear}, reset=${shouldReset}, seed=${shouldSeed}, csv=${shouldLoadCSV}, recalculate=${shouldRecalculate}`);

    try {
        // 1. Reset de Prisma si se solicita (recomendado)
        if (shouldReset) {
            await runReset();
            // Después del reset, siempre ejecutar seed
            await runSeed();
        }
        // 1b. Limpiar base de datos manualmente si se solicita
        else if (shouldClear) {
            await clearDatabase();
        }

        // 2. Ejecutar seed si se solicita (solo si no se hizo reset)
        if (shouldSeed && !shouldReset) {
            await runSeed();
        }

        // 3. Recalcular puntos si se solicita
        if (shouldRecalculate) {
            await recalculateAllPoints();
        }

        // 4. Cargar CSV si se solicita (por defecto)
        if (shouldLoadCSV) {
            await loadCSV();
        }

        console.log('🎉 Proceso completado exitosamente!');

    } catch (error) {
        console.error('❌ Error durante el proceso:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

export { main as loadData };

