import { del, head, put } from '@vercel/blob';

/**
 * Servicio para manejo de imágenes usando Vercel Blob Storage
 * Con fallback graceful si no está configurado
 */
class BlobStorageService {
    private isConfigured(): boolean {
        return !!process.env.BLOB_READ_WRITE_TOKEN;
    }

    /**
     * Sube una imagen a Vercel Blob
     */
    async uploadImage(
        buffer: Buffer,
        filename: string,
        subfolder: string = 'games'
    ): Promise<{ url: string; filename: string } | null> {
        try {
            if (!this.isConfigured()) {
                console.warn('⚠️ Vercel Blob no configurado. BLOB_READ_WRITE_TOKEN faltante.');
                return null;
            }

            // Generar nombre único con timestamp
            const uniqueFilename = this.generateUniqueFilename(filename);
            const blobPath = `${subfolder}/${uniqueFilename}`;

            // Subir a Vercel Blob
            const blob = await put(blobPath, buffer, {
                access: 'public',
                contentType: this.getMimeType(filename),
            });

            console.log(`✅ Imagen subida a Blob: ${blob.url}`);

            return {
                url: blob.url,
                filename: uniqueFilename
            };
        } catch (error) {
            console.warn('⚠️ Error subiendo imagen a Blob:', error);
            return null;
        }
    }

    /**
     * Elimina una imagen de Vercel Blob
     */
    async deleteImage(url: string): Promise<boolean> {
        try {
            if (!this.isConfigured()) {
                console.warn('⚠️ Vercel Blob no configurado. No se puede eliminar:', url);
                return false;
            }

            await del(url);
            console.log(`✅ Imagen eliminada de Blob: ${url}`);
            return true;
        } catch (error) {
            console.warn('⚠️ Error eliminando imagen de Blob:', error);
            return false;
        }
    }

    /**
     * Verifica si una imagen existe en Blob
     */
    async imageExists(url: string): Promise<boolean> {
        try {
            if (!this.isConfigured()) {
                return false;
            }

            await head(url);
            return true;
        } catch (error) {
            console.warn('⚠️ Error verificando imagen en Blob:', error);
            return false;
        }
    }

    /**
     * Genera un nombre único para el archivo
     */
    private generateUniqueFilename(originalFilename: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = originalFilename.split('.').pop() || 'jpg';
        const baseName = originalFilename.split('.')[0]?.slice(0, 20) || 'image';

        return `${baseName}_${timestamp}_${random}.${extension}`;
    }

    /**
     * Obtiene el MIME type basado en la extensión
     */
    private getMimeType(filename: string): string {
        const extension = filename.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'webp':
                return 'image/webp';
            case 'gif':
                return 'image/gif';
            default:
                return 'image/jpeg';
        }
    }
}

export const blobStorage = new BlobStorageService();
