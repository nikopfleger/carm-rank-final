#!/usr/bin/env node

/**
 * 🗑️ Script para limpiar tablas de autenticación
 * 
 * Este script limpia todas las tablas relacionadas con autenticación
 * para permitir una migración limpia a database sessions.
 * 
 * ⚠️ CUIDADO: Esto eliminará todos los usuarios y sesiones existentes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAuthTables() {
    console.log('🗑️ Limpiando tablas de autenticación...\n');

    try {
        // Confirmar antes de proceder
        console.log('⚠️  ADVERTENCIA: Este script eliminará:');
        console.log('   - Todas las sesiones activas');
        console.log('   - Todas las cuentas vinculadas');
        console.log('   - Todos los usuarios');
        console.log('   - Link requests y otros datos de usuarios\n');

        // En un entorno real, aquí podrías pedir confirmación
        // process.stdout.write('¿Continuar? (y/N): ');

        console.log('🧹 Procediendo con la limpieza...\n');

        // 1. Limpiar en orden (respetando foreign keys)
        console.log('🗑️ Eliminando sessions...');
        await prisma.session.deleteMany({});

        console.log('🗑️ Eliminando accounts...');
        await prisma.account.deleteMany({});

        console.log('🗑️ Eliminando verification tokens...');
        await prisma.verificationToken.deleteMany({});

        console.log('🗑️ Eliminando user player links...');
        await prisma.userPlayerLink.deleteMany({});

        console.log('🗑️ Eliminando user player link requests...');
        await prisma.userPlayerLinkRequest.deleteMany({});

        console.log('🗑️ Eliminando usuarios...');
        await prisma.user.deleteMany({});

        console.log('\n✅ Limpieza completada exitosamente!');
        console.log('\n💡 Próximos pasos:');
        console.log('   1. Ejecutar: npm run seed (si tienes seed de usuarios)');
        console.log('   2. O crear usuarios nuevos a través del sistema de login');

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar la limpieza
resetAuthTables()
    .then(() => {
        console.log('\n✅ Script completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script falló:', error);
        process.exit(1);
    });
