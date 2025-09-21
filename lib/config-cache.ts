import { PrismaClient } from '@prisma/client';
import { prisma } from './database/client';

// Tipos para las configuraciones
export interface DanConfigCache {
  id: number;
  rank: string;
  sanma: boolean;
  minPoints: number;
  maxPoints: number;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  fourthPlace: number | null;
  isProtected: boolean;
  color: string;
  cssClass: string;
  isLastRank: boolean;
}

export interface RateConfigCache {
  id: number;
  name: string;
  sanma: boolean;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  fourthPlace: number | null;
  adjustmentRate: number;
  adjustmentLimit: number;
  minAdjustment: number;
}

export interface SeasonConfigCache {
  id: number;
  name: string;
  sanma: boolean;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  fourthPlace: number | null;
  seasonId: number | null;
  isDefault: boolean;
}

// Cache en memoria
class ConfigCache {
  private danConfigs: Map<string, DanConfigCache> = new Map();
  private rateConfigs: Map<string, RateConfigCache> = new Map();
  private seasonConfigs: Map<string, SeasonConfigCache> = new Map();
  private isInitialized = false;
  private isUpdating = false;
  private updatePromise: Promise<void> | null = null;
  private readCount = 0;
  private writePromise: Promise<any> | null = null;

  // Claves para el cache
  private getDanKey(rank: string, sanma: boolean): string {
    return `${rank}_${sanma}`;
  }

  private getRateKey(name: string, sanma: boolean): string {
    return `${name}_${sanma}`;
  }

  private getSeasonKey(name: string, sanma: boolean, seasonId: number | null): string {
    return `${name}_${sanma}_${seasonId || 'default'}`;
  }

  // Reader-Writer locks: múltiples lectores, un escritor
  private async withReadLock<T>(operation: () => T): Promise<T> {
    // Esperar a que termine cualquier escritura en progreso
    if (this.writePromise) {
      await this.writePromise;
    }

    // Incrementar contador de lectores (múltiples lectores permitidos)
    this.readCount++;

    try {
      return operation();
    } finally {
      // Decrementar contador de lectores
      this.readCount--;
    }
  }

  private async withWriteLock<T>(operation: () => Promise<T>): Promise<T> {
    // Esperar a que terminen TODAS las lecturas activas
    while (this.readCount > 0) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    // Esperar a que termine cualquier escritura previa
    if (this.writePromise) {
      await this.writePromise;
    }

    // Marcar que estamos escribiendo (bloquea nuevas lecturas)
    const writeOperation = async (): Promise<T> => {
      try {
        return await operation();
      } finally {
        this.writePromise = null;
      }
    };

    this.writePromise = writeOperation();
    return this.writePromise;
  }

  // Inicializar cache desde BD
  async initialize(): Promise<void> {
    return this.withWriteLock(async () => {
      if (this.isInitialized) return;

      console.log('🔄 Initializing configuration cache...');
      this.isUpdating = true;

      // Cargar DanConfigs
      const danConfigs = await (prisma as any).danConfig.findMany({
        where: { deleted: false },
      });

      for (const config of danConfigs) {
        const key = this.getDanKey(config.rank, config.sanma);
        this.danConfigs.set(key, {
          id: config.id,
          rank: config.rank,
          sanma: config.sanma,
          minPoints: config.minPoints,
          maxPoints: config.maxPoints,
          firstPlace: config.firstPlace,
          secondPlace: config.secondPlace,
          thirdPlace: config.thirdPlace,
          fourthPlace: config.fourthPlace,
          isProtected: config.isProtected,
          color: config.color,
          cssClass: config.cssClass,
          isLastRank: config.isLastRank,
        });
      }

      // Cargar RateConfigs
      const rateConfigs = await (prisma as any).rateConfig.findMany({
        where: { deleted: false },
      });

      for (const config of rateConfigs) {
        const key = this.getRateKey(config.name, config.sanma);
        this.rateConfigs.set(key, {
          id: config.id,
          name: config.name,
          sanma: config.sanma,
          firstPlace: config.firstPlace,
          secondPlace: config.secondPlace,
          thirdPlace: config.thirdPlace,
          fourthPlace: config.fourthPlace,
          adjustmentRate: config.adjustmentRate,
          adjustmentLimit: config.adjustmentLimit,
          minAdjustment: config.minAdjustment,
        });
      }

      // Cargar SeasonConfigs
      const seasonConfigs = await (prisma as any).seasonConfig.findMany({
        where: { deleted: false },
      });

      for (const config of seasonConfigs) {
        const key = this.getSeasonKey(config.name, config.sanma, config.seasonId);
        this.seasonConfigs.set(key, {
          id: config.id,
          name: config.name,
          sanma: config.sanma,
          firstPlace: config.firstPlace,
          secondPlace: config.secondPlace,
          thirdPlace: config.thirdPlace,
          fourthPlace: config.fourthPlace,
          seasonId: config.seasonId,
          isDefault: config.isDefault,
        });
      }

      this.isInitialized = true;
      this.isUpdating = false;
      console.log(`✅ Configuration cache initialized: ${this.danConfigs.size} Dan, ${this.rateConfigs.size} Rate, ${this.seasonConfigs.size} Season configs`);
    });
  }

