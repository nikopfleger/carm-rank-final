import { redisCache } from '@/lib/cache/redis-wrapper';
import { prisma } from '@/lib/database/client';
import { getPlayersWithRanking } from '@/lib/database/queries/players-optimized';
import 'server-only';

export type DanConfig = {
    id: number;
    rank: string;
    sanma: boolean;
    minPoints: number;
    maxPoints: number;
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    fourthPlace: number | null;
    isProtected: boolean;
    color: string;
    cssClass: string;
    isLastRank: boolean;
};

export type RateConfig = {
    id: number;
    name: string;
    sanma: boolean;
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    fourthPlace: number | null;
    adjustmentRate: number;
    adjustmentLimit: number;
    minAdjustment: number;
};

export type SeasonConfig = {
    id: number;
    name: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    isClosed: boolean;
};

export type PlayerRanking = {
    id: number;
    nickname: string;
    fullname: string | null;
    country_id: number;
    player_id: number; // legajo
    birthday: Date | null;
    country_iso: string;
    country_name: string;
    createdAt: Date;
    updatedAt: Date | null;

    // Ranking fields
    position: number;
    total_games: number;
    average_position: number;
    dan_points: number;
    rate_points: number;
    max_rate: number;
    win_rate: number;
    rank: string;
    rank_spanish?: string;
    rank_color?: string;

    // Season fields
    season_points?: number;
    season_average_position?: number;

    // Datos para progreso de rango
    rank_min_points?: number;
    rank_max_points?: number | null;
    next_rank?: string;
    first_place_h: number;
    second_place_h: number;
    third_place_h: number;
    fourth_place_h: number;
    first_place_t: number;
    second_place_t: number;
    third_place_t: number;
    fourth_place_t: number;

    // Tendencias
    trend_dan_delta10?: number;
    trend_season_delta10?: number;
};

export type CacheShape = {
    dan: DanConfig[];
    rate: RateConfig[];
    seasons: SeasonConfig[];
    ranking: PlayerRanking[];
    // 4p rankings
    ranking_4p_general_activos: PlayerRanking[];
    ranking_4p_general_todos: PlayerRanking[];
    ranking_4p_temporada_activos: PlayerRanking[];
    ranking_4p_temporada_todos: PlayerRanking[];
    // 3p rankings
    ranking_3p_general_activos: PlayerRanking[];
    ranking_3p_general_todos: PlayerRanking[];
    ranking_3p_temporada_activos: PlayerRanking[];
    ranking_3p_temporada_todos: PlayerRanking[];
    colors: Record<string, string>;
    lastUpdated: number;
};

// Estado interno (por instancia/lambda)
let cache: CacheShape | null = null;
let initPromise: Promise<void> | null = null;
let lastInitAt = 0;

// ==== Warm-up guards / helpers (agregar arriba del archivo) ====
const INIT_TIMEOUT_MS = 25_000;       // corta warm-up colgado
const RETRY_COOLDOWN_MS = 30_000;     // evita reintentos en loop si falla
let lastInitErrorAt = 0;

// Clave Redis (sin TTL - persiste hasta invalidación manual)
const REDIS_KEY = 'core-cache:v1';

function shouldWarmupNow() {
    // saltar en build o si está deshabilitado explícitamente
    const stage = process.env.STAGE || process.env.NODE_ENV || '';
    if (process.env.DISABLE_CACHE_WARMUP === '1') return false;
    if (stage === 'build' || process.env.NEXT_PHASE === 'phase-production-build') return false;
    return true;
}

function requireDbUrl() {
    const url =
        process.env.POSTGRES_PRISMA_URL ||
        process.env.DATABASE_URL ||
        process.env.DIRECT_URL ||
        process.env.DATABASE_URL_POOL ||
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL_MIGRATE;

    if (!url) {
        throw new Error(
            'DB URL no definida. Seteá POSTGRES_PRISMA_URL (o DATABASE_URL/POSTGRES_URL_NON_POOLING) antes del warm-up de cache.'
        );
    }
}

function withTimeout<T>(p: Promise<T>, ms: number, label = 'operación'): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(`Timeout en ${label} (${ms}ms)`)), ms);
        p.then(
            (v) => { clearTimeout(t); resolve(v); },
            (e) => { clearTimeout(t); reject(e); }
        );
    });
}


