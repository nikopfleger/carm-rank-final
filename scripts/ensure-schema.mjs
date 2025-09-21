import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureSchema() {
    try {
        console.log('🔍 Verificando si existe schema "carm"...');

        // Crear el schema si no existe
        await prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS carm;`;

        console.log('✅ Schema "carm" verificado/creado exitosamente');

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Error creando schema:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

ensureSchema();
