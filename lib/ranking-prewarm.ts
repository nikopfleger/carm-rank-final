import { getPlayersWithRanking } from '@/lib/database/queries/players';
import { rankingCache } from '@/lib/ranking-cache';

let prewarmed = false;

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
                    const body = { success: true, data: players, total: players.length, message: 'prewarmed' };
                    const json = JSON.stringify(body);
                    rankingCache.set(key, players);
                    rankingCache.setJson(key, json);
                }
            }
        }

        prewarmed = true;
        console.log('🔥 Ranking cache prewarmed');
    } catch (e) {
        console.warn('⚠️ Failed to prewarm ranking cache:', e);
    }
}


