// lib/cache/core-cache.ts
import { getRedisCache } from '@/lib/cache/redis-wrapper';
import { prisma } from '@/lib/database/client';
import { getPlayersWithRanking } from '@/lib/database/queries/players-optimized';
import 'server-only';

export type DanConfig = {
    id: number; rank: string; sanma: boolean;
    minPoints: number; maxPoints: number;
    firstPlace: number; secondPlace: number; thirdPlace: number; fourthPlace: number | null;
    isProtected: boolean; color: string; cssClass: string; isLastRank: boolean;
};
export type RateConfig = {
    id: number; name: string; sanma: boolean;
    firstPlace: number; secondPlace: number; thirdPlace: number; fourthPlace: number | null;
    adjustmentRate: number; adjustmentLimit: number; minAdjustment: number;
};
export type SeasonConfig = {
    id: number; name: string; startDate: Date; endDate: Date; isActive: boolean; isClosed: boolean;
};
export type PlayerRanking = {
    id: number; nickname: string; fullname: string | null; country_id: number; player_id: number;
    birthday: Date | null; country_iso: string; country_name: string; createdAt: Date; updatedAt: Date | null;
    position: number; total_games: number; average_position: number; dan_points: number; rate_points: number; max_rate: number;
    win_rate: number; rank: string; rank_spanish?: string; rank_color?: string;
    season_points?: number; season_average_position?: number;
    rank_min_points?: number; rank_max_points?: number | null; next_rank?: string;
    first_place_h: number; second_place_h: number; third_place_h: number; fourth_place_h: number;
    first_place_t: number; second_place_t: number; third_place_t: number; fourth_place_t: number;
    trend_dan_delta10?: number; trend_season_delta10?: number;
};
export type CacheShape = {
    dan: DanConfig[]; rate: RateConfig[]; seasons: SeasonConfig[]; ranking: PlayerRanking[];
    ranking_4p_general_activos: PlayerRanking[]; ranking_4p_general_todos: PlayerRanking[];
    ranking_4p_temporada_activos: PlayerRanking[]; ranking_4p_temporada_todos: PlayerRanking[];
    ranking_3p_general_activos: PlayerRanking[]; ranking_3p_general_todos: PlayerRanking[];
    ranking_3p_temporada_activos: PlayerRanking[]; ranking_3p_temporada_todos: PlayerRanking[];
    colors: Record<string, string>; lastUpdated: number;
};

// Estado interno
let cache: CacheShape | null = null;
let initPromise: Promise<void> | null = null;
let lastInitAt = 0;
let isInitializing = false;

// Warm-up guards
const INIT_TIMEOUT_MS = 25_000;
const RETRY_COOLDOWN_MS = 30_000;
let lastInitErrorAt = 0;

const REDIS_KEY = 'core-cache:v1';

const IS_BUILD =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.STAGE === 'build';

function shouldWarmupNow() {
    if (process.env.DISABLE_CACHE_WARMUP === '1') return false;
    if (IS_BUILD) return false;
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
        throw new Error('DB URL no definida. Seteá POSTGRES_PRISMA_URL (o DATABASE_URL/POSTGRES_URL_NON_POOLING).');
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
    const raw = await prisma.danConfig.findMany({ where: { deleted: false }, orderBy: { minPoints: 'asc' } });
    return raw.map(r => ({
        id: r.id, rank: r.rank, sanma: r.sanma, minPoints: r.minPoints, maxPoints: r.maxPoints || 0,
        firstPlace: r.firstPlace, secondPlace: r.secondPlace, thirdPlace: r.thirdPlace, fourthPlace: r.fourthPlace,
        isProtected: r.isProtected, color: r.color, cssClass: r.cssClass, isLastRank: r.isLastRank,
    }));
}
async function loadRate(): Promise<RateConfig[]> {
    const raw = await prisma.rateConfig.findMany({ where: { deleted: false }, orderBy: { name: 'asc' } });
    return raw.map(r => ({
        id: r.id, name: r.name, sanma: r.sanma,
        firstPlace: r.firstPlace, secondPlace: r.secondPlace, thirdPlace: r.thirdPlace, fourthPlace: r.fourthPlace,
        adjustmentRate: r.adjustmentRate, adjustmentLimit: r.adjustmentLimit, minAdjustment: r.minAdjustment,
    }));
}
async function loadSeasons(): Promise<SeasonConfig[]> {
    const raw = await prisma.season.findMany({ where: { deleted: false }, orderBy: { startDate: 'desc' } });
    return raw.map(r => ({
        id: r.id, name: r.name, startDate: r.startDate, endDate: r.endDate, isActive: r.isActive, isClosed: r.isClosed,
    }));
}
async function loadRanking(): Promise<PlayerRanking[]> {
    const players = await getPlayersWithRanking();
    return players.map(p => ({ ...p }));
}
async function loadRanking4pGeneralActivos() { return (await getPlayersWithRanking(undefined, 'GENERAL', false, false)).map(p => ({ ...p })); }
async function loadRanking4pGeneralTodos() { return (await getPlayersWithRanking(undefined, 'GENERAL', true, false)).map(p => ({ ...p })); }
async function loadRanking4pTemporadaActivos() { return (await getPlayersWithRanking(undefined, 'TEMPORADA', false, false)).map(p => ({ ...p })); }
async function loadRanking4pTemporadaTodos() { return (await getPlayersWithRanking(undefined, 'TEMPORADA', true, false)).map(p => ({ ...p })); }
async function loadRanking3pGeneralActivos() { return (await getPlayersWithRanking(undefined, 'GENERAL', false, true)).map(p => ({ ...p })); }
async function loadRanking3pGeneralTodos() { return (await getPlayersWithRanking(undefined, 'GENERAL', true, true)).map(p => ({ ...p })); }
async function loadRanking3pTemporadaActivos() { return (await getPlayersWithRanking(undefined, 'TEMPORADA', false, true)).map(p => ({ ...p })); }
async function loadRanking3pTemporadaTodos() { return (await getPlayersWithRanking(undefined, 'TEMPORADA', true, true)).map(p => ({ ...p })); }

