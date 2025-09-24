import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * Códigos de error de Prisma relacionados con concurrencia
 */
export const CONCURRENCY_ERROR_CODES = {
    // Violación de restricción única (duplicate key)
    UNIQUE_CONSTRAINT: 'P2002',
    // Registro no encontrado (puede ser por concurrencia)
    RECORD_NOT_FOUND: 'P2025',
    // Error de transacción (deadlock, timeout, etc.)
    TRANSACTION_ERROR: 'P2034',
} as const;

/**
 * Verifica si un error es de concurrencia
 */
export function isConcurrencyError(error: unknown): boolean {
    if (error instanceof PrismaClientKnownRequestError) {
        return Object.values(CONCURRENCY_ERROR_CODES).includes(error.code as any);
    }

    // Verificar error de optimistic lock
    if (error instanceof Error && error.message === 'OPTIMISTIC_LOCK') {
        return true;
    }

    // También verificar mensajes de error comunes
    const errorMessage = error instanceof Error ? error.message : String(error);
    return errorMessage.includes('Row was updated or deleted by another transaction') ||
        errorMessage.includes('unsaved-value mapping was incorrect') ||
        errorMessage.includes('concurrent') ||
        errorMessage.includes('deadlock');
}

/**
 * Verifica si un error es específicamente de optimistic lock
 */
export function isOptimisticLockError(error: unknown): boolean {
    return error instanceof Error && error.message === 'OPTIMISTIC_LOCK';
}

/**
 * Maneja errores de concurrencia con retry automático
 */
export async function handleConcurrencyError<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 100
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            if (!isConcurrencyError(error)) {
                // No es un error de concurrencia, re-lanzar inmediatamente
                throw error;
            }

            if (attempt === maxRetries) {
                // Último intento falló
                break;
            }

            // Calcular delay exponencial con jitter
            const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 50;
            console.warn(`⚠️ Error de concurrencia en intento ${attempt}/${maxRetries}, reintentando en ${delay}ms...`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // Todos los reintentos fallaron
    console.error(`❌ Error de concurrencia persistente después de ${maxRetries} intentos`);
    throw lastError;
}

/**
 * Verifica la versión antes de actualizar (optimistic locking)
 */
export async function updateWithVersionCheck<T>(
    prisma: any,
    model: string,
    where: any,
    data: any,
    expectedVersion: number
): Promise<T> {
    return handleConcurrencyError(async () => {
        // Agregar verificación de versión al where
        const whereWithVersion = {
            ...where,
            version: expectedVersion
        };

        const result = await (prisma as any)[model].update({
            where: whereWithVersion,
            data: {
                ...data,
                version: { increment: 1 }
            }
        });

        return result;
    });
}

/**
 * Upsert con verificación de versión
 */
export async function upsertWithVersionCheck<T>(
    prisma: any,
    model: string,
    where: any,
    create: any,
    update: any,
    expectedVersion?: number
): Promise<T> {
    return handleConcurrencyError(async () => {
        if (expectedVersion !== undefined) {
            // Si tenemos versión esperada, verificar antes del upsert
            const existing = await (prisma as any)[model].findUnique({
                where,
                select: { version: true }
            });

            if (existing && existing.version !== expectedVersion) {
                throw new Error(`Versión esperada ${expectedVersion} pero encontrada ${existing.version}`);
            }
        }

        return await (prisma as any)[model].upsert({
            where,
            create,
            update: {
                ...update,
                version: { increment: 1 }
            }
        });
    });
}

/**
 * Wrapper para operaciones que pueden fallar por concurrencia
 */
export function withConcurrencyHandling<T extends (...args: any[]) => Promise<any>>(
    operation: T,
    maxRetries: number = 3
): T {
    return (async (...args: Parameters<T>) => {
        return handleConcurrencyError(
            () => operation(...args),
            maxRetries
        );
    }) as T;
}
