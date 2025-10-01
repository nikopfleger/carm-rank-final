import { Redis } from '@upstash/redis';
import { Redis as IoRedis } from 'ioredis';
import 'server-only';

// Configuración de Redis
const REDIS_ENABLED = process.env.REDIS_ENABLED === '1';
const IS_BUILD = process.env.STAGE === 'build' || process.env.NEXT_PHASE === 'phase-production-build';

// Detectar si usar Upstash (Vercel) o IoRedis (local)
const isUpstash = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const isIoRedis = !!(process.env.REDIS_URL && !isUpstash);

let redisClient: Redis | IoRedis | null = null;
let redisDisabled = false; // Circuit breaker para límites
let redisDisabledUntil = 0; // Timestamp hasta cuándo está deshabilitado

// Inicializar cliente Redis
function getRedisClient(): Redis | IoRedis | null {
    if (!REDIS_ENABLED) {
        if (!IS_BUILD) console.log('🔧 Redis disabled via REDIS_ENABLED=0');
        return null;
    }

    if (redisClient) {
        return redisClient;
    }

    try {
        if (isUpstash) {
            if (!IS_BUILD) console.log('🔧 Using Upstash Redis (Vercel)');
            redisClient = new Redis({
                url: process.env.KV_REST_API_URL!,
                token: process.env.KV_REST_API_TOKEN!,
            });
        } else if (isIoRedis) {
            if (!IS_BUILD) console.log('🔧 Using IoRedis (Local)');
            redisClient = new IoRedis(process.env.REDIS_URL!, {
                maxRetriesPerRequest: 3,
                lazyConnect: true,
            });
        } else {
            if (!IS_BUILD) console.warn('⚠️ No Redis configuration found');
            return null;
        }
    } catch (error) {
        console.error('❌ Failed to initialize Redis client:', error);
        return null;
    }

    return redisClient;
}

// Wrapper con API consistente
export class RedisCache {
    private client: Redis | IoRedis | null;

    constructor() {
        this.client = getRedisClient();
    }

    async get(key: string): Promise<string | null> {
        if (!this.client || this.isRedisDisabled()) return null;

        try {
            if (isUpstash) {
                return await (this.client as Redis).get(key);
            } else {
                return await (this.client as IoRedis).get(key);
            }
        } catch (error) {
            console.error(`❌ Redis GET error for key ${key}:`, error);
            // Si es error de límite, deshabilitar Redis por 1 día
            if (this.isLimitError(error)) {
                redisDisabled = true;
                redisDisabledUntil = Date.now() + (24 * 60 * 60 * 1000); // 1 día
                console.warn('⚠️ Redis deshabilitado por límite alcanzado. Usando solo DB por 24 horas.');
            }
            return null;
        }
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
        if (!this.client || this.isRedisDisabled()) return false;

        try {
            if (isUpstash) {
                await (this.client as Redis).set(key, value, ttlSeconds ? { ex: ttlSeconds } : undefined as any);
            } else {
                if (ttlSeconds) {
                    await (this.client as IoRedis).setex(key, ttlSeconds, value);
                } else {
                    await (this.client as IoRedis).set(key, value);
                }
            }
            return true;
        } catch (error) {
            console.error(`❌ Redis SET error for key ${key}:`, error);
            // Si es error de límite, deshabilitar Redis por 1 día
            if (this.isLimitError(error)) {
                redisDisabled = true;
                redisDisabledUntil = Date.now() + (24 * 60 * 60 * 1000); // 1 día
                console.warn('⚠️ Redis deshabilitado por límite alcanzado. Usando solo DB por 24 horas.');
            }
            return false;
        }
    }

    async del(key: string): Promise<boolean> {
        if (!this.client) return false;

        try {
            if (isUpstash) {
                await (this.client as Redis).del(key);
            } else {
                await (this.client as IoRedis).del(key);
            }
            return true;
        } catch (error) {
            console.error(`❌ Redis DEL error for key ${key}:`, error);
            return false;
        }
    }

    async exists(key: string): Promise<boolean> {
        if (!this.client) return false;

        try {
            if (isUpstash) {
                const result = await (this.client as Redis).exists(key);
                return (result as unknown as number) > 0;
            } else {
                const result = await (this.client as IoRedis).exists(key);
                return result === 1;
            }
        } catch (error) {
            console.error(`❌ Redis EXISTS error for key ${key}:`, error);
            return false;
        }
    }

    async ping(): Promise<boolean> {
        if (!this.client) return false;

        try {
            if (isUpstash) {
                await (this.client as Redis).ping();
            } else {
                await (this.client as IoRedis).ping();
            }
            return true;
        } catch (error) {
            console.error('❌ Redis PING error:', error);
            return false;
        }
    }

    private isRedisDisabled(): boolean {
        if (!redisDisabled) return false;

        // Si ya pasó el cooldown, reactivar Redis
        if (Date.now() > redisDisabledUntil) {
            redisDisabled = false;
            redisDisabledUntil = 0;
            console.log('🔄 Redis reactivado tras cooldown de 24 horas');
            return false;
        }

        return true;
    }

    private isLimitError(error: any): boolean {
        if (!error) return false;
        const message = error.message?.toLowerCase() || '';
        const code = error.code?.toLowerCase() || '';

        // Detectar errores de límite comunes
        return message.includes('limit') ||
            message.includes('quota') ||
            message.includes('exceeded') ||
            code.includes('limit') ||
            code.includes('quota');
    }

    async getStatus() {
        const isDisabled = this.isRedisDisabled();
        const timeLeft = redisDisabledUntil > 0 ? Math.max(0, redisDisabledUntil - Date.now()) : 0;

        return {
            enabled: REDIS_ENABLED && !isDisabled,
            provider: isUpstash ? 'upstash' : isIoRedis ? 'ioredis' : 'none',
            connected: await this.ping(),
            disabled: isDisabled,
            disabledUntil: redisDisabledUntil,
            cooldownLeftMs: timeLeft,
            cooldownLeftHours: Math.ceil(timeLeft / (60 * 60 * 1000)),
        };
    }
}

// Singleton instance
export const redisCache = new RedisCache();
