import { defineConfig } from '@prisma/config';
import { config as loadEnv } from 'dotenv';

// Cargar variables desde .env cuando Prisma detecta prisma.config.ts
loadEnv();

export default defineConfig({
    schema: './prisma/schema.prisma',
    migrations: {
        seed: 'tsx prisma/seed.ts',
    },
});


