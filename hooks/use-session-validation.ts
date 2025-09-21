import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SessionValidationState {
    isValidating: boolean;
    isValid: boolean | null;
    error: string | null;
}

export function useSessionValidation(enableAutoValidation: boolean = false) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [validationState, setValidationState] = useState<SessionValidationState>({
        isValidating: false,
        isValid: null,
        error: null
    });

    useEffect(() => {
        // Solo validar automáticamente si está habilitado
        if (!enableAutoValidation) return;

        async function validateSession() {
            if (status === 'loading') return;

            if (!session) {
                setValidationState({ isValidating: false, isValid: false, error: 'no_session' });
                return;
            }

            setValidationState(prev => ({ ...prev, isValidating: true }));

            try {
                const response = await fetch('/api/auth/validate-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const result = await response.json();

                if (!result.valid) {
                    setValidationState({
                        isValidating: false,
                        isValid: false,
                        error: result.reason
                    });

                    // Forzar logout del cliente y redirigir según el tipo de error
                    if (result.reason === 'session_invalidated') {
                        console.log('🔒 Sesión invalidada por administrador - forzando logout');
                        await signOut({ redirect: false });
                        router.push('/auth/signin?error=session_invalidated&message=Tu sesión ha sido invalidada por un administrador');
                    } else if (result.reason === 'user_inactive') {
                        console.log('🔒 Usuario desactivado - forzando logout');
                        await signOut({ redirect: false });
                        router.push('/auth/signin?error=account_disabled&message=Tu cuenta ha sido desactivada');
                    }
                } else {
                    setValidationState({
                        isValidating: false,
                        isValid: true,
                        error: null
                    });
                }
            } catch (error) {
                console.error('Error validating session:', error);
                setValidationState({
                    isValidating: false,
                    isValid: false,
                    error: 'validation_error'
                });
            }
        }

        validateSession();
    }, [session, status, router, enableAutoValidation]);

    const validateManually = async () => {
        if (status === 'loading' || !session) return;

        setValidationState(prev => ({ ...prev, isValidating: true }));

        try {
            const response = await fetch('/api/auth/validate-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (!result.valid) {
                setValidationState({
                    isValidating: false,
                    isValid: false,
                    error: result.reason
                });

                // Forzar logout del cliente y redirigir según el tipo de error
                if (result.reason === 'session_invalidated') {
                    console.log('🔒 Sesión invalidada por administrador - forzando logout');
                    await signOut({ redirect: false });
                    router.push('/auth/signin?error=session_invalidated&message=Tu sesión ha sido invalidada por un administrador');
                } else if (result.reason === 'user_inactive') {
                    console.log('🔒 Usuario desactivado - forzando logout');
                    await signOut({ redirect: false });
                    router.push('/auth/signin?error=account_disabled&message=Tu cuenta ha sido desactivada');
                }
            } else {
                setValidationState({
                    isValidating: false,
                    isValid: true,
                    error: null
                });
            }
        } catch (error) {
            console.error('Error validating session:', error);
            setValidationState({
                isValidating: false,
                isValid: false,
                error: 'validation_error'
            });
        }
    };

    return { ...validationState, validateManually };
}

export function useAdminGuard() {
    const { data: session } = useSession();
    const validation = useSessionValidation();
    const router = useRouter();

    useEffect(() => {
        if (validation.isValid === false) {
            return; // useSessionValidation already handles redirects
        }

        if (session && validation.isValid) {
            const userRole = (session.user as any)?.role;
            if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
                router.push('/');
            }
        }
    }, [session, validation.isValid, router]);

    return {
        isLoading: validation.isValidating,
        hasAccess: validation.isValid && ['SUPER_ADMIN', 'ADMIN'].includes((session?.user as any)?.role),
        error: validation.error
    };
}
