import { useCallback } from 'react';
import { useErrorHandler } from './use-error-handler';

/**
 * Hook para manejar errores de concurrencia en el frontend
 */
export function useConcurrencyErrorHandler() {
    const { handleError } = useErrorHandler();

    const handleConcurrencyError = useCallback((error: unknown, operation: string) => {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Detectar errores de concurrencia específicos
        if (errorMessage.includes('Row was updated or deleted by another transaction') ||
            errorMessage.includes('unsaved-value mapping was incorrect') ||
            errorMessage.includes('concurrent') ||
            errorMessage.includes('version')) {

            handleError(
                new Error(`Conflicto de concurrencia: ${operation}. El registro fue modificado por otro usuario. Por favor, recarga la página e intenta nuevamente.`),
                operation
            );
            return true;
        }

        return false;
    }, [handleError]);

    const handleOptimisticLockError = useCallback((error: unknown, operation: string, response?: any) => {
        // Detectar errores de optimistic lock desde la respuesta del servidor
        if (response?.code === 'OPTIMISTIC_LOCK') {
            const currentVersion = response.currentVersion;
            const lastModified = response.lastModified;

            handleError(
                new Error(`El registro fue modificado por otro usuario (versión actual: ${currentVersion}). ¿Desea actualizar con los datos más recientes?`),
                operation
            );
            return true;
        }

        return false;
    }, [handleError]);

    return {
        handleConcurrencyError,
        handleOptimisticLockError,
    };
}
