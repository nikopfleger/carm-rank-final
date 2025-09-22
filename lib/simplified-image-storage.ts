import { blobStorage } from './blob-storage';

type SavedImage = { path: string; url: string; filename: string };

class SimplifiedImageStorage {
    private readonly DEFAULT_IMAGE_URL = '/images/image-not-available.svg';
    private readonly DEFAULT_FILENAME = 'image-not-available.svg';

    /** Sube a Blob; si falla, devuelve default (sin tocar FS) */
    async saveImage(
        buffer: Buffer,
        filename: string,
        subfolder = 'games'
    ): Promise<SavedImage> {
        try {
            const blobResult = await blobStorage.uploadImage(buffer, filename, subfolder);
            if (blobResult) {
                console.log(`✅ Imagen guardada en Blob: ${blobResult.url}`);
                return {
                    path: blobResult.path,    // guardamos el blobPath real
                    url: blobResult.url,
                    filename: blobResult.filename,
                };
            }
            console.warn('⚠️ Blob no disponible, usando imagen default');
            return this.getDefaultImage();
        } catch (error) {
            console.warn('⚠️ Error subiendo imagen, usando imagen default:', error);
            return this.getDefaultImage();
        }
    }

    /** Fallback estático: confiamos en /public (sin validar FS) */
    getDefaultImage(): SavedImage {
        return {
            path: 'default:image-not-available',
            url: this.DEFAULT_IMAGE_URL,
            filename: this.DEFAULT_FILENAME,
        };
    }

    /** Elimina solo de Blob si corresponde */
    async deleteImage(
        filename: string,
        imageUrl?: string
    ): Promise<boolean> {
        try {
            if (this.isDefaultImage(filename, imageUrl)) {
                console.log('ℹ️ Imagen default, no se elimina:', filename);
                return true;
            }
            if (imageUrl && this.isBlobUrl(imageUrl)) {
                const ok = await blobStorage.deleteImage(imageUrl);
                if (ok) {
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

    getImageInfo(filename: string, url: string) {
        const isBlob = this.isBlobUrl(url);
        const isDefault = this.isDefaultImage(filename, url);
        return {
            filename,
            url,
            isBlob,
            isDefault,
            storage: isBlob ? 'blob' : (isDefault ? 'default' : 'unknown'),
        };
    }

    private isBlobUrl(url: string): boolean {
        try {
            const u = new URL(url);
            return u.hostname.endsWith('blob.vercel-storage.com');
        } catch {
            return false;
        }
    }

    private isDefaultImage(filename?: string, url?: string): boolean {
        return (
            filename === this.DEFAULT_FILENAME ||
            url === this.DEFAULT_IMAGE_URL ||
            (url?.endsWith('/image-not-available.svg') ?? false)
        );
    }
}

export const simplifiedImageStorage = new SimplifiedImageStorage();
// alias compat
export const hybridImageStorage = simplifiedImageStorage;
