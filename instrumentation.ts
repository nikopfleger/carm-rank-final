// instrumentation.ts
export const runtime = 'nodejs';

export async function register() {
    // Evitar correr durante el build por si acaso
    if (process.env.NEXT_PHASE === 'phase-production-build') return;

    try {
        // Import dinámico para evitar cargar módulos server-only si no estamos en Node
        const { initializeCache, getCacheStatus } = await import('./lib/cache/core-cache');
        console.log('🔧 instrumentation: iniciando warm-up de caché...');
        await initializeCache();
        console.log('✅ instrumentation: caché lista', getCacheStatus());
    } catch (err) {
        console.error('💥 instrumentation: fallo al inicializar la caché:', err);
        // No tiramos la app: CacheGate cubrirá en el primer render
    }
}