// === Loaders (DB) ===
async function loadDan(): Promise<DanConfig[]> {
    const raw = await prisma.danConfig.findMany({
        where: { deleted: false },
        orderBy: { minPoints: 'asc' },
    });
    return raw.map(r => ({
        id: r.id,
        rank: r.rank,
        sanma: r.sanma,
        minPoints: r.minPoints,
        maxPoints: r.maxPoints || 0,
        firstPlace: r.firstPlace,
        secondPlace: r.secondPlace,
        thirdPlace: r.thirdPlace,
        fourthPlace: r.fourthPlace,
        isProtected: r.isProtected,
        color: r.color,
        cssClass: r.cssClass,
        isLastRank: r.isLastRank,
    }));
}

async function loadRate(): Promise<RateConfig[]> {
    const raw = await prisma.rateConfig.findMany({
        where: { deleted: false },
        orderBy: { name: 'asc' },
    });
    return raw.map(r => ({
        id: r.id,
        name: r.name,
        sanma: r.sanma,
        firstPlace: r.firstPlace,
        secondPlace: r.secondPlace,
        thirdPlace: r.thirdPlace,
        fourthPlace: r.fourthPlace,
        adjustmentRate: r.adjustmentRate,
        adjustmentLimit: r.adjustmentLimit,
        minAdjustment: r.minAdjustment,
    }));
}

async function loadSeasons(): Promise<SeasonConfig[]> {
    const raw = await prisma.season.findMany({
        where: { deleted: false },
        orderBy: { startDate: 'desc' },
    });
    return raw.map(r => ({
        id: r.id,
        name: r.name,
        startDate: r.startDate,
        endDate: r.endDate,
        isActive: r.isActive,
        isClosed: r.isClosed,
    }));
}

let rankingFallbackArmed = false;

async function loadRanking(): Promise<PlayerRanking[]> {
    const players = await getPlayersWithRanking(); // usa la versión ya corregida (sin cache dentro)
    return players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        fullname: p.fullname,
        country_id: p.country_id,
        player_id: p.player_id,
        birthday: p.birthday,
        country_iso: p.country_iso,
        country_name: p.country_name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        position: p.position,
        total_games: p.total_games,
        average_position: p.average_position,
        dan_points: p.dan_points,
        rate_points: p.rate_points,
        max_rate: p.max_rate,
        win_rate: p.win_rate,
        rank: p.rank,
        rank_spanish: p.rank_spanish,
        rank_color: p.rank_color,
        season_points: p.season_points,
        season_average_position: p.season_average_position,
        rank_min_points: p.rank_min_points,
        rank_max_points: p.rank_max_points,
        next_rank: p.next_rank,
        first_place_h: p.first_place_h,
        second_place_h: p.second_place_h,
        third_place_h: p.third_place_h,
        fourth_place_h: p.fourth_place_h,
        first_place_t: p.first_place_t,
        second_place_t: p.second_place_t,
        third_place_t: p.third_place_t,
        fourth_place_t: p.fourth_place_t,
        trend_dan_delta10: p.trend_dan_delta10,
        trend_season_delta10: p.trend_season_delta10,
    }));
}

async function loadRanking4pGeneralActivos(): Promise<PlayerRanking[]> {
    const players = await getPlayersWithRanking(undefined, 'GENERAL', false, false);
    return players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        fullname: p.fullname,
        country_id: p.country_id,
        player_id: p.player_id,
        birthday: p.birthday,
        country_iso: p.country_iso,
        country_name: p.country_name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        position: p.position,
        total_games: p.total_games,
        average_position: p.average_position,
        dan_points: p.dan_points,
        rate_points: p.rate_points,
        max_rate: p.max_rate,
        win_rate: p.win_rate,
        rank: p.rank,
        rank_spanish: p.rank_spanish,
        rank_color: p.rank_color,
        season_points: p.season_points,
        season_average_position: p.season_average_position,
        rank_min_points: p.rank_min_points,
        rank_max_points: p.rank_max_points,
        next_rank: p.next_rank,
        first_place_h: p.first_place_h,
        second_place_h: p.second_place_h,
        third_place_h: p.third_place_h,
        fourth_place_h: p.fourth_place_h,
        first_place_t: p.first_place_t,
        second_place_t: p.second_place_t,
        third_place_t: p.third_place_t,
        fourth_place_t: p.fourth_place_t,
        trend_dan_delta10: p.trend_dan_delta10,
        trend_season_delta10: p.trend_season_delta10,
    }));
}

