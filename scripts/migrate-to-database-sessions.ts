#!/usr/bin/env node

/**
 * 🔄 Script de migración de JWT a Database Sessions
 * 
 * Este script migra usuarios existentes que fueron creados con JWT sessions
 * para que funcionen con database sessions, creando los registros Account necesarios.
 */

import { PrismaClient } from '@prisma/client';
import { getPrismaDatabaseUrl } from '../lib/database/config';

// Cargar variables de entorno
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: getPrismaDatabaseUrl()
        }
    }
});

async function migrateToDatabaseSessions() {
    console.log('🔄 Iniciando migración a Database Sessions...\n');

    try {
        // 1. Obtener usuarios que no tienen cuentas vinculadas
        const usersWithoutAccounts = await prisma.user.findMany({
            where: {
                accounts: {
                    none: {}
                }
            },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                createdAt: true
            }
        });

        console.log(`📊 Encontrados ${usersWithoutAccounts.length} usuarios sin cuentas vinculadas\n`);

        if (usersWithoutAccounts.length === 0) {
            console.log('✅ No hay usuarios que migrar. Todos ya tienen accounts vinculadas.');
            return;
        }

        // 2. Para cada usuario, crear un Account de Google
        for (const user of usersWithoutAccounts) {
            console.log(`👤 Migrando usuario: ${user.email}`);

            // Crear Account vinculada a Google para este usuario
            await prisma.account.create({
                data: {
                    userId: user.id,
                    type: "oauth",
                    provider: "google",
                    providerAccountId: `migrated_${user.id}`, // ID único para migración
                    // No incluimos tokens reales ya que el usuario tendrá que re-loguearse
                }
            });

            console.log(`   ✅ Account creada para ${user.email}`);
        }

        console.log(`\n🎉 Migración completada exitosamente!`);
        console.log(`📈 ${usersWithoutAccounts.length} usuarios migrados`);
        console.log(`\n💡 Los usuarios existentes deberán iniciar sesión nuevamente`);
        console.log(`   pero mantendrán sus roles y authorities.`);

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar la migración
migrateToDatabaseSessions()
    .then(() => {
        console.log('\n✅ Script completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script falló:', error);
        process.exit(1);
    });