async function loadColors(dan: DanConfig[], rate: RateConfig[]): Promise<Record<string, string>> {
    const colors: Record<string, string> = {};
    dan.forEach(d => {
        colors[`dan:${d.id}`] = d.color;
        colors[`dan:${d.rank}`] = d.color;
    });
    rate.forEach(r => {
        colors[`rate:${r.id}`] = '#6B7280';
        colors[`rate:${r.name}`] = '#6B7280';
    });
    return colors;
}

// === Inicialización / Warm-up ===
export async function initializeCache(): Promise<void> {
    if (cache) return;
    if (!shouldWarmupNow()) return;   // nunca en build

    if (isInitializing) {
        if (initPromise) await initPromise;
        return;
    }
    if (initPromise) return initPromise;

    // cooldown tras error
    const now = Date.now();
    if (lastInitErrorAt && now - lastInitErrorAt < RETRY_COOLDOWN_MS) {
        initPromise = Promise.resolve();
        try { await initPromise; } finally { initPromise = null; }
        return;
    }

    isInitializing = true;
    requireDbUrl();

    const doInit = async () => {
        // 1) Intentar leer desde Redis (si disponible)
        const rc = getRedisCache();
        if (rc) {
            try {
                const serialized = await rc.get(REDIS_KEY);
                if (serialized) {
                    cache = JSON.parse(serialized) as CacheShape;
                    lastInitAt = Date.now();
                    console.log('🚀 Cache inicializado desde Redis');
                    return;
                }
            } catch (e) {
                console.log('❌ Redis no disponible, usando DB directo');
                // Si Redis falla, NO usar cache en memoria, ir directo a DB
                return;
            }
        }

        // 2) Si no hay Redis o falla, NO usar cache en memoria
        // Las funciones getDan(), getRate(), etc. deberían ir directo a DB
        console.log('📊 Redis no configurado, usando DB directo');
    };

    initPromise = withTimeout(doInit(), INIT_TIMEOUT_MS, 'warm-up de cache')
        .catch((e) => { lastInitErrorAt = Date.now(); throw e; })
        .finally(() => { isInitializing = false; initPromise = null; });

    return initPromise;
}

// Gate a usar en layouts/server components para “bloquear” hasta que haya caché (o DB fallback)
export async function ensureCacheReady(): Promise<void> {
    if (cache) return;
    if (!shouldWarmupNow()) {
        // en build no hacemos warm-up; los lectores deberían evitarse en SSG o usar DB directo
        return;
    }
    if (isInitializing && initPromise) {
        await initPromise;
        return;
    }
    await initializeCache();
}

// === Lectores ===
export function getDan(): DanConfig[] {
    if (!cache) {
        // Si no hay cache (Redis no disponible), ir directo a DB
        console.log('📊 getDan: Redis no disponible, usando DB directo');
        throw new Error('Cache not available - use DB directly');
    }
    return cache.dan;
}

// === Lectores directos de DB (cuando Redis no está disponible) ===
export async function getDanDirect(): Promise<DanConfig[]> {
    console.log('📊 getDanDirect: Cargando desde DB');
    return await loadDan();
}

export async function getRateDirect(): Promise<RateConfig[]> {
    console.log('📊 getRateDirect: Cargando desde DB');
    return await loadRate();
}

