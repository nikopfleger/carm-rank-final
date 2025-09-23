// Solo importar AsyncLocalStorage en el servidor
let AsyncLocalStorage: any;
if (typeof window === 'undefined') {
    try {
        AsyncLocalStorage = require('node:async_hooks').AsyncLocalStorage;
    } catch (error) {
        // Fallback si no está disponible
        AsyncLocalStorage = null;
    }
}

export interface RequestAuditContext {
    userId?: string;
    userIp?: string;
}

// Solo crear storage en el servidor
let storage: any = null;
if (typeof window === 'undefined' && AsyncLocalStorage) {
    storage = new AsyncLocalStorage();
}

export function runWithRequestContext<T>(ctx: RequestAuditContext, fn: () => T): T {
    if (typeof window !== 'undefined' || !storage) {
        // En el cliente, ejecutar directamente sin contexto
        return fn();
    }
    return storage.run(ctx, fn);
}

export function getRequestContext(): RequestAuditContext | undefined {
    if (typeof window !== 'undefined' || !storage) {
        // En el cliente, retornar contexto vacío
        return undefined;
    }
    return storage.getStore();
}


