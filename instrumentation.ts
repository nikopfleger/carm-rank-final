import 'server-only';

export const runtime = 'nodejs';

export async function register() {
    // Evitar durante build
    if (process.env.NEXT_PHASE === 'phase-production-build') return;
    if (typeof globalThis.EdgeRuntime === 'string' || process.env.NEXT_RUNTIME === 'edge') {
        console.log('🔧 instrumentation: Edge runtime detectado → skip warm-up');
        return;
    }

    try {
        const { initializeCache, getCacheStatus } = await import('./lib/cache/core-cache');
        console.log('🔧 instrumentation(node): iniciando warm-up de caché...');
        await initializeCache();
        console.log('✅ instrumentation(node): caché lista', getCacheStatus());
    } catch (err) {
        console.error('💥 instrumentation(node): fallo al inicializar la caché:', err);
        // No tiramos la app: CacheGate cubrirá en el primer render
    }
}
