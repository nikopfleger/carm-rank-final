import { hybridImageStorage } from './simplified-image-storage';

// ============================================================================
// LIMPIEZA SIMPLE DE IMÁGENES - SOLO BLOB
// ============================================================================

/**
 * Elimina la imagen (si es default, no hace nada).
 * No setea fallback ni toca FS porque la imagen no se usará más.
 */
export async function cleanupImage(imageFileName: string, imageUrl?: string): Promise<void> {
    try {
        if (!imageFileName) {
            console.log('ℹ️ No hay imagen que limpiar para este juego');
            return;
        }

        console.log(`🗑️ Eliminando imagen: ${imageFileName} ${imageUrl ? `(URL: ${imageUrl})` : ''}`);

        const deleted = await hybridImageStorage.deleteImage(imageFileName, imageUrl);

        if (deleted) {
            console.log(`✅ Imagen eliminada exitosamente: ${imageFileName}`);
        } else {
            console.warn(`⚠️ Imagen no encontrada o no eliminable (posible default): ${imageFileName}`);
        }
    } catch (error) {
        console.warn(`⚠️ Error eliminando imagen ${imageFileName}:`, error);
        // No propagamos error para no cortar el flujo
    }
}

/**
 * Limpieza de emergencia — no-op (no hay storage local).
 * Dejar por compatibilidad o envolver en feature flag si querés.
 */
export async function emergencyCleanupAllTemp(): Promise<number> {
    console.log('🚨 LIMPIEZA DE EMERGENCIA - No hay storage local. No-op.');
    return 1;
}
