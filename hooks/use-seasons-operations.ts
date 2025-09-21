import { useAbmService } from '@/components/providers/services-provider';
import { useState } from 'react';
import { useErrorHandler } from './use-error-handler';

// Hook personalizado para operaciones ABM de Seasons
export function useSeasonsOperations() {
    const abmService = useAbmService();
    const { handleError, handleSuccess } = useErrorHandler();
    const [loading, setLoading] = useState(false);

    const load = async (showDeleted = false) => {
        setLoading(true);
        try {
            const url = showDeleted ? "/api/abm/seasons?includeDeleted=true" : "/api/abm/seasons";
            const response = await fetch(url);
            const data = await response.json();
            return { data: data || [] };
        } catch (error) {
            handleError(error, 'Cargar temporadas');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const create = async (data: any) => {
        setLoading(true);
        try {
            const response = await fetch("/api/abm/seasons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Error creating season');
            const result = await response.json();
            handleSuccess('Temporada creada exitosamente', 'Creación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Crear temporada');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const update = async (id: number, data: any) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/abm/seasons/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Error updating season');
            const result = await response.json();
            handleSuccess('Temporada actualizada exitosamente', 'Actualización exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Actualizar temporada');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const remove = async (id: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/abm/seasons/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error('Error deleting season');
            handleSuccess('Temporada eliminada exitosamente', 'Eliminación exitosa');
            return true;
        } catch (error) {
            handleError(error, 'Eliminar temporada');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const restore = async (id: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/abm/seasons/${id}/restore`, {
                method: "POST",
            });
            if (!response.ok) throw new Error('Error restoring season');
            handleSuccess('Temporada restaurada exitosamente', 'Restauración exitosa');
            return true;
        } catch (error) {
            handleError(error, 'Restaurar temporada');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Funciones especiales para Seasons
    const activateSeason = async (seasonId: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/seasons/${seasonId}?action=activate`, {
                method: 'POST'
            });
            if (!response.ok) throw new Error('Error activating season');
            handleSuccess('Temporada activada exitosamente', 'Activación exitosa');
            return true;
        } catch (error) {
            handleError(error, 'Activar temporada');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getSeasonStats = async (seasonId: number) => {
        try {
            const response = await fetch(`/api/seasons/${seasonId}/close`);
            if (response.ok) {
                const statsData = await response.json();
                return statsData.data;
            }
            return null;
        } catch (error) {
            console.error('Error loading season stats', error);
            return null;
        }
    };

    const closeSeason = async (currentSeasonId: number, newSeasonId?: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/seasons/${currentSeasonId}/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newSeasonId: newSeasonId || null,
                    confirmationText: 'CONFIRMAR'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to close season');
            }

            const message = newSeasonId
                ? 'Temporada cerrada y nueva temporada activada exitosamente'
                : 'Temporada cerrada exitosamente';
            handleSuccess(message, 'Cierre exitoso');
            return true;
        } catch (error) {
            handleError(error, 'Cerrar temporada');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        load,
        create,
        update,
        remove,
        restore,
        // Funciones especiales
        activateSeason,
        getSeasonStats,
        closeSeason,
    };
}
