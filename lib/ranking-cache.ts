type RankingCacheKey = string;

export interface RankingQueryKey {
    seasonId?: number;
    type: 'GENERAL' | 'TEMPORADA';
    includeInactive: boolean;
    sanma?: boolean;
}

function buildKey({ seasonId, type, includeInactive, sanma }: RankingQueryKey): RankingCacheKey {
    return `${seasonId ?? 'none'}|${type}|${includeInactive ? 'all' : 'active'}|${sanma === undefined ? 'both' : sanma ? '3p' : '4p'}`;
}

class RankingCache<TValue = any> {
    private store = new Map<RankingCacheKey, TValue>();

    get(params: RankingQueryKey): TValue | null {
        const key = buildKey(params);
        const entry = this.store.get(key);
        if (!entry) return null;
        return entry;
    }

    set(params: RankingQueryKey, value: TValue): void {
        const key = buildKey(params);
        this.store.set(key, value);
    }

    invalidate(params?: Partial<RankingQueryKey>): void {
        if (!params || Object.keys(params).length === 0) {
            this.store.clear();
            return;
        }
        const entries = Array.from(this.store.keys());
        for (const key of entries) {
            const [kSeasonId, kType, kActive, kSanma] = key.split('|');
            if (params.seasonId !== undefined && String(params.seasonId ?? 'none') !== kSeasonId) continue;
            if (params.type !== undefined && params.type !== (kType as any)) continue;
            if (params.includeInactive !== undefined && (params.includeInactive ? 'all' : 'active') !== kActive) continue;
            if (params.sanma !== undefined && (params.sanma ? '3p' : '4p') !== kSanma && !(kSanma === 'both')) continue;
            this.store.delete(key);
        }
    }

    size(): number {
        return this.store.size;
    }
}

export const rankingCache = new RankingCache<any[]>();


