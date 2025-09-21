'use client';

import { useEffect } from 'react';
import { useErrorHandler } from './use-error-handler';

export function useGlobalErrorBoundary() {
    const { handleError } = useErrorHandler();

    useEffect(() => {
        // Manejar errores no capturados
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error('Unhandled promise rejection:', event.reason);
            handleError(event.reason, 'Error de Promesa');
        };

        const handleErrorEvent = (event: ErrorEvent) => {
            console.error('Global error:', event.error);
            handleError(event.error, 'Error Global');
        };

        // Agregar listeners
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        window.addEventListener('error', handleErrorEvent);

        // Cleanup
        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            window.removeEventListener('error', handleErrorEvent);
        };
    }, []); // Removido handleError de las dependencias
}
