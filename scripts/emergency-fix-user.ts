import { prisma } from '../lib/database/client';

// Script de emergencia para restaurar permisos de usuario
async function emergencyFixUser() {
    try {
        // Cambia este email por el tuyo
        const userEmail = 'pato4ever@gmail.com'; // CAMBIA ESTO POR TU EMAIL

        console.log(`Buscando usuario: ${userEmail}`);

        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            console.error(`Usuario no encontrado: ${userEmail}`);
            return;
        }

        console.log(`Usuario encontrado: ${user.name} (${user.email})`);
        console.log(`Rol actual: ${user.role}`);
        console.log(`Activo: ${user.isActive}`);

        // Restaurar a SUPER_ADMIN con todos los permisos usando upsert para mayor robustez
        const updatedUser = await prisma.user.upsert({
            where: { email: userEmail },
            update: {
                role: 'SUPER_ADMIN',
                isActive: true,
                authorities: ['*'], // Todos los permisos
            },
            create: {
                email: userEmail,
                role: 'SUPER_ADMIN',
                isActive: true,
                authorities: ['*'], // Todos los permisos
            }
        });

        console.log('✅ Usuario restaurado exitosamente:');
        console.log(`- Email: ${updatedUser.email}`);
        console.log(`- Rol: ${updatedUser.role}`);
        console.log(`- Activo: ${updatedUser.isActive}`);
        console.log(`- Permisos: ${updatedUser.authorities?.join(', ')}`);

        // Eliminar todas las sesiones para forzar re-login
        await prisma.session.deleteMany({
            where: { userId: updatedUser.id }
        });

        console.log('✅ Sesiones eliminadas. Vuelve a hacer login.');
        console.log('✅ Cierra el navegador completamente y vuelve a entrar.');

    } catch (error) {
        console.error('Error restaurando usuario:', error);
    } finally {
        await prisma.$disconnect();
    }
}

emergencyFixUser();
