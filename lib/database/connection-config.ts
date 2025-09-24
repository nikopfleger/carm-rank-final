/** Agrega un query param si no existe */
function ensureParam(url: string, key: string, value: string) {
    if (!url) return url;
    if (url.includes(`${key}=`)) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}${key}=${value}`;
}

/** Normaliza flags según sea pooler (6543/pooler.supabase.com) o directo */
function normalizeUrl(raw: string): string {
    if (!raw) return '';

    const isPooler =
        raw.includes('pooler.supabase.com') || raw.includes(':6543');

    let url = raw;

    // SSL (si no es localhost)
    if (!url.includes('sslmode=') && !url.includes('localhost')) {
        url = ensureParam(url, 'sslmode', 'require');
    }

    // Pooler ⇒ desactivar prepared statements
    if (isPooler) {
        url = ensureParam(url, 'pgbouncer', 'true');
        url = ensureParam(url, 'prepareThreshold', '0');
    }

    return url;
}

/**
 * Elegí URL según stage:
 * - migrate  → DIRECTA (5432) si existe
 * - run/build/dev → POOLED si existe, sino DIRECTA
 * Soporta tus nombres y los alternativos:
 *   pooled:  POSTGRES_PRISMA_URL | POSTGRES_URL | DATABASE_URL
 *   direct:  POSTGRES_URL_NON_POOLING | POSTGRES_URL_NON_POOLING | DATABASE_URL_MIGRATE
 */
export function getDatabaseUrl(): string {
    const stage = process.env.STAGE;

    const pooledRaw =
        process.env.POSTGRES_PRISMA_URL ||
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL ||
        '';

    const directRaw =
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.DATABASE_URL_MIGRATE ||
        '';

    if (stage === 'migrate') {
        return normalizeUrl(directRaw || pooledRaw);
    }
    if (stage === 'run' || stage === 'build') {
        return normalizeUrl(pooledRaw || directRaw);
    }
    // dev/otros
    return normalizeUrl(pooledRaw || directRaw);
}

export function getDirectUrl(): string {
    const directRaw =
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.DATABASE_URL_MIGRATE ||
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL ||
        '';
    return normalizeUrl(directRaw);
}

/** Config para Prisma Client */
export function getPrismaConfig() {
    const url = getDatabaseUrl();
    const directUrl = getDirectUrl();
    return {
        url,
        directUrl: directUrl && directUrl !== url ? directUrl : undefined,
    };
}

/** Config de datasource si alguna vez la necesitás */
export function getDatasourceConfig() {
    const { url, directUrl } = getPrismaConfig();
    return {
        provider: 'postgresql' as const,
        url,
        directUrl,
    };
}

/** Logging seguro para debug */
export function logConnectionInfo() {
    const stage = process.env.STAGE || 'development';
    const { url, directUrl } = getPrismaConfig();
    const mask = (s: string) => s.replace(/:[^:@/]*@/, ':***@');

    console.log(`🔗 DB stage: ${stage}`);
    console.log(`📡 URL: ${url ? mask(url) : '(vacía)'}`);
    if (directUrl) console.log(`🔗 POSTGRES_URL_NON_POOLING: ${mask(directUrl)}`);

    const isPooler =
        (url || '').includes('pooler.supabase.com') || (url || '').includes(':6543');
    if (isPooler) {
        console.log('✅ Pooler detectado → pgbouncer=true & prepareThreshold=0');
    } else {
        console.log('ℹ️ Conexión directa (sin pooler)');
    }
}
