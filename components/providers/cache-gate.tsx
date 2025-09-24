// components/providers/cache-gate.tsx
import { ensureCacheReady } from '@/lib/cache/core-cache';
import { ReactNode } from 'react';
import 'server-only';

interface CacheGateProps { children: ReactNode }

const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.SKIP_CACHE_WARMUP === '1'; // flag manual si la querés

export default async function CacheGate({ children }: CacheGateProps) {
    // 👉 No calientes la cache durante el build (ni cuando vos lo fuerces)
    if (isBuildPhase) {
        return <>{children}</>;
    }

    console.log('🚪 CacheGate: Iniciando...');

    try {
        // (opcional) proteger con timeout para no atascar el render
        const withTimeout = <T,>(p: Promise<T>, ms: number) =>
            Promise.race([
                p,
                new Promise<T>((_, rej) =>
                    setTimeout(() => rej(new Error(`Cache warm-up timeout after ${ms}ms`)), ms)
                ),
            ]);

        await withTimeout(ensureCacheReady(), 8000);

        console.log('🚪 CacheGate: Cache lista, renderizando children');
        return <>{children}</>;
    } catch (e: any) {
        console.error('💥 CacheGate: error inicializando cache:', e);
        // Sugerencia: no tirar una UI de error dura; dejá pasar y logueá
        return <>{children}</>;
    }
}
