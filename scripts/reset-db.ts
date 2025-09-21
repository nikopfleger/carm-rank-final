import { execSync } from 'child_process';
import { config } from 'dotenv';
import { getPrismaDatabaseUrl } from '../lib/database/config';

// Cargar variables de entorno desde .env
config();

async function resetDatabase() {
    console.log('🔄 Iniciando reset de base de datos...');

    try {
        // Obtener la URL desencriptada
        const databaseUrl = getPrismaDatabaseUrl();
        console.log('🔐 URL de base de datos obtenida correctamente');

        // Ejecutar prisma db push con la URL desencriptada
        console.log('🗑️  Ejecutando prisma db push --force-reset...');
        execSync('npx prisma db push --force-reset', {
            stdio: 'inherit',
            env: {
                ...process.env,
                DATABASE_URL: databaseUrl
            }
        });

        console.log('✅ Reset de base de datos completado');

        // Ejecutar seed
        console.log('🌱 Ejecutando seed...');
        execSync('npm run db:seed', {
            stdio: 'inherit',
            env: {
                ...process.env,
                DATABASE_URL: databaseUrl
            }
        });

        console.log('🎉 Proceso completado exitosamente!');

    } catch (error) {
        console.error('❌ Error durante el reset:', error);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    resetDatabase();
}

export { resetDatabase };

