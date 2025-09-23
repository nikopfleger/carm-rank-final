// components/providers/cache-gate.tsx
import { ensureCacheReady } from '@/lib/cache/core-cache';
import { ReactNode } from 'react';
import 'server-only';

interface CacheGateProps { children: ReactNode }

export default async function CacheGate({ children }: CacheGateProps) {
    console.log('🚪 CacheGate: Iniciando...');
    try {
        await ensureCacheReady();
        console.log('🚪 CacheGate: Cache lista, renderizando children');
        return <>{children}</>;
    } catch (e: any) {
        console.error('💥 CacheGate: error inicializando cache:', e);
        return (
            <html>
                <body style={{ padding: 24, fontFamily: 'system-ui' }}>
                    <h1>⚠️ Error cargando caché</h1>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{String(e?.message ?? e)}</pre>
                </body>
            </html>
        );
    }
}