async function loadRanking4pGeneralTodos(): Promise<PlayerRanking[]> {
    const players = await getPlayersWithRanking(undefined, 'GENERAL', true, false);
    return players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        fullname: p.fullname,
        country_id: p.country_id,
        player_id: p.player_id,
        birthday: p.birthday,
        country_iso: p.country_iso,
        country_name: p.country_name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        position: p.position,
        total_games: p.total_games,
        average_position: p.average_position,
        dan_points: p.dan_points,
        rate_points: p.rate_points,
        max_rate: p.max_rate,
        win_rate: p.win_rate,
        rank: p.rank,
        rank_spanish: p.rank_spanish,
        rank_color: p.rank_color,
        season_points: p.season_points,
        season_average_position: p.season_average_position,
        rank_min_points: p.rank_min_points,
        rank_max_points: p.rank_max_points,
        next_rank: p.next_rank,
        first_place_h: p.first_place_h,
        second_place_h: p.second_place_h,
        third_place_h: p.third_place_h,
        fourth_place_h: p.fourth_place_h,
        first_place_t: p.first_place_t,
        second_place_t: p.second_place_t,
        third_place_t: p.third_place_t,
        fourth_place_t: p.fourth_place_t,
        trend_dan_delta10: p.trend_dan_delta10,
        trend_season_delta10: p.trend_season_delta10,
    }));
}

async function loadRanking4pTemporadaActivos(): Promise<PlayerRanking[]> {
    const players = await getPlayersWithRanking(undefined, 'TEMPORADA', false, false);
    return players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        fullname: p.fullname,
        country_id: p.country_id,
        player_id: p.player_id,
        birthday: p.birthday,
        country_iso: p.country_iso,
        country_name: p.country_name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        position: p.position,
        total_games: p.total_games,
        average_position: p.average_position,
        dan_points: p.dan_points,
        rate_points: p.rate_points,
        max_rate: p.max_rate,
        win_rate: p.win_rate,
        rank: p.rank,
        rank_spanish: p.rank_spanish,
        rank_color: p.rank_color,
        season_points: p.season_points,
        season_average_position: p.season_average_position,
        rank_min_points: p.rank_min_points,
        rank_max_points: p.rank_max_points,
        next_rank: p.next_rank,
        first_place_h: p.first_place_h,
        second_place_h: p.second_place_h,
        third_place_h: p.third_place_h,
        fourth_place_h: p.fourth_place_h,
        first_place_t: p.first_place_t,
        second_place_t: p.second_place_t,
        third_place_t: p.third_place_t,
        fourth_place_t: p.fourth_place_t,
        trend_dan_delta10: p.trend_dan_delta10,
        trend_season_delta10: p.trend_season_delta10,
    }));
}

async function loadRanking4pTemporadaTodos(): Promise<PlayerRanking[]> {
    const players = await getPlayersWithRanking(undefined, 'TEMPORADA', true, false);
    return players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        fullname: p.fullname,
        country_id: p.country_id,
        player_id: p.player_id,
        birthday: p.birthday,
        country_iso: p.country_iso,
        country_name: p.country_name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        position: p.position,
        total_games: p.total_games,
        average_position: p.average_position,
        dan_points: p.dan_points,
        rate_points: p.rate_points,
        max_rate: p.max_rate,
        win_rate: p.win_rate,
        rank: p.rank,
        rank_spanish: p.rank_spanish,
        rank_color: p.rank_color,
        season_points: p.season_points,
        season_average_position: p.season_average_position,
        rank_min_points: p.rank_min_points,
        rank_max_points: p.rank_max_points,
        next_rank: p.next_rank,
        first_place_h: p.first_place_h,
        second_place_h: p.second_place_h,
        third_place_h: p.third_place_h,
        fourth_place_h: p.fourth_place_h,
        first_place_t: p.first_place_t,
        second_place_t: p.second_place_t,
        third_place_t: p.third_place_t,
        fourth_place_t: p.fourth_place_t,
        trend_dan_delta10: p.trend_dan_delta10,
        trend_season_delta10: p.trend_season_delta10,
    }));
}

