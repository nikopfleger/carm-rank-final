import { imageStorage } from './image-storage';
import { hybridImageStorage } from './image-storage-hybrid';

// ============================================================================
// LIMPIEZA SIMPLE DE IMÁGENES - SOLO INMEDIATA
// ============================================================================

/**
 * Limpia la imagen temporal de un juego (tanto al aprobar como al rechazar)
 * Las imágenes son solo para validación, se eliminan en ambos casos
 * Usa storage híbrido (Blob + Local)
 */
export async function cleanupImage(imageFileName: string, imageUrl?: string): Promise<void> {
    try {
        if (!imageFileName) {
            console.log('ℹ️ No hay imagen que limpiar para este juego');
            return;
        }

        console.log(`🗑️ Eliminando imagen: ${imageFileName} ${imageUrl ? `(URL: ${imageUrl})` : ''}`);

        // Eliminar imagen usando storage híbrido (intenta Blob + Local)
        const deleted = await hybridImageStorage.deleteImage(imageFileName, imageUrl, 'games');

        if (deleted) {
            console.log(`✅ Imagen eliminada exitosamente: ${imageFileName}`);
        } else {
            console.warn(`⚠️ Imagen no encontrada para eliminar: ${imageFileName}`);
        }

    } catch (error) {
        console.warn(`⚠️ Error eliminando imagen ${imageFileName}:`, error);
        // No lanzar error para no interrumpir el proceso
    }
}

/**
 * Limpia todas las imágenes temporales (función de emergencia)
 * Solo usar en casos extremos
 */
export async function emergencyCleanupAllTemp(): Promise<number> {
    try {
        console.log('🚨 LIMPIEZA DE EMERGENCIA - Eliminando todas las imágenes temporales');

        // Obtener configuración del storage
        const config = imageStorage.getConfig();

        // Eliminar directorio temporal y recrearlo
        const { rm, mkdir } = await import('fs/promises');
        await rm(config.tempPath, { recursive: true, force: true });
        await mkdir(config.tempPath, { recursive: true });

        console.log('✅ Limpieza de emergencia completada');
        return 1; // Indicar que se ejecutó

    } catch (error) {
        console.error('❌ Error en limpieza de emergencia:', error);
        return 0;
    }
}
