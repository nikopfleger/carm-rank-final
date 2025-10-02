// lib/cache/redis-wrapper.ts
import { Redis } from '@upstash/redis';
import { Redis as IoRedis } from 'ioredis';
import 'server-only';

// Flags de fase
const IS_BUILD =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.STAGE === 'build';

// Configuración
const isUpstash = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const isIoRedis = !!(process.env.REDIS_URL && !isUpstash);
// Habilitado si y solo si hay proveedor configurado (URL/token válidos)
const REDIS_ENABLED = isUpstash || isIoRedis;

// Estado global (por proceso)
let redisClient: Redis | IoRedis | null = null;
let redisDisabled = false;          // por límites/cuotas
let redisDisabledUntil = 0;
let connectionFailed = false;       // por errores de conexión
let connectionFailedUntil = 0;

// Crear cliente sólo bajo demanda
function getRedisClient(): Redis | IoRedis | null {
    if (IS_BUILD) return null;                 // nunca durante build
    if (!REDIS_ENABLED) return null;          // sin URL => deshabilitado
    if (connectionFailed && Date.now() < connectionFailedUntil) return null;
    if (redisClient) return redisClient;

    try {
        if (isUpstash) {
            redisClient = new Redis({
                url: process.env.KV_REST_API_URL!,
                token: process.env.KV_REST_API_TOKEN!,
            });
        } else if (isIoRedis) {
            // ioredis en local / server
            const client = new IoRedis(process.env.REDIS_URL!, {
                lazyConnect: true,                  // no conecta hasta el primer comando
                enableReadyCheck: false,
                maxRetriesPerRequest: 0,
                autoResubscribe: false,
                autoResendUnfulfilledCommands: false,
                connectTimeout: 5000,
            });

            client.on('error', (error) => {
                // ECONNREFUSED / Connection is closed, etc.
                const msg = (error as any)?.message || String(error);
                console.warn(`⚠️ Redis connection error (fallback to DB): ${msg}`);
                connectionFailed = true;
                connectionFailedUntil = Date.now() + 5 * 60 * 1000; // 5 min
                try { client.disconnect(); } catch { /* no-op */ }
            });

            client.on('connect', () => {
                connectionFailed = false;
                connectionFailedUntil = 0;
            });

            redisClient = client;
        } else {
            return null;
        }
    } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.warn(`⚠️ Failed to create Redis client (fallback to DB): ${errorMsg}`);
        return null;
    }
    return redisClient;
}

// API wrapper
export class RedisCache {
    private get client(): Redis | IoRedis | null {
        return getRedisClient();
    }

    private isRedisDisabled(): boolean {
        // Por límites
        if (redisDisabled) {
            if (Date.now() > redisDisabledUntil) {
                redisDisabled = false;
                redisDisabledUntil = 0;
                return false;
            }
            return true;
        }
        // Por conexión
        if (connectionFailed) {
            if (Date.now() > connectionFailedUntil) {
                connectionFailed = false;
                connectionFailedUntil = 0;
                redisClient = null; // nuevo intento en próximo get
                return false;
            }
            return true;
        }
        return false;
    }

    private isLimitError(error: any): boolean {
        if (!error) return false;
        const msg = (error.message || '').toLowerCase();
        const code = (error.code || '').toLowerCase();
        return msg.includes('limit') || msg.includes('quota') || msg.includes('exceeded') ||
            code.includes('limit') || code.includes('quota');
    }

    async get(key: string): Promise<string | null> {
        const c = this.client;
        if (!c || this.isRedisDisabled()) return null;

        try {
            if (isUpstash) {
                return await (c as Redis).get<string | null>(key);
            } else {
                return await (c as IoRedis).get(key);
            }
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            console.warn(`⚠️ Redis GET error (${key}) - fallback to DB: ${errorMsg}`);
            if (this.isLimitError(e)) {
                redisDisabled = true;
                redisDisabledUntil = Date.now() + 24 * 60 * 60 * 1000;
            }
            return null;
        }
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
        const c = this.client;
        if (!c || this.isRedisDisabled()) return false;

        try {
            if (isUpstash) {
                await (c as Redis).set(key, value, ttlSeconds ? { ex: ttlSeconds } : undefined as any);
            } else {
                if (ttlSeconds) await (c as IoRedis).setex(key, ttlSeconds, value);
                else await (c as IoRedis).set(key, value);
            }
            return true;
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            console.warn(`⚠️ Redis SET error (${key}) - fallback to DB: ${errorMsg}`);
            if (this.isLimitError(e)) {
                redisDisabled = true;
                redisDisabledUntil = Date.now() + 24 * 60 * 60 * 1000;
            }
            return false;
        }
    }

    async del(key: string): Promise<boolean> {
        const c = this.client;
        if (!c) return false;
        try {
            if (isUpstash) await (c as Redis).del(key);
            else await (c as IoRedis).del(key);
            return true;
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            console.warn(`⚠️ Redis DEL error (${key}) - fallback to DB: ${errorMsg}`);
            return false;
        }
    }

    async exists(key: string): Promise<boolean> {
        const c = this.client;
        if (!c) return false;
        try {
            if (isUpstash) {
                const r = await (c as Redis).exists(key);
                return (r as unknown as number) > 0;
            } else {
                const r = await (c as IoRedis).exists(key);
                return r === 1;
            }
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            console.warn(`⚠️ Redis EXISTS error (${key}) - fallback to DB: ${errorMsg}`);
            return false;
        }
    }

    // ping sólo bajo demanda (NO en build)
    async ping(): Promise<boolean> {
        const c = this.client;
        if (!c) return false;
        try {
            if (isUpstash) await (c as Redis).ping();
            else await (c as IoRedis).ping();
            return true;
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            console.warn(`⚠️ Redis PING error - fallback to DB: ${errorMsg}`);
            return false;
        }
    }

    async getStatus(opts?: { withPing?: boolean }) {
        const withPing = !!opts?.withPing && !IS_BUILD;
        const c = this.client;
        const pingOk = withPing ? await this.ping() : false;

        const disabled = this.isRedisDisabled();
        const timeLeft = redisDisabled ? Math.max(0, redisDisabledUntil - Date.now()) : 0;
        const connLeft = connectionFailed ? Math.max(0, connectionFailedUntil - Date.now()) : 0;

        return {
            enabled: REDIS_ENABLED && !IS_BUILD,
            provider: isUpstash ? 'upstash' : isIoRedis ? 'ioredis' : 'none',
            connected: withPing ? pingOk : !IS_BUILD && !!c,
            disabled,
            cooldownLeftMs: timeLeft,
            connectionFailed,
            connectionCooldownLeftMs: connLeft,
        };
    }
}

// Singleton lazy
let _instance: RedisCache | null = null;
export function getRedisCache(): RedisCache | null {
    if (IS_BUILD || !REDIS_ENABLED) return null;
    if (!_instance) _instance = new RedisCache();
    return _instance;
}