async function loadRanking3pGeneralActivos(): Promise<PlayerRanking[]> {
    const players = await getPlayersWithRanking(undefined, 'GENERAL', false, true);
    return players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        fullname: p.fullname,
        country_id: p.country_id,
        player_id: p.player_id,
        birthday: p.birthday,
        country_iso: p.country_iso,
        country_name: p.country_name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        position: p.position,
        total_games: p.total_games,
        average_position: p.average_position,
        dan_points: p.dan_points,
        rate_points: p.rate_points,
        max_rate: p.max_rate,
        win_rate: p.win_rate,
        rank: p.rank,
        rank_spanish: p.rank_spanish,
        rank_color: p.rank_color,
        season_points: p.season_points,
        season_average_position: p.season_average_position,
        rank_min_points: p.rank_min_points,
        rank_max_points: p.rank_max_points,
        next_rank: p.next_rank,
        first_place_h: p.first_place_h,
        second_place_h: p.second_place_h,
        third_place_h: p.third_place_h,
        fourth_place_h: p.fourth_place_h,
        first_place_t: p.first_place_t,
        second_place_t: p.second_place_t,
        third_place_t: p.third_place_t,
        fourth_place_t: p.fourth_place_t,
        trend_dan_delta10: p.trend_dan_delta10,
        trend_season_delta10: p.trend_season_delta10,
    }));
}

async function loadRanking3pGeneralTodos(): Promise<PlayerRanking[]> {
    const players = await getPlayersWithRanking(undefined, 'GENERAL', true, true);
    return players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        fullname: p.fullname,
        country_id: p.country_id,
        player_id: p.player_id,
        birthday: p.birthday,
        country_iso: p.country_iso,
        country_name: p.country_name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        position: p.position,
        total_games: p.total_games,
        average_position: p.average_position,
        dan_points: p.dan_points,
        rate_points: p.rate_points,
        max_rate: p.max_rate,
        win_rate: p.win_rate,
        rank: p.rank,
        rank_spanish: p.rank_spanish,
        rank_color: p.rank_color,
        season_points: p.season_points,
        season_average_position: p.season_average_position,
        rank_min_points: p.rank_min_points,
        rank_max_points: p.rank_max_points,
        next_rank: p.next_rank,
        first_place_h: p.first_place_h,
        second_place_h: p.second_place_h,
        third_place_h: p.third_place_h,
        fourth_place_h: p.fourth_place_h,
        first_place_t: p.first_place_t,
        second_place_t: p.second_place_t,
        third_place_t: p.third_place_t,
        fourth_place_t: p.fourth_place_t,
        trend_dan_delta10: p.trend_dan_delta10,
        trend_season_delta10: p.trend_season_delta10,
    }));
}

async function loadRanking3pTemporadaActivos(): Promise<PlayerRanking[]> {
    const players = await getPlayersWithRanking(undefined, 'TEMPORADA', false, true);
    return players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        fullname: p.fullname,
        country_id: p.country_id,
        player_id: p.player_id,
        birthday: p.birthday,
        country_iso: p.country_iso,
        country_name: p.country_name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        position: p.position,
        total_games: p.total_games,
        average_position: p.average_position,
        dan_points: p.dan_points,
        rate_points: p.rate_points,
        max_rate: p.max_rate,
        win_rate: p.win_rate,
        rank: p.rank,
        rank_spanish: p.rank_spanish,
        rank_color: p.rank_color,
        season_points: p.season_points,
        season_average_position: p.season_average_position,
        rank_min_points: p.rank_min_points,
        rank_max_points: p.rank_max_points,
        next_rank: p.next_rank,
        first_place_h: p.first_place_h,
        second_place_h: p.second_place_h,
        third_place_h: p.third_place_h,
        fourth_place_h: p.fourth_place_h,
        first_place_t: p.first_place_t,
        second_place_t: p.second_place_t,
        third_place_t: p.third_place_t,
        fourth_place_t: p.fourth_place_t,
        trend_dan_delta10: p.trend_dan_delta10,
        trend_season_delta10: p.trend_season_delta10,
    }));
}

