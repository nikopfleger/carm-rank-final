/**
 * Configuración dinámica de conexión a base de datos
 * Basado en la solución de Digital Ocean para prepared statements
 */

export function getDatabaseUrl(): string {
    const stage = process.env.STAGE;

    // Para migraciones, usar conexión directa (sin pooling)
    if (stage === 'migrate') {
        return process.env.DATABASE_URL_MIGRATE || process.env.DATABASE_URL || '';
    }

    // Para aplicación, usar pooling si está disponible
    if (stage === 'run' || stage === 'build') {
        return process.env.DATABASE_URL_POOL || process.env.DATABASE_URL || '';
    }

    // Para desarrollo y otros casos, usar URL por defecto
    return process.env.DATABASE_URL || '';
}

export function getDirectUrl(): string {
    return process.env.DIRECT_URL || process.env.DATABASE_URL || '';
}

/**
 * Configuración de Prisma basada en el stage actual
 */
export function getPrismaConfig() {
    const url = getDatabaseUrl();
    const directUrl = getDirectUrl();

    return {
        url,
        directUrl: directUrl !== url ? directUrl : undefined,
    };
}

/**
 * Configuración de datasource para Prisma
 */
export function getDatasourceConfig() {
    const url = getDatabaseUrl();
    const directUrl = getDirectUrl();

    return {
        provider: 'postgresql' as const,
        url,
        directUrl: directUrl !== url ? directUrl : undefined,
    };
}

/**
 * Logging para debugging de conexiones
 */
export function logConnectionInfo() {
    const stage = process.env.STAGE || 'development';
    const url = getDatabaseUrl();
    const directUrl = getDirectUrl();

    console.log(`🔗 Database connection for stage: ${stage}`);
    console.log(`📡 URL: ${url.replace(/:[^:]*@/, ':***@')}`);
    if (directUrl && directUrl !== url) {
        console.log(`🔗 Direct URL: ${directUrl.replace(/:[^:]*@/, ':***@')}`);
    }

    // Verificar flags importantes
    if (url.includes('pgbouncer=true')) {
        console.log('✅ Using connection pooling (pgbouncer=true)');
    } else {
        console.log('⚠️  Using direct connection (no pooling)');
    }

    if (url.includes('prepareThreshold=0')) {
        console.log('✅ Prepared statements disabled (prepareThreshold=0)');
    }
}
