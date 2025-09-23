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
    updatedAt: Date;

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
    colors: Record<string, string>;
    lastUpdated: number;
};

// Estado interno (por instancia/lambda)
let cache: CacheShape | null = null;
let initPromise: Promise<void> | null = null;
let lastInitAt = 0;

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

// === Warm-up idempotente ===
export async function initializeCache(): Promise<void> {
    if (cache) {
        console.log('🔥 Cache ya inicializada, saltando...');
        return;
    }
    if (initPromise) {
        console.log('🔥 Cache inicializándose, esperando...');
        return initPromise;
    }

    console.log('🔥 Iniciando warm-up de cache...');
    const startTime = Date.now();

    initPromise = (async () => {
        try {
            console.log('📊 Cargando configuraciones Dan...');
            const dan = await loadDan();
            console.log(`✅ Dan configs cargadas: ${dan.length} configuraciones`);

            console.log('📊 Cargando configuraciones Rate...');
            const rate = await loadRate();
            console.log(`✅ Rate configs cargadas: ${rate.length} configuraciones`);

            console.log('📊 Cargando temporadas...');
            const seasons = await loadSeasons();
            console.log(`✅ Temporadas cargadas: ${seasons.length} temporadas`);

            console.log('📊 Cargando ranking de jugadores...');
            const ranking = await loadRanking();
            console.log(`✅ Ranking cargado: ${ranking.length} jugadores`);

            console.log('🎨 Cargando colores...');
            const colors = await loadColors(dan, rate);
            console.log(`✅ Colores cargados: ${Object.keys(colors).length} colores`);

            cache = {
                dan,
                rate,
                seasons,
                ranking,
                colors,
                lastUpdated: Date.now(),
            };

            lastInitAt = Date.now();
            const duration = Date.now() - startTime;
            console.log(
                `🎉 CACHE READY! Inicializada en ${duration}ms`,
            );
        } catch (error) {
            console.error('❌ Error inicializando cache:', error);
            throw error;
        }
    })();

    try {
        await initPromise;
    } finally {
        initPromise = null; // si falla, permite reintentar
    }
}

// === Gate síncrono para Server Components/Routes ===
export async function ensureCacheReady() {
    console.log('🔍 ensureCacheReady called, cache status:', !!cache);
    if (!cache) {
        console.log('🚀 Cache not ready, initializing...');
        await initializeCache();
        console.log('✅ Cache initialization completed');
    } else {
        console.log('✅ Cache already ready');
    }
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
    }
    return saved;
}

export async function invalidateRanking() {
    if (!cache) return;
    console.log('🔄 Actualizando ranking en cache...');
    cache.ranking = await loadRanking();
    cache.lastUpdated = Date.now();
    console.log(`✅ Ranking actualizado - ${cache.ranking.length} jugadores`);
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