async function loadRanking3pTemporadaTodos(): Promise<PlayerRanking[]> {
    const players = await getPlayersWithRanking(undefined, 'TEMPORADA', true, true);
    return players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        fullname: p.fullname,
        country_id: p.country_id,
        player_id: p.player_id,
        birthday: p.birthday,
        country_iso: p.country_iso,
        country_name: p.country_name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        position: p.position,
        total_games: p.total_games,
        average_position: p.average_position,
        dan_points: p.dan_points,
        rate_points: p.rate_points,
        max_rate: p.max_rate,
        win_rate: p.win_rate,
        rank: p.rank,
        rank_spanish: p.rank_spanish,
        rank_color: p.rank_color,
        season_points: p.season_points,
        season_average_position: p.season_average_position,
        rank_min_points: p.rank_min_points,
        rank_max_points: p.rank_max_points,
        next_rank: p.next_rank,
        first_place_h: p.first_place_h,
        second_place_h: p.second_place_h,
        third_place_h: p.third_place_h,
        fourth_place_h: p.fourth_place_h,
        first_place_t: p.first_place_t,
        second_place_t: p.second_place_t,
        third_place_t: p.third_place_t,
        fourth_place_t: p.fourth_place_t,
        trend_dan_delta10: p.trend_dan_delta10,
        trend_season_delta10: p.trend_season_delta10,
    }));
}



async function loadColors(dan: DanConfig[], rate: RateConfig[]): Promise<Record<string, string>> {
    const colors: Record<string, string> = {};
    dan.forEach(d => {
        colors[`dan:${d.id}`] = d.color;
        colors[`dan:${d.rank}`] = d.color;
    });
    // Rate no tiene color en tu esquema: usamos gris por defecto
    rate.forEach(r => {
        colors[`rate:${r.id}`] = '#6B7280';
        colors[`rate:${r.name}`] = '#6B7280';
    });
    return colors;
}

