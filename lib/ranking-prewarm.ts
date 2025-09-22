import { getPlayersWithRanking } from '@/lib/database/queries/players';
import { rankingCache } from '@/lib/ranking-cache';

let prewarmed = false;
let refreshTimer: NodeJS.Timeout | null = null;
let lastRefreshAt: number | null = null;
let refreshIntervalMs = 5 * 60 * 1000;

export async function prewarmRankingCache(): Promise<void> {
    if (prewarmed) return;
    try {
        const types: Array<'GENERAL' | 'TEMPORADA'> = ['GENERAL', 'TEMPORADA'];
        const bools: boolean[] = [false, true];

        for (const type of types) {
            for (const includeInactive of bools) {
                for (const sanma of bools) {
                    const key = { type, includeInactive, sanma } as const;
                    const players = await getPlayersWithRanking(undefined, type, includeInactive, sanma);
                    const now = Date.now();
                    const body = {
                        success: true,
                        data: players,
                        total: players.length,
                        refreshedAt: new Date(now).toISOString(),
                        nextRefreshAt: new Date(now + refreshIntervalMs).toISOString(),
                        message: 'prewarmed'
                    };
                    const json = JSON.stringify(body);
                    rankingCache.set(key, players);
                    rankingCache.setJson(key, json);
                }
            }
        }

        prewarmed = true;
        lastRefreshAt = Date.now();
        console.log('🔥 Ranking cache prewarmed');
    } catch (e) {
        console.warn('⚠️ Failed to prewarm ranking cache:', e);
    }
}

export function startRankingAutoRefresh(intervalMs: number = 5 * 60 * 1000): void {
    if (refreshTimer) return;
    refreshIntervalMs = intervalMs;
    refreshTimer = setInterval(async () => {
        try {
            prewarmed = false; // forzar refresh
            await prewarmRankingCache();
        } catch { }
    }, intervalMs);
    console.log(`🧊 Ranking cache auto-refresh started every ${intervalMs}ms`);
}

export function getRankingRefreshSchedule() {
    const now = Date.now();
    const last = lastRefreshAt ?? now;
    return {
        refreshedAt: new Date(last).toISOString(),
        nextRefreshAt: new Date(last + refreshIntervalMs).toISOString(),
    };
}


