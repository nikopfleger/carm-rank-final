import { execSync } from 'child_process';
import { config } from 'dotenv';

// Cargar variables de entorno desde .env
config();

async function resetDatabase() {
    console.log('🔄 Iniciando reset de base de datos...');

    try {
        // Usar DATABASE_URL del environment
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL no está configurada');
        }
        console.log('🔐 DATABASE_URL configurada correctamente');

        // Ejecutar prisma db push
        console.log('🗑️  Ejecutando prisma db push --force-reset...');
        execSync('npx prisma db push --force-reset', {
            stdio: 'inherit',
            env: {
                ...process.env
            }
        });

        console.log('✅ Reset de base de datos completado');

        // Ejecutar seed
        console.log('🌱 Ejecutando seed...');
        execSync('npm run db:seed', {
            stdio: 'inherit',
            env: {
                ...process.env
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