export async function initializeCache(): Promise<void> {
    if (cache) {
        // ya inicializada
        return;
    }
    if (initPromise) {
        // single-flight: reutilizar la misma promesa si otra llamada ya inició
        return initPromise;
    }
    if (!shouldWarmupNow()) {
        console.log('⏭️ Cache warm-up omitido (build/disabled stage).');
        return;
    }

    // Evitar reintentos en loop si falló recién
    const now = Date.now();
    if (lastInitErrorAt && now - lastInitErrorAt < RETRY_COOLDOWN_MS) {
        const left = Math.max(0, RETRY_COOLDOWN_MS - (now - lastInitErrorAt));
        console.log(`⏳ Cooldown tras error de warm-up: reintento en ~${Math.ceil(left / 1000)}s`);
        // devolvemos una promesa resuelta para no romper llamadas concurrentes
        initPromise = Promise.resolve();
        try { await initPromise; } finally { initPromise = null; }
        return;
    }

    // Validar que exista la URL que Prisma va a usar (evita el flood de logs)
    requireDbUrl();

    console.log('🔥 Iniciando warm-up de cache...');
    const startedAt = Date.now();

    const doInit = async () => {
        // 1) Intentar leer desde Redis (si está habilitado); si falla o no encuentra datos, seguimos con DB
        try {
            console.log('🔍 initializeCache - Intentando leer desde Redis...');
            const serialized = await redisCache.get(REDIS_KEY);
            if (serialized) {
                const parsed = JSON.parse(serialized) as CacheShape;
                cache = parsed;
                lastInitAt = Date.now();
                console.log('📦 Cache cargada desde Redis - Datos obtenidos del CACHE');
                return;
            } else {
                console.warn('⚠️ No se encontró caché en Redis. Cargando desde DB y guardando en Redis...');
            }
        } catch (e) {
            console.warn('⚠️ No se pudo leer caché desde Redis. Cargando desde DB y guardando en Redis:', e);
        }

        // 2) Cargar desde DB en paralelo (fallback siempre disponible)
        const [
            dan, rate, seasons, ranking,
            r4ga, r4gt, r4ta, r4tt,
            r3ga, r3gt, r3ta, r3tt,
        ] = await Promise.all([
            loadDan(),
            loadRate(),
            loadSeasons(),
            loadRanking(),
            loadRanking4pGeneralActivos(),
            loadRanking4pGeneralTodos(),
            loadRanking4pTemporadaActivos(),
            loadRanking4pTemporadaTodos(),
            loadRanking3pGeneralActivos(),
            loadRanking3pGeneralTodos(),
            loadRanking3pTemporadaActivos(),
            loadRanking3pTemporadaTodos(),
        ]);

        const colors = await loadColors(dan, rate);

        cache = {
            dan,
            rate,
            seasons,
            ranking,
            ranking_4p_general_activos: r4ga,
            ranking_4p_general_todos: r4gt,
            ranking_4p_temporada_activos: r4ta,
            ranking_4p_temporada_todos: r4tt,
            ranking_3p_general_activos: r3ga,
            ranking_3p_general_todos: r3gt,
            ranking_3p_temporada_activos: r3ta,
            ranking_3p_temporada_todos: r3tt,
            colors,
            lastUpdated: Date.now(),
        };

        lastInitAt = Date.now();
        console.log(`🎉 CACHE READY en ${lastInitAt - startedAt}ms - Datos obtenidos de la DB`);

        // 3) Persistir en Redis (best effort, sin TTL)
        try {
            const ok = await redisCache.set(REDIS_KEY, JSON.stringify(cache));
            if (ok) console.log('📝 Cache persistida en Redis');
        } catch (e) {
            console.warn('⚠️ No se pudo persistir caché en Redis:', e);
        }
    };

    // single-flight + timeout + cooldown on error
    initPromise = withTimeout(doInit(), INIT_TIMEOUT_MS, 'warm-up de cache')
        .catch((e) => {
            lastInitErrorAt = Date.now();
            throw e;
        })
        .finally(() => {
            initPromise = null;
        });

    return initPromise;
}


export async function ensureCacheReady() {
    console.log('🔍 ensureCacheReady:', { ready: !!cache, stage: process.env.STAGE });

    if (cache) return;

    if (!shouldWarmupNow()) {
        console.log('⏭️ ensureCacheReady: saltando warm-up (build/disabled).');
        return;
    }

    // si hubo un error reciente, no spamear
    const now = Date.now();
    if (lastInitErrorAt && now - lastInitErrorAt < RETRY_COOLDOWN_MS) {
        console.log('⏳ ensureCacheReady: en cooldown tras un fallo, no se reintenta aún.');
        return;
    }

    await initializeCache();
}


// === Lectores ===
export function getDan(): DanConfig[] {
    if (!cache) throw new Error('Cache not initialized');
    return cache.dan;
}

export function getRate(): RateConfig[] {
    if (!cache) throw new Error('Cache not initialized');
    return cache.rate;
}

export function getSeasons(): SeasonConfig[] {
    if (!cache) throw new Error('Cache not initialized');
    return cache.seasons;
}

export function getRanking(): PlayerRanking[] {
    if (!cache) throw new Error('Cache not initialized');
    return cache.ranking;
}

export function getRanking4pGeneralActivos(): PlayerRanking[] {
    if (!cache) throw new Error('Cache not initialized');
    return cache.ranking_4p_general_activos;
}

export function getRanking4pGeneralTodos(): PlayerRanking[] {
    if (!cache) throw new Error('Cache not initialized');
    return cache.ranking_4p_general_todos;
}

export function getRanking4pTemporadaActivos(): PlayerRanking[] {
    if (!cache) throw new Error('Cache not initialized');
    return cache.ranking_4p_temporada_activos;
}

export function getRanking4pTemporadaTodos(): PlayerRanking[] {
    if (!cache) throw new Error('Cache not initialized');
    return cache.ranking_4p_temporada_todos;
}

export function getRanking3pGeneralActivos(): PlayerRanking[] {
    if (!cache) throw new Error('Cache not initialized');
    return cache.ranking_3p_general_activos;
}

