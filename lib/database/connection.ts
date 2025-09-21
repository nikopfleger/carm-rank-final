// Legacy file - Use lib/database/client.ts for Prisma
// This file is kept for backward compatibility

export { prisma as db } from './client';
export { 
  connectToDatabase,
  checkDatabaseHealth,
  getDatabaseInfo 
} from './client';

// Transaction helper (deprecated - use Prisma.$transaction directly)
export async function withTransaction<T>(
  callback: (db: any) => Promise<T>
): Promise<T> {
  // This function is now a placeholder, as Prisma handles transactions differently.
  // For Prisma transactions, use `prisma.$transaction` directly.
  throw new Error("withTransaction is deprecated. Use Prisma's $transaction directly from lib/database/client.ts");
}
