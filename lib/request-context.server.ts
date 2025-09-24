import { AsyncLocalStorage } from 'node:async_hooks';
import 'server-only';

export interface RequestAuditContext {
    userId?: string;
    userIp?: string;
    includeDeleted?: boolean;
}

// ALS solo en server
const storage = new AsyncLocalStorage<RequestAuditContext>();

/**
 * Ejecuta `fn` con el contexto de auditoría `ctx`.
 * Debe llamarse únicamente desde código de servidor.
 */
export function runWithRequestContext<T>(ctx: RequestAuditContext, fn: () => T): T {
    return storage.run(ctx, fn);
}

export async function runWithRequestContextAsync<T>(ctx: RequestAuditContext, fn: () => Promise<T>): Promise<T> {
    return await new Promise<T>((resolve, reject) => {
        storage.run(ctx, async () => {
            try {
                resolve(await fn());
            } catch (e) {
                reject(e);
            }
        });
    });
}

/**
 * Obtiene el contexto de auditoría de la request actual.
 * Devuelve `undefined` si no hay contexto activo.
 */
export function getRequestContext(): RequestAuditContext | undefined {
    return storage.getStore();
}