export function getRanking3pGeneralTodos(): PlayerRanking[] {
    if (!cache) throw new Error('Cache not initialized');
    return cache.ranking_3p_general_todos;
}

export function getRanking3pTemporadaActivos(): PlayerRanking[] {
    if (!cache) throw new Error('Cache not initialized');
    return cache.ranking_3p_temporada_activos;
}

export function getRanking3pTemporadaTodos(): PlayerRanking[] {
    if (!cache) throw new Error('Cache not initialized');
    return cache.ranking_3p_temporada_todos;
}

export function getColors(): Record<string, string> {
    if (!cache) throw new Error('Cache not initialized');
    return cache.colors;
}

// === Mutaciones (write-through) ===
export async function upsertDan(input: Omit<DanConfig, 'id'> & { id?: number }) {
    const saved = await prisma.danConfig.upsert({
        where: { id: input.id ?? -1 },
        create: {
            rank: input.rank,
            sanma: input.sanma,
            minPoints: input.minPoints,
            maxPoints: input.maxPoints,
            firstPlace: input.firstPlace,
            secondPlace: input.secondPlace,
            thirdPlace: input.thirdPlace,
            fourthPlace: input.fourthPlace,
            isProtected: input.isProtected,
            color: input.color,
            cssClass: input.cssClass,
            isLastRank: input.isLastRank,
        },
        update: {
            rank: input.rank,
            sanma: input.sanma,
            minPoints: input.minPoints,
            maxPoints: input.maxPoints,
            firstPlace: input.firstPlace,
            secondPlace: input.secondPlace,
            thirdPlace: input.thirdPlace,
            fourthPlace: input.fourthPlace,
            isProtected: input.isProtected,
            color: input.color,
            cssClass: input.cssClass,
            isLastRank: input.isLastRank,
        },
    });

    // Write-through en memoria
    if (cache) {
        const idx = cache.dan.findIndex(d => d.id === saved.id);
        const dto: DanConfig = {
            id: saved.id,
            rank: saved.rank,
            sanma: saved.sanma,
            minPoints: saved.minPoints,
            maxPoints: saved.maxPoints || 0,
            firstPlace: saved.firstPlace,
            secondPlace: saved.secondPlace,
            thirdPlace: saved.thirdPlace,
            fourthPlace: saved.fourthPlace,
            isProtected: saved.isProtected,
            color: saved.color,
            cssClass: saved.cssClass,
            isLastRank: saved.isLastRank,
        };
        if (idx >= 0) cache.dan[idx] = dto;
        else cache.dan.push(dto);

        cache.colors[`dan:${saved.id}`] = saved.color;
        cache.colors[`dan:${saved.rank}`] = saved.color;
        cache.lastUpdated = Date.now();

        // Persistir en Redis (best effort, sin TTL)
        try {
            const ok = await redisCache.set(REDIS_KEY, JSON.stringify(cache));
            if (ok) console.log('📝 Dan config persistida en Redis');
        } catch (e) {
            console.warn('⚠️ No se pudo persistir dan config en Redis:', e);
        }
    }
    return saved;
}

export async function upsertRate(input: Omit<RateConfig, 'id'> & { id?: number }) {
    const saved = await prisma.rateConfig.upsert({
        where: { id: input.id ?? -1 },
        create: {
            name: input.name,
            sanma: input.sanma,
            firstPlace: input.firstPlace,
            secondPlace: input.secondPlace,
            thirdPlace: input.thirdPlace,
            fourthPlace: input.fourthPlace,
            adjustmentRate: input.adjustmentRate,
            adjustmentLimit: input.adjustmentLimit,
            minAdjustment: input.minAdjustment,
        },
        update: {
            name: input.name,
            sanma: input.sanma,
            firstPlace: input.firstPlace,
            secondPlace: input.secondPlace,
            thirdPlace: input.thirdPlace,
            fourthPlace: input.fourthPlace,
            adjustmentRate: input.adjustmentRate,
            adjustmentLimit: input.adjustmentLimit,
            minAdjustment: input.minAdjustment,
        },
    });

    // Write-through en memoria
    if (cache) {
        const idx = cache.rate.findIndex(r => r.id === saved.id);
        const dto: RateConfig = {
            id: saved.id,
            name: saved.name,
            sanma: saved.sanma,
            firstPlace: saved.firstPlace,
            secondPlace: saved.secondPlace,
            thirdPlace: saved.thirdPlace,
            fourthPlace: saved.fourthPlace,
            adjustmentRate: saved.adjustmentRate,
            adjustmentLimit: saved.adjustmentLimit,
            minAdjustment: saved.minAdjustment,
        };
        if (idx >= 0) cache.rate[idx] = dto;
        else cache.rate.push(dto);

        cache.colors[`rate:${saved.id}`] = '#6B7280';
        cache.colors[`rate:${saved.name}`] = '#6B7280';
        cache.lastUpdated = Date.now();

        // Persistir en Redis (best effort, sin TTL)
        try {
            const ok = await redisCache.set(REDIS_KEY, JSON.stringify(cache));
            if (ok) console.log('📝 Rate config persistida en Redis');
        } catch (e) {
            console.warn('⚠️ No se pudo persistir rate config en Redis:', e);
        }
    }
    return saved;
}

