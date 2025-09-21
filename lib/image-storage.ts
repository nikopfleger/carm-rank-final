import { existsSync } from 'fs';
import { access, mkdir, unlink, writeFile } from 'fs/promises';
import { basename, dirname, extname, join } from 'path';

// ============================================================================
// CONFIGURACIÓN DE ALMACENAMIENTO DUAL
// ============================================================================

interface StorageConfig {
  isLocal: boolean;
  basePath: string;
  baseUrl: string;
  tempPath: string;
}

class DualImageStorage {
  private config: StorageConfig;

  constructor() {
    this.config = this.getStorageConfig();
  }

  /**
   * Determina la configuración de almacenamiento basada en el entorno
   */
  private getStorageConfig(): StorageConfig {
    // Siempre usar /public/images para que las imágenes sean accesibles directamente
    const basePath = join(process.cwd(), 'public', 'images');
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/images'
      : `${process.env.NEXTAUTH_URL || 'https://tu-app.vercel.app'}/images`;

    return {
      isLocal: false, // Ya no usamos carpeta externa
      basePath,
      baseUrl,
      tempPath: join(basePath, 'temp')
    };
  }

  /**
   * Guarda una imagen en el almacenamiento apropiado
   */
  async saveImage(
    buffer: Buffer,
    filename: string,
    subfolder: string = 'games'
  ): Promise<{ path: string; url: string; filename: string }> {
    try {
      // Crear directorio si no existe
      const fullPath = join(this.config.basePath, subfolder);
      await this.ensureDirectory(fullPath);

      // Generar nombre único
      const uniqueFilename = this.generateUniqueFilename(filename);
      const filePath = join(fullPath, uniqueFilename);

      // Guardar archivo
      await writeFile(filePath, buffer as unknown as Uint8Array);

      // Generar URL
      const url = this.generateUrl(subfolder, uniqueFilename);

      console.log(`✅ Imagen guardada: ${filePath} (${this.config.isLocal ? 'LOCAL' : 'VERCEL'})`);

      return {
        path: filePath,
        url,
        filename: uniqueFilename
      };
    } catch (error) {
      console.error('❌ Error guardando imagen:', error);
      throw new Error(`Error guardando imagen: ${error}`);
    }
  }

  /**
   * Guarda una imagen temporal (para juegos pendientes)
   */
  async saveTempImage(
    buffer: Buffer,
    filename: string
  ): Promise<{ path: string; url: string; filename: string }> {
    try {
      // Crear directorio temporal si no existe
      await this.ensureDirectory(this.config.tempPath);

      // Generar nombre único
      const uniqueFilename = this.generateUniqueFilename(filename);
      const filePath = join(this.config.tempPath, uniqueFilename);

      // Guardar archivo
      await writeFile(filePath, buffer as unknown as Uint8Array);

      // Generar URL temporal
      const url = this.generateUrl('temp', uniqueFilename);

      console.log(`✅ Imagen temporal guardada: ${filePath}`);

      return {
        path: filePath,
        url,
        filename: uniqueFilename
      };
    } catch (error) {
      console.error('❌ Error guardando imagen temporal:', error);
      throw new Error(`Error guardando imagen temporal: ${error}`);
    }
  }

  /**
   * Mueve una imagen temporal a su ubicación final
   */
  async moveTempImage(
    tempFilename: string,
    finalSubfolder: string = 'games'
  ): Promise<{ path: string; url: string; filename: string }> {
    try {
      const tempPath = join(this.config.tempPath, tempFilename);
      const finalPath = join(this.config.basePath, finalSubfolder, tempFilename);

      // Crear directorio final si no existe
      await this.ensureDirectory(dirname(finalPath));

      // En desarrollo local, copiar archivo
      if (this.config.isLocal) {
        const { copyFile } = await import('fs/promises');
        await copyFile(tempPath, finalPath);
        await unlink(tempPath); // Eliminar temporal
      } else {
        // En Vercel, mover archivo
        const { rename } = await import('fs/promises');
        await rename(tempPath, finalPath);
      }

      // Generar URL final
      const url = this.generateUrl(finalSubfolder, tempFilename);

      console.log(`✅ Imagen movida de temporal a: ${finalPath}`);

      return {
        path: finalPath,
        url,
        filename: tempFilename
      };
    } catch (error) {
      console.error('❌ Error moviendo imagen temporal:', error);
      throw new Error(`Error moviendo imagen temporal: ${error}`);
    }
  }

  /**
   * Elimina una imagen del almacenamiento
   */
  async deleteImage(filename: string, subfolder: string = 'games'): Promise<boolean> {
    try {
      const filePath = join(this.config.basePath, subfolder, filename);

      if (existsSync(filePath)) {
        await unlink(filePath);
        console.log(`✅ Imagen eliminada: ${filePath}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
      return false;
    }
  }

  /**
   * Elimina una imagen temporal
   */
  async deleteTempImage(filename: string): Promise<boolean> {
    try {
      const filePath = join(this.config.tempPath, filename);

      if (existsSync(filePath)) {
        await unlink(filePath);
        console.log(`✅ Imagen temporal eliminada: ${filePath}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error eliminando imagen temporal:', error);
      return false;
    }
  }

  /**
   * Limpia imágenes temporales antiguas
   */
  async cleanupTempImages(retentionDays: number = 7): Promise<number> {
    try {
      const { readdir, stat } = await import('fs/promises');
      const files = await readdir(this.config.tempPath);
      const now = Date.now();
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = join(this.config.tempPath, file);
        const stats = await stat(filePath);

        if (now - stats.mtime.getTime() > retentionMs) {
          await unlink(filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 Limpieza: ${deletedCount} imágenes temporales eliminadas`);
      }

      return deletedCount;
    } catch (error) {
      console.error('❌ Error en limpieza de imágenes temporales:', error);
      return 0;
    }
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * Verifica si el almacenamiento es local
   */
  isLocalStorage(): boolean {
    return this.config.isLocal;
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  private async ensureDirectory(path: string): Promise<void> {
    try {
      await access(path);
    } catch {
      await mkdir(path, { recursive: true });
    }
  }

  private generateUniqueFilename(originalFilename: string): string {
    const ext = extname(originalFilename);
    const name = basename(originalFilename, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${name}_${timestamp}_${random}${ext}`;
  }

  private generateUrl(subfolder: string, filename: string): string {
    if (this.config.isLocal) {
      // En desarrollo local, usar API route
      return `${this.config.baseUrl}/${subfolder}/${filename}`;
    } else {
      // En Vercel, usar URL directa a /public
      return `${this.config.baseUrl}/${subfolder}/${filename}`;
    }
  }
}

// Exportar instancia singleton
export const imageStorage = new DualImageStorage();

// Funciones helper adicionales
export const imageFileExists = async (filename: string): Promise<boolean> => {
  try {
    const filePath = join(imageStorage.getConfig().basePath, 'games', filename);
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const getImageFilePath = (filename: string): string => {
  return join(imageStorage.getConfig().basePath, 'games', filename);
};

export const getFileFormat = (filename: string): string => {
  return extname(filename).toLowerCase();
};

// Exportar tipos para uso externo
export type { StorageConfig };

