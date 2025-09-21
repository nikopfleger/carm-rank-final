import { blobStorage } from './blob-storage';

/**
 * Servicio simplificado de almacenamiento de imágenes
 * Prioridad: Vercel Blob > Imagen default
 * Sin fallback a storage local (simplificado)
 */
class SimplifiedImageStorage {
    private readonly DEFAULT_IMAGE_URL = '/images/image-not-available.svg';
    private readonly DEFAULT_FILENAME = 'image-not-available.svg';

    /**
     * Guarda una imagen usando Blob, o devuelve imagen default si falla
     */
    async saveImage(
        buffer: Buffer,
        filename: string,
        subfolder: string = 'games'
    ): Promise<{ path: string; url: string; filename: string }> {
        try {
            // 1. Intentar subir a Vercel Blob
            const blobResult = await blobStorage.uploadImage(buffer, filename, subfolder);

            if (blobResult) {
                console.log(`✅ Imagen guardada en Blob: ${blobResult.url}`);
                return {
                    path: `blob:${blobResult.filename}`,
                    url: blobResult.url,
                    filename: blobResult.filename
                };
            }

            // 2. Fallback: imagen default
            console.warn('⚠️ Blob no disponible, usando imagen default');
            return this.getDefaultImage();

        } catch (error) {
            console.warn('⚠️ Error subiendo imagen, usando imagen default:', error);
            return this.getDefaultImage();
        }
    }

    /**
     * Devuelve la configuración de imagen default (público para fallback manual)
     * Valida que el archivo exista
     */
    getDefaultImage(): { path: string; url: string; filename: string } {
        // Validar que el archivo default existe
        try {
            const fs = require('fs');
            const path = require('path');
            const defaultPath = path.join(process.cwd(), 'public', 'images', 'image-not-available.svg');

            if (!fs.existsSync(defaultPath)) {
                console.error('❌ Imagen default no encontrada:', defaultPath);
                throw new Error('Imagen default no disponible');
            }
        } catch (error) {
            console.error('❌ Error validando imagen default:', error);
            throw new Error('Error crítico: imagen default no disponible');
        }

        return {
            path: 'default:image-not-available',
            url: this.DEFAULT_IMAGE_URL,
            filename: this.DEFAULT_FILENAME
        };
    }

    /**
     * Elimina una imagen solo de Blob (no hay storage local)
     */
    async deleteImage(
        filename: string,
        imageUrl?: string,
        subfolder: string = 'games'
    ): Promise<boolean> {
        try {
            // Solo eliminar si es imagen default (no hacer nada)
            if (this.isDefaultImage(filename, imageUrl)) {
                console.log('ℹ️ Imagen default, no se elimina:', filename);
                return true; // "Éxito" pero sin eliminar nada
            }

            // Si tenemos URL de Blob, intentar eliminar de Blob
            if (imageUrl && this.isBlobUrl(imageUrl)) {
                const blobSuccess = await blobStorage.deleteImage(imageUrl);
                if (blobSuccess) {
                    console.log(`✅ Imagen eliminada de Blob: ${imageUrl}`);
                    return true;
                }
            }

            console.warn(`⚠️ No se pudo eliminar imagen: ${filename}`);
            return false;

        } catch (error) {
            console.warn('⚠️ Error eliminando imagen:', error);
            return false;
        }
    }

    /**
     * Verifica si una URL es de Vercel Blob
     */
    private isBlobUrl(url: string): boolean {
        return url.includes('blob.vercel-storage.com') || url.includes('vercel-storage.com');
    }

    /**
     * Verifica si es la imagen default
     */
    private isDefaultImage(filename?: string, url?: string): boolean {
        return filename === this.DEFAULT_FILENAME ||
            url === this.DEFAULT_IMAGE_URL ||
            url?.includes('image-not-available.svg') ||
            false;
    }

    /**
     * Obtiene información del archivo
     */
    getImageInfo(filename: string, url: string) {
        return {
            filename,
            url,
            isBlob: this.isBlobUrl(url),
            isDefault: this.isDefaultImage(filename, url),
            storage: this.isBlobUrl(url) ? 'blob' :
                this.isDefaultImage(filename, url) ? 'default' : 'unknown'
        };
    }
}

// Exportar instancia singleton con nuevo nombre
export const simplifiedImageStorage = new SimplifiedImageStorage();

// Mantener compatibilidad con nombre anterior
export const hybridImageStorage = simplifiedImageStorage;