export async function invalidateRanking() {
    if (!cache) return;
    console.log('🔄 Actualizando rankings en cache...');

    // Actualizar todos los rankings
    cache.ranking = await loadRanking();
    cache.ranking_4p_general_activos = await loadRanking4pGeneralActivos();
    cache.ranking_4p_general_todos = await loadRanking4pGeneralTodos();
    cache.ranking_4p_temporada_activos = await loadRanking4pTemporadaActivos();
    cache.ranking_4p_temporada_todos = await loadRanking4pTemporadaTodos();
    cache.ranking_3p_general_activos = await loadRanking3pGeneralActivos();
    cache.ranking_3p_general_todos = await loadRanking3pGeneralTodos();
    cache.ranking_3p_temporada_activos = await loadRanking3pTemporadaActivos();
    cache.ranking_3p_temporada_todos = await loadRanking3pTemporadaTodos();

    cache.lastUpdated = Date.now();
    console.log(`✅ Rankings actualizados - 4p general activos: ${cache.ranking_4p_general_activos.length}, 4p general todos: ${cache.ranking_4p_general_todos.length}, 4p temporada activos: ${cache.ranking_4p_temporada_activos.length}, 4p temporada todos: ${cache.ranking_4p_temporada_todos.length}, 3p general activos: ${cache.ranking_3p_general_activos.length}, 3p general todos: ${cache.ranking_3p_general_todos.length}, 3p temporada activos: ${cache.ranking_3p_temporada_activos.length}, 3p temporada todos: ${cache.ranking_3p_temporada_todos.length} jugadores`);

    // Persistir en Redis (best effort, sin TTL)
    try {
        const ok = await redisCache.set(REDIS_KEY, JSON.stringify(cache));
        if (ok) console.log('📝 Rankings persistidos en Redis');
    } catch (e) {
        console.warn('⚠️ No se pudo persistir rankings en Redis:', e);
    }
}

export async function invalidateConfigs() {
    if (!cache) return;
    console.log('🔄 Actualizando configuraciones en cache...');

    const [dan, rate, seasons] = await Promise.all([loadDan(), loadRate(), loadSeasons()]);
    cache.dan = dan;
    cache.rate = rate;
    cache.seasons = seasons;
    cache.colors = await loadColors(dan, rate);
    cache.lastUpdated = Date.now();

    console.log('✅ Configuraciones actualizadas');

    // Persistir en Redis (best effort, sin TTL)
    try {
        const ok = await redisCache.set(REDIS_KEY, JSON.stringify(cache));
        if (ok) console.log('📝 Configuraciones persistidas en Redis');
    } catch (e) {
        console.warn('⚠️ No se pudo persistir configuraciones en Redis:', e);
    }
}

// === Utilidades ===
export function getCacheStatus() {
    return {
        ready: !!cache,
        lastInitAt,
        lastUpdated: cache?.lastUpdated || 0,
        playerCount: cache?.ranking.length || 0,
        danCount: cache?.dan.length || 0,
        rateCount: cache?.rate.length || 0,
    };
}

export function isCacheReady(): boolean {
    return !!cache;
}
