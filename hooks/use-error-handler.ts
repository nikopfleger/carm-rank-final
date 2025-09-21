'use client';

import { useNotifications } from '@/components/providers/notification-provider';
import { useCallback } from 'react';

export interface ErrorDetails {
    message: string;
    code?: string;
    status?: number;
    details?: any;
}

export function useErrorHandler() {
    const { addNotification } = useNotifications();

    const handleError = useCallback((error: any, context?: string) => {
        console.error('Error occurred:', error, context ? `Context: ${context}` : '');

        let errorMessage = 'Ha ocurrido un error inesperado';
        let errorTitle = 'Error';
        let isCritical = false;

        // Manejar diferentes tipos de errores
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else if (error?.message) {
            errorMessage = error.message;
        } else if (error?.error) {
            errorMessage = error.error;
        }

        // Detectar errores críticos
        if (error?.status >= 500 || error?.code === 'INTERNAL_SERVER_ERROR') {
            isCritical = true;
            errorTitle = 'Error del Servidor';
            errorMessage = 'Error grave del sistema. Contacte al administrador.';
        } else if (error?.status === 403) {
            errorTitle = 'Sin Permisos';
            errorMessage = 'No tienes permisos para realizar esta acción.';
        } else if (error?.status === 401) {
            errorTitle = 'No Autorizado';
            errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (error?.status === 404) {
            errorTitle = 'No Encontrado';
            errorMessage = 'El recurso solicitado no existe.';
        } else if (error?.status >= 400 && error?.status < 500) {
            errorTitle = 'Error de Solicitud';
        }

        // Agregar contexto si está disponible
        if (context) {
            errorTitle = `${errorTitle} - ${context}`;
        }

        addNotification({
            type: isCritical ? 'error' : 'error',
            title: errorTitle,
            message: errorMessage,
            duration: isCritical ? 10000 : 5000, // Errores críticos duran más
            action: isCritical ? {
                label: 'Ver Consola',
                onClick: () => {
                    console.error('Error crítico - Detalles completos:', error);
                    // En desarrollo, también podríamos abrir DevTools
                    if (process.env.NODE_ENV === 'development') {
                        console.log('💡 Tip: Revisa la consola para más detalles del error');
                    }
                }
            } : undefined
        });

        return {
            title: errorTitle,
            message: errorMessage,
            isCritical
        };
    }, [addNotification]);

    const handleSuccess = useCallback((message: string, title: string = 'Éxito') => {
        addNotification({
            type: 'success',
            title,
            message,
            duration: 3000
        });
    }, [addNotification]);

    const handleWarning = useCallback((message: string, title: string = 'Advertencia') => {
        addNotification({
            type: 'warning',
            title,
            message,
            duration: 4000
        });
    }, [addNotification]);

    const handleInfo = useCallback((message: string, title: string = 'Información') => {
        addNotification({
            type: 'info',
            title,
            message,
            duration: 4000
        });
    }, [addNotification]);

    return {
        handleError,
        handleSuccess,
        handleWarning,
        handleInfo
    };
}
