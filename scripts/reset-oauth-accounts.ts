/**
 * Reset completo de OAuth Accounts
 * 
 * Este script elimina TODOS los datos de auth y los recrea desde cero
 * para evitar problemas de OAuthAccountNotLinked
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

async function resetOAuthAccounts() {
    console.log('🔄 Iniciando reset completo de OAuth Accounts...\n');

    try {
        // 1. Eliminar TODAS las sesiones activas
        console.log('🗑️ Eliminando sesiones...');
        const deletedSessions = await prisma.session.deleteMany();
        console.log(`   ✅ ${deletedSessions.count} sesiones eliminadas`);

        // 2. Eliminar TODAS las cuentas OAuth
        console.log('🗑️ Eliminando cuentas OAuth...');
        const deletedAccounts = await prisma.account.deleteMany();
        console.log(`   ✅ ${deletedAccounts.count} cuentas OAuth eliminadas`);

        // 3. Eliminar tokens de verificación
        console.log('🗑️ Eliminando tokens de verificación...');
        const deletedTokens = await prisma.verificationToken.deleteMany();
        console.log(`   ✅ ${deletedTokens.count} tokens eliminados`);

        // 4. Obtener usuarios existentes (mantener datos de usuarios)
        const existingUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                authorities: true,
                isActive: true
            }
        });

        console.log(`\n👤 Encontrados ${existingUsers.length} usuarios para recrear accounts`);

        // 5. Crear nuevas cuentas OAuth para cada usuario
        for (const user of existingUsers) {
            console.log(`   🔗 Creando account para: ${user.email}`);

            await prisma.account.create({
                data: {
                    userId: user.id,
                    type: "oauth",
                    provider: "google",
                    providerAccountId: `reset_${user.id}_${Date.now()}`, // ID único
                    // Estos campos son opcionales pero NextAuth los puede usar
                    access_token: "dummy_token",
                    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hora
                    token_type: "Bearer",
                    scope: "openid email profile"
                }
            });

            console.log(`   ✅ Account creada para ${user.email}`);
        }

        console.log('\n🎉 Reset completo exitoso!');
        console.log('💡 Todos los usuarios deben iniciar sesión nuevamente');
        console.log('🔐 Las cuentas OAuth han sido recreadas desde cero');

    } catch (error) {
        console.error('❌ Error durante el reset:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar el reset
resetOAuthAccounts()
    .then(() => {
        console.log('\n✅ Script completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script falló:', error);
        process.exit(1);
    });
