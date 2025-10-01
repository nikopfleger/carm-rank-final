// instrumentation.ts
import 'server-only';

export const runtime = 'nodejs';

export async function register() {
    // Nunca durante build
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.STAGE === 'build') {
        return;
    }

    // Evitar en edge
    const maybeEdge = (globalThis as any).EdgeRuntime as unknown;
    if (typeof maybeEdge === 'string' || process.env.NEXT_RUNTIME === 'edge') {
        return;
    }

    try {
        // Warm-up al iniciar el servidor
        const { initializeCache } = await import('./lib/cache/core-cache');
        await initializeCache();
        // (No llamamos a getStatus/ping para no tocar Redis si está caído)
    } catch (err) {
        // No tirar la app: las primeras requests pueden llamar ensureCacheReady() y continuar con DB fallback
        console.error('instrumentation: fallo al inicializar caché (se continuará con DB fallback en runtime):', err);
    }
}