export async function getSeasonsDirect(): Promise<SeasonConfig[]> {
    console.log('📊 getSeasonsDirect: Cargando desde DB');
    return await loadSeasons();
}

export async function getRankingDirect(): Promise<PlayerRanking[]> {
    console.log('📊 getRankingDirect: Cargando desde DB');
    return await loadRanking();
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
            rank: input.rank, sanma: input.sanma, minPoints: input.minPoints, maxPoints: input.maxPoints,
            firstPlace: input.firstPlace, secondPlace: input.secondPlace, thirdPlace: input.thirdPlace, fourthPlace: input.fourthPlace,
            isProtected: input.isProtected, color: input.color, cssClass: input.cssClass, isLastRank: input.isLastRank,
        },
        update: {
            rank: input.rank, sanma: input.sanma, minPoints: input.minPoints, maxPoints: input.maxPoints,
            firstPlace: input.firstPlace, secondPlace: input.secondPlace, thirdPlace: input.thirdPlace, fourthPlace: input.fourthPlace,
            isProtected: input.isProtected, color: input.color, cssClass: input.cssClass, isLastRank: input.isLastRank,
        },
    });

    if (cache) {
        const idx = cache.dan.findIndex(d => d.id === saved.id);
        const dto: DanConfig = {
            id: saved.id, rank: saved.rank, sanma: saved.sanma, minPoints: saved.minPoints, maxPoints: saved.maxPoints || 0,
            firstPlace: saved.firstPlace, secondPlace: saved.secondPlace, thirdPlace: saved.thirdPlace, fourthPlace: saved.fourthPlace,
            isProtected: saved.isProtected, color: saved.color, cssClass: saved.cssClass, isLastRank: saved.isLastRank,
        };
        if (idx >= 0) cache.dan[idx] = dto; else cache.dan.push(dto);
        cache.colors[`dan:${saved.id}`] = saved.color;
        cache.colors[`dan:${saved.rank}`] = saved.color;
        cache.lastUpdated = Date.now();
        try {
            const rc = getRedisCache();
            if (rc) await rc.set(REDIS_KEY, JSON.stringify(cache));
        } catch { }
    }
    return saved;
}

export async function upsertRate(input: Omit<RateConfig, 'id'> & { id?: number }) {
    const saved = await prisma.rateConfig.upsert({
        where: { id: input.id ?? -1 },
        create: {
            name: input.name, sanma: input.sanma, firstPlace: input.firstPlace, secondPlace: input.secondPlace,
            thirdPlace: input.thirdPlace, fourthPlace: input.fourthPlace,
            adjustmentRate: input.adjustmentRate, adjustmentLimit: input.adjustmentLimit, minAdjustment: input.minAdjustment,
        },
        update: {
            name: input.name, sanma: input.sanma, firstPlace: input.firstPlace, secondPlace: input.secondPlace,
            thirdPlace: input.thirdPlace, fourthPlace: input.fourthPlace,
            adjustmentRate: input.adjustmentRate, adjustmentLimit: input.adjustmentLimit, minAdjustment: input.minAdjustment,
        },
    });

    if (cache) {
        const idx = cache.rate.findIndex(r => r.id === saved.id);
        const dto: RateConfig = {
            id: saved.id, name: saved.name, sanma: saved.sanma,
            firstPlace: saved.firstPlace, secondPlace: saved.secondPlace, thirdPlace: saved.thirdPlace, fourthPlace: saved.fourthPlace,
            adjustmentRate: saved.adjustmentRate, adjustmentLimit: saved.adjustmentLimit, minAdjustment: saved.minAdjustment,
        };
        if (idx >= 0) cache.rate[idx] = dto; else cache.rate.push(dto);
        cache.colors[`rate:${saved.id}`] = '#6B7280';
        cache.colors[`rate:${saved.name}`] = '#6B7280';
        cache.lastUpdated = Date.now();
        try {
            const rc = getRedisCache();
            if (rc) await rc.set(REDIS_KEY, JSON.stringify(cache));
        } catch { }
    }
    return saved;
}

export async function invalidateRanking() {
    if (!cache) return;
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
    try {
        const rc = getRedisCache();
        if (rc) await rc.set(REDIS_KEY, JSON.stringify(cache));
    } catch { }
}

export async function invalidateConfigs() {
    if (!cache) return;
    const [dan, rate, seasons] = await Promise.all([loadDan(), loadRate(), loadSeasons()]);
    cache.dan = dan; cache.rate = rate; cache.seasons = seasons;
    cache.colors = await loadColors(dan, rate);
    cache.lastUpdated = Date.now();
    try {
        const rc = getRedisCache();
        if (rc) await rc.set(REDIS_KEY, JSON.stringify(cache));
    } catch { }
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
export function isCacheReady(): boolean { return !!cache; }
