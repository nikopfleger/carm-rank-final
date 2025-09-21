import cryptoHelper from '../crypto-helper';

/**
 * Obtener DATABASE_URL para Prisma usando formato JDBC
 */
export function getPrismaDatabaseUrl() {
    return cryptoHelper.getDecryptedDatabaseUrl();
}
