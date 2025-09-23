// lib/database/client.ts
import 'server-only';
import { createAuditInterceptor } from './audit-interceptor';
import { getPrismaClient } from './connection';

// ==========================================================
// Prisma client con interceptor de auditoría (solo servidor)
// ==========================================================
const basePrisma = getPrismaClient();
export const prisma = createAuditInterceptor(basePrisma);

// ==========================================================
// Conexión y chequeos
// ==========================================================
export async function connectToDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Verificar conexión usando el mismo cliente
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection test successful');

    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
}

export async function checkDatabaseHealth() {
  try {
    // Test de conexión
    await prisma.$queryRaw`SELECT 1 as test`;

    // Verificar tablas principales (si no existen, count() lanza y capturamos 0)
    const counts = await Promise.all([
      prisma.country.count().catch(() => 0),
      prisma.player.count().catch(() => 0),
      prisma.season.count().catch(() => 0),
      prisma.game.count().catch(() => 0),
    ]);

    const [countryCount, playerCount, seasonCount, gameCount] = counts;

    return {
      connected: true,
      tablesExist: countryCount >= 0,
      dataExists: countryCount > 0,
      errors: [] as string[],
      stats: {
        countries: countryCount,
        players: playerCount,
        seasons: seasonCount,
        games: gameCount,
      },
    };
  } catch (error) {
    return {
      connected: false,
      tablesExist: false,
      dataExists: false,
      errors: [`Database error: ${error}`],
      stats: {
        countries: 0,
        players: 0,
        seasons: 0,
        games: 0,
      },
    };
  }
}

export async function getDatabaseInfo() {
  try {
    const result = await prisma.$queryRaw<Array<{
      database_name: string;
      current_user: string;
      version: string;
    }>>`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as version
    `;
    return result[0];
  } catch (error) {
    console.error('Error getting database info:', error);
    return null;
  }
}

// ==========================================================
// Helpers para deleted
// ==========================================================
export const includeDeleted = (where: any = {}) => ({
  ...where,
  deleted: undefined,
});

export const onlyDeleted = (where: any = {}) => ({
  ...where,
  deleted: true,
});
