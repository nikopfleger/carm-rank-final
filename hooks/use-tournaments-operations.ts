import { useAbmService } from '@/components/providers/services-provider';
import { useCallback, useState } from 'react';
import { useErrorHandler } from './use-error-handler';

// Hook personalizado para operaciones ABM de Tournaments
export function useTournamentsOperations() {
    const abmService = useAbmService();
    const { handleError, handleSuccess } = useErrorHandler();
    const [loading, setLoading] = useState(false);

    const load = useCallback(async (showDeleted = false) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/abm/tournaments${showDeleted ? '?includeDeleted=true' : ''}`);
            if (response.ok) {
                const data = await response.json();
                return { data: data || [] };
            } else {
                throw new Error('Error cargando torneos');
            }
        } catch (error) {
            handleError(error, 'Cargar torneos');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    const create = useCallback(async (data: any) => {
        setLoading(true);
        try {
            // Primero validar usando el endpoint específico
            const validateResponse = await fetch('/api/abm/tournaments/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!validateResponse.ok) {
                const error = await validateResponse.json();
                throw new Error(error.error || 'Error de validación');
            }

            const validatedData = await validateResponse.json();

            // Luego crear usando el API genérico
            const response = await fetch('/api/abm/tournaments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(validatedData.data)
            });

            if (response.ok) {
                const result = await response.json();
                handleSuccess('Torneo creado exitosamente', 'Creación exitosa');
                return result.data;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Error creando torneo');
            }
        } catch (error) {
            handleError(error, 'Crear torneo');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [handleError, handleSuccess]);

    const update = useCallback(async (id: number, data: any) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/abm/tournaments/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                handleSuccess('Torneo actualizado exitosamente', 'Actualización exitosa');
                return result;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Error actualizando torneo');
            }
        } catch (error) {
            handleError(error, 'Actualizar torneo');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [handleError, handleSuccess]);

    const remove = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/abm/tournaments/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                handleSuccess('Torneo eliminado exitosamente', 'Eliminación exitosa');
                return true;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Error eliminando torneo');
            }
        } catch (error) {
            handleError(error, 'Eliminar torneo');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [handleError, handleSuccess]);

    const restore = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/abm/tournaments/${id}/restore`, {
                method: 'POST'
            });

            if (response.ok) {
                handleSuccess('Torneo restaurado exitosamente', 'Restauración exitosa');
                return true;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Error restaurando torneo');
            }
        } catch (error) {
            handleError(error, 'Restaurar torneo');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [handleError, handleSuccess]);

    const finalize = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/tournaments/${id}/finalize`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                handleSuccess('Torneo finalizado exitosamente', 'Finalización exitosa');
                return result;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Error finalizando torneo');
            }
        } catch (error) {
            handleError(error, 'Finalizar torneo');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [handleError, handleSuccess]);

    return {
        loading,
        load,
        create,
        update,
        remove,
        restore,
        finalize
    };
}
