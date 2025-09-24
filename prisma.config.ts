import { defineConfig } from '@prisma/config';
import { config as loadEnv } from 'dotenv';
import { getDatabaseUrl, getDirectUrl } from './lib/database/connection-config';

// Cargar variables desde .env cuando Prisma detecta prisma.config.ts
loadEnv();

// Configurar variables de entorno dinámicamente
const databaseUrl = getDatabaseUrl();
const directUrl = getDirectUrl();

// Establecer las variables de entorno para que Prisma las use
process.env.DATABASE_URL = databaseUrl;
if (directUrl && directUrl !== databaseUrl) {
    process.env.DIRECT_URL = directUrl;
}

// Logging para verificar configuración de Supabase
console.log('🔗 Supabase Database Configuration:');
console.log(`📡 Main URL: ${databaseUrl.replace(/:[^:]*@/, ':***@')}`);
if (directUrl && directUrl !== databaseUrl) {
    console.log(`🔗 Direct URL: ${directUrl.replace(/:[^:]*@/, ':***@')}`);
}

export default defineConfig({
    schema: './prisma/schema.prisma',
    migrations: {
        seed: 'tsx prisma/seed.ts',
    },
});
