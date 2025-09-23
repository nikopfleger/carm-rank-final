// instrumentation.ts
export const runtime = 'nodejs';

export async function register() {
    // Evitar correr durante el build por si acaso
    if (process.env.NEXT_PHASE === 'phase-production-build') return;

    try {
        // OpenTelemetry básico (si el paquete está disponible)
        try {
            // Evitar warnings de Webpack por dependencia dinámica y evitar fallo si no está instalado
            const dynImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>;
            const otel = await dynImport('@vercel/otel').catch(() => null);
            if (otel?.registerOTel) {
                await otel.registerOTel({ serviceName: process.env.OTEL_SERVICE_NAME || 'carm-rank' });
                if (process.env.NODE_ENV !== 'production') {
                    console.log('🛰️ OTel: registrado proveedor por defecto');
                }
            } else if (process.env.NODE_ENV !== 'production') {
                console.log('ℹ️ OTel no configurado (paquete ausente o deshabilitado)');
            }
        } catch (otelErr) {
            if (process.env.NODE_ENV !== 'production') {
                console.log('ℹ️ OTel no configurado (paquete ausente o deshabilitado)');
            }
        }

        // Import dinámico para evitar cargar módulos server-only si no estamos en Node
        const { initializeCache, getCacheStatus } = await import('./lib/cache/core-cache');
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔧 instrumentation: iniciando warm-up de caché...');
        }
        await initializeCache();
        if (process.env.NODE_ENV !== 'production') {
            console.log('✅ instrumentation: caché lista', getCacheStatus());
        }
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('💥 instrumentation: fallo al inicializar la caché:', err);
        }
        // No tiramos la app: CacheGate cubrirá en el primer render
    }
}