  // Métodos granulares para actualizar solo lo necesario
  async refreshDanConfigs(prisma: PrismaClient): Promise<void> {
    return this.withWriteLock(async () => {
      console.log('🔄 Refreshing Dan configs...');
      this.isUpdating = true;

      try {
        this.danConfigs.clear();
        const danConfigs = await (prisma as any).danConfig.findMany({
          where: { deleted: false },
        });

        for (const config of danConfigs) {
          const key = this.getDanKey(config.rank, config.sanma);
          this.danConfigs.set(key, {
            id: config.id,
            rank: config.rank,
            sanma: config.sanma,
            minPoints: config.minPoints,
            maxPoints: config.maxPoints,
            firstPlace: config.firstPlace,
            secondPlace: config.secondPlace,
            thirdPlace: config.thirdPlace,
            fourthPlace: config.fourthPlace,
            isProtected: config.isProtected,
            color: config.color,
            cssClass: config.cssClass,
            isLastRank: config.isLastRank,
          });
        }

        console.log(`✅ Dan configs refreshed: ${this.danConfigs.size} configs`);
      } finally {
        this.isUpdating = false;
      }
    });
  }

  async refreshRateConfigs(prisma: PrismaClient): Promise<void> {
    return this.withWriteLock(async () => {
      console.log('🔄 Refreshing Rate configs...');
      this.isUpdating = true;

      try {
        this.rateConfigs.clear();
        const rateConfigs = await (prisma as any).rateConfig.findMany({
          where: { deleted: false },
        });

        for (const config of rateConfigs) {
          const key = this.getRateKey(config.name, config.sanma);
          this.rateConfigs.set(key, {
            id: config.id,
            name: config.name,
            sanma: config.sanma,
            firstPlace: config.firstPlace,
            secondPlace: config.secondPlace,
            thirdPlace: config.thirdPlace,
            fourthPlace: config.fourthPlace,
            adjustmentRate: config.adjustmentRate,
            adjustmentLimit: config.adjustmentLimit,
            minAdjustment: config.minAdjustment,
          });
        }

        console.log(`✅ Rate configs refreshed: ${this.rateConfigs.size} configs`);
      } finally {
        this.isUpdating = false;
      }
    });
  }

  async refreshSeasonConfigs(prisma: PrismaClient): Promise<void> {
    return this.withWriteLock(async () => {
      console.log('🔄 Refreshing Season configs...');
      this.isUpdating = true;

      try {
        this.seasonConfigs.clear();
        const seasonConfigs = await (prisma as any).seasonConfig.findMany({
          where: { deleted: false },
        });

        for (const config of seasonConfigs) {
          const key = this.getSeasonKey(config.name, config.sanma, config.seasonId);
          this.seasonConfigs.set(key, {
            id: config.id,
            name: config.name,
            sanma: config.sanma,
            firstPlace: config.firstPlace,
            secondPlace: config.secondPlace,
            thirdPlace: config.thirdPlace,
            fourthPlace: config.fourthPlace,
            seasonId: config.seasonId,
            isDefault: config.isDefault,
          });
        }

        console.log(`✅ Season configs refreshed: ${this.seasonConfigs.size} configs`);
      } finally {
        this.isUpdating = false;
      }
    });
  }

  // Métodos para obtener configuraciones DAN
  async getDanConfig(rank: string, sanma: boolean): Promise<DanConfigCache | null> {
    return this.withReadLock(() => {
      const key = this.getDanKey(rank, sanma);
      return this.danConfigs.get(key) || null;
    });
  }

  async getDanConfigByPoints(points: number, sanma: boolean): Promise<DanConfigCache | null> {
    return this.withReadLock(async () => {
      // Si el cache está vacío, inicializarlo
      if (this.danConfigs.size === 0) {
        await this.initialize();
      }

      for (const config of this.danConfigs.values()) {
        if (config.sanma === sanma) {
          const min = config.minPoints;
          const max = config.maxPoints;
          if (points >= min && points < max) {
            return config;
          }
        }
      }
      return null;
    });
  }

