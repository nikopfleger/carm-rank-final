import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestAuditContext {
    userId?: string;
    userIp?: string;
}

const storage = new AsyncLocalStorage<RequestAuditContext>();

export function runWithRequestContext<T>(ctx: RequestAuditContext, fn: () => T): T {
    return storage.run(ctx, fn);
}

export function getRequestContext(): RequestAuditContext | undefined {
    return storage.getStore();
}


