import { PrismaClient } from '@prisma/client';
import { initializeConfigurations } from '../config-initializer';
import { getPrismaDatabaseUrl } from './config';
import { createVersionedPrismaClient } from './prisma-interceptor';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createVersionedPrismaClient> | undefined;
};

// Crear cliente base de Prisma con URL desencriptada
// Configurar URL con parámetros de pool
const databaseUrl = getPrismaDatabaseUrl();
const urlWithPool = `${databaseUrl}?connection_limit=${process.env.DB_POOL_MAX || '50'}&pool_timeout=${process.env.DB_POOL_TIMEOUT || '30000'}`;

const basePrisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: urlWithPool,
    },
  },
});

// Aplicar extensión de versionado y soft delete
export const prisma = globalForPrisma.prisma ?? createVersionedPrismaClient(basePrisma);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;

  // En desarrollo, limpiar conexiones periódicamente
  if (typeof window === 'undefined') {
    setInterval(async () => {
      try {
        await prisma.$disconnect();
        console.log('🧹 Development: Cleaned up database connections');
      } catch (error) {
        // Ignorar errores de desconexión en desarrollo
      }
    }, 60000); // Cada minuto
  }
}

// Función de test de conexión con SELECT 1
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection test successful:', result);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

let keepAliveTimer: NodeJS.Timeout | null = null;

export function startKeepAlive(intervalMs: number = 60000): NodeJS.Timeout {
  if (keepAliveTimer) {
    return keepAliveTimer;
  }
  keepAliveTimer = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1 as keepalive`;
    } catch (error) {
      console.error('💔 Keep-alive ping failed:', error);
    }
  }, intervalMs);
  return keepAliveTimer;
}

/**
 * Database connection and health check
 */
export async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test connection with SELECT 1
    const connectionTest = await testDatabaseConnection();
    if (!connectionTest) {
      throw new Error('Database connection test failed');
    }

    // Initialize configuration cache after database connection
    await initializeConfigurations();

    // Start keep-alive (solo en producción)
    if (process.env.NODE_ENV === 'production') {
      const keepAliveInterval = parseInt(process.env.DB_KEEP_ALIVE_INTERVAL || '60000');
      startKeepAlive(keepAliveInterval);
      console.log(`💓 Keep-alive started every ${keepAliveInterval}ms`);
    }

    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw new Error('Failed to connect to database');
  }
}

/**
 * Database health check
 */
export async function checkDatabaseHealth() {
  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1 as test`;

    // Check if main tables exist by trying to count records
    const counts = await Promise.all([
      prisma.country.count().catch(() => 0),
      prisma.player.count().catch(() => 0),
      prisma.season.count().catch(() => 0),
      prisma.game.count().catch(() => 0),
    ]);

    const [countryCount, playerCount, seasonCount, gameCount] = counts;
    const tablesExist = countryCount >= 0; // If we can count, tables exist
    const dataExists = countryCount > 0;

    return {
      connected: true,
      tablesExist,
      dataExists,
      errors: [],
      stats: {
        countries: countryCount,
        players: playerCount,
        seasons: seasonCount,
        games: gameCount,
      }
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
      }
    };
  }
}

/**
 * Initialize database with seed data
 */
export async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database...');

    // Check if data already exists
    const countryCount = await prisma.country.count();
    if (countryCount > 0) {
      console.log('✅ Database already initialized');
      return;
    }

    // Run seed data - solo en el servidor
    if (typeof window === 'undefined') {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      await execAsync('npm run db:seed');
      console.log('✅ Database initialized with seed data');
    } else {
      console.log('⚠️ Database initialization skipped in browser environment');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

/**
 * Get database info
 */
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

// Función helper para filtrar solo elementos eliminados
export const onlyDeleted = (deleted: boolean = true) => ({ deleted });