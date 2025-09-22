import { del, head, put } from '@vercel/blob';

class BlobStorageService {
    /** Usa tu env personalizada pasando el token explícito al SDK */
    private get token(): string | undefined {
        return process.env.CARM_BLOB_READ_WRITE_TOKEN;
    }
    private isConfigured(): boolean {
        return !!this.token;
    }

    async uploadImage(
        buffer: Buffer,
        filename: string,
        subfolder = 'games'
    ): Promise<{ url: string; filename: string; path: string } | null> {
        try {
            if (!this.isConfigured()) {
                console.warn('⚠️ Vercel Blob no configurado (CARM_BLOB_READ_WRITE_TOKEN faltante).');
                return null;
            }

            const uniqueFilename = this.generateUniqueFilename(filename);
            const blobPath = `${subfolder}/${uniqueFilename}`;

            const blob = await put(blobPath, buffer, {
                access: 'public',
                contentType: this.getMimeType(filename),
                token: this.token,               // <- clave: pasamos tu token
            });

            console.log(`✅ Imagen subida a Blob: ${blob.url}`);
            return { url: blob.url, filename: uniqueFilename, path: blobPath };
        } catch (error) {
            console.warn('⚠️ Error subiendo imagen a Blob:', error);
            return null;
        }
    }

    async deleteImage(url: string): Promise<boolean> {
        try {
            if (!this.isConfigured()) {
                console.warn('⚠️ Vercel Blob no configurado. No se puede eliminar:', url);
                return false;
            }
            await del(url, { token: this.token });
            console.log(`✅ Imagen eliminada de Blob: ${url}`);
            return true;
        } catch (error) {
            console.warn('⚠️ Error eliminando imagen de Blob:', error);
            return false;
        }
    }

    async imageExists(url: string): Promise<boolean> {
        try {
            // Si es público debería responder sin token; si falla, reintenta con token (por si acaso)
            try {
                await head(url);
                return true;
            } catch {
                if (!this.isConfigured()) return false;
                await head(url, { token: this.token });
                return true;
            }
        } catch {
            return false;
        }
    }

    private generateUniqueFilename(originalFilename: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 8);
        const ext = (originalFilename.split('.').pop() || 'jpg').toLowerCase();
        const rawBase = originalFilename.replace(/\.[^/.]+$/, '');
        const base = rawBase.replace(/[^a-z0-9_-]/gi, '').slice(0, 32) || 'image';
        return `${base}_${timestamp}_${random}.${ext}`;
    }

    private getMimeType(filename: string): string {
        const ext = (filename.split('.').pop() || '').toLowerCase();
        switch (ext) {
            case 'jpg':
            case 'jpeg': return 'image/jpeg';
            case 'png': return 'image/png';
            case 'webp': return 'image/webp';
            case 'gif': return 'image/gif';
            case 'svg': return 'image/svg+xml';
            case 'avif': return 'image/avif';
            case 'heic': return 'image/heic';
            default: return 'application/octet-stream';
        }
    }
}

export const blobStorage = new BlobStorageService();