  async getAllDanConfigs(sanma?: boolean): Promise<DanConfigCache[]> {
    return this.withReadLock(async () => {
      // Si el cache está vacío, inicializarlo
      if (this.danConfigs.size === 0) {
        await this.initialize();
      }

      if (sanma === undefined) {
        return Array.from(this.danConfigs.values());
      }
      return Array.from(this.danConfigs.values()).filter(config => config.sanma === sanma);
    });
  }

  async getLowestDanConfig(sanma: boolean): Promise<DanConfigCache | null> {
    return this.withReadLock(async () => {
      // Si el cache está vacío, inicializarlo
      if (this.danConfigs.size === 0) {
        await this.initialize();
      }

      const configs = Array.from(this.danConfigs.values()).filter(config => config.sanma === sanma);
      if (configs.length === 0) return null;

      // Ordenar por puntos mínimos y tomar el primero
      return configs.sort((a, b) => {
        const aMin = a.minPoints;
        const bMin = b.minPoints;
        return aMin - bMin;
      })[0];
    });
  }

  // Métodos para obtener configuraciones RATE
  async getRateConfig(name: string, sanma: boolean): Promise<RateConfigCache | null> {
    return this.withReadLock(async () => {
      // Si el cache está vacío, inicializarlo
      if (this.rateConfigs.size === 0) {
        await this.initialize();
      }

      const key = this.getRateKey(name, sanma);
      return this.rateConfigs.get(key) || null;
    });
  }

  async getDefaultRateConfig(sanma: boolean): Promise<RateConfigCache | null> {
    return this.withReadLock(async () => {
      // Si el cache está vacío, inicializarlo
      if (this.rateConfigs.size === 0) {
        await this.initialize();
      }

      // Buscar la primera configuración para el modo especificado
      for (const config of this.rateConfigs.values()) {
        if (config.sanma === sanma) {
          return config;
        }
      }
      return null;
    });
  }

  getAllRateConfigs(sanma?: boolean): RateConfigCache[] {
    if (sanma === undefined) {
      return Array.from(this.rateConfigs.values());
    }
    return Array.from(this.rateConfigs.values()).filter(config => config.sanma === sanma);
  }

  // Métodos para obtener configuraciones SEASON
  async getSeasonConfig(name: string, sanma: boolean, seasonId?: number | null): Promise<SeasonConfigCache | null> {
    // Si el cache está vacío, inicializarlo
    if (this.seasonConfigs.size === 0) {
      await this.initialize();
    }

    const key = this.getSeasonKey(name, sanma, seasonId || null);
    return this.seasonConfigs.get(key) || null;
  }

  async getDefaultSeasonConfig(sanma: boolean): Promise<SeasonConfigCache | null> {
    // Si el cache está vacío, inicializarlo
    if (this.seasonConfigs.size === 0) {
      await this.initialize();
    }

    // Buscar configuración default para el modo especificado
    for (const config of this.seasonConfigs.values()) {
      if (config.sanma === sanma && config.isDefault) {
        return config;
      }
    }
    return null;
  }

  async getSeasonConfigForSeason(sanma: boolean, seasonId: number): Promise<SeasonConfigCache | null> {
    // Si el cache está vacío, inicializarlo
    if (this.seasonConfigs.size === 0) {
      await this.initialize();
    }

    // Buscar configuración específica para la temporada
    for (const config of this.seasonConfigs.values()) {
      if (config.sanma === sanma && config.seasonId === seasonId) {
        return config;
      }
    }
    // Si no hay configuración específica, usar la default
    return await this.getDefaultSeasonConfig(sanma);
  }

  getAllSeasonConfigs(sanma?: boolean): SeasonConfigCache[] {
    if (sanma === undefined) {
      return Array.from(this.seasonConfigs.values());
    }
    return Array.from(this.seasonConfigs.values()).filter(config => config.sanma === sanma);
  }



  // Limpiar cache
  clear(): void {
    this.danConfigs.clear();
    this.rateConfigs.clear();
    this.seasonConfigs.clear();
    this.isInitialized = false;
  }

  // Estado del cache
  getStatus(): { isInitialized: boolean; counts: { dan: number; rate: number; season: number } } {
    return {
      isInitialized: this.isInitialized,
      counts: {
        dan: this.danConfigs.size,
        rate: this.rateConfigs.size,
        season: this.seasonConfigs.size,
      },
    };
  }
}

// Instancia singleton
export const configCache = new ConfigCache();

// Función helper para inicializar el cache
export async function initializeConfigCache(): Promise<void> {
  await configCache.initialize();
}
