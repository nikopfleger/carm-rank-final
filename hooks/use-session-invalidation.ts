"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Hook para detectar invalidación forzada de sesión
 * Detecta cuando un admin ha forzado el logout y redirige con mensaje apropiado
 */
export function useSessionInvalidation() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isInvalidated, setIsInvalidated] = useState(false);

    useEffect(() => {
        // Solo verificar si estamos autenticados
        if (status === 'loading') return;

        if (status === 'unauthenticated' && !isInvalidated) {
            // Verificar si venimos de una invalidación forzada
            const params = new URLSearchParams(window.location.search);
            const error = params.get('error');

            if (error === 'session_invalidated') {
                setIsInvalidated(true);
                // Mostrar mensaje y limpiar URL
                const url = new URL(window.location.href);
                url.searchParams.delete('error');
                router.replace(url.pathname + url.search);

                // Mostrar notificación
                if (typeof window !== 'undefined') {
                    // Si hay un sistema de notificaciones global, usarlo
                    // Sino, usar alert como fallback
                    alert('Tu sesión ha sido invalidada por un administrador. Por favor, inicia sesión nuevamente.');
                }
            }
        }
    }, [status, router, isInvalidated]);

    return {
        isInvalidated,
        wasSessionForcedOut: isInvalidated
    };
}
