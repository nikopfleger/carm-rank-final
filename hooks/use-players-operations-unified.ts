import { useAbmService } from '@/components/providers/services-provider';
import { useCallback, useState } from 'react';
import { useErrorHandler } from './use-error-handler';

// Hook personalizado para operaciones ABM de Players (versión unificada)
export function usePlayersOperationsUnified() {
    const abmService = useAbmService();
    const { handleError, handleSuccess } = useErrorHandler();
    const [loading, setLoading] = useState(false);

    const load = useCallback(async (showDeleted = false) => {
        setLoading(true);
        try {
            let data;
            if (showDeleted) {
                // Cargar incluyendo eliminados
                const response = await fetch('/api/abm/players?includeDeleted=true');
                if (response.ok) {
                    data = await response.json();
                } else {
                    data = [];
                }
            } else {
                // Cargar solo activos usando el servicio ABM
                data = await abmService.getPlayers();
            }
            return { data: data || [] };
        } catch (error) {
            handleError(error, 'Cargar jugadores');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError]);

    const create = useCallback(async (data: any) => {
        setLoading(true);
        try {
            const result = await abmService.createPlayer(data);
            handleSuccess('Jugador creado exitosamente', 'Creación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Crear jugador');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError, handleSuccess]);

    const update = useCallback(async (id: number, data: any) => {
        setLoading(true);
        try {
            const result = await abmService.updatePlayer(id, data);
            handleSuccess('Jugador actualizado exitosamente', 'Actualización exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Actualizar jugador');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError, handleSuccess]);

    const remove = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const result = await abmService.deletePlayer(id);
            handleSuccess('Jugador eliminado exitosamente', 'Eliminación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Eliminar jugador');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError, handleSuccess]);

    const restore = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const result = await abmService.restorePlayer(id);
            handleSuccess('Jugador restaurado exitosamente', 'Restauración exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Restaurar jugador');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError, handleSuccess]);

    // Función para cargar países
    const loadCountries = useCallback(async () => {
        try {
            const response = await abmService.getCountries();
            const data = (response as any).data || [];
            return data.map((country: any) => ({
                id: country.id,
                name_es: country.fullName || country.name_es,
                iso_code: country.isoCode || country.iso_code
            }));
        } catch (error) {
            handleError(error, 'Cargar países');
            return [];
        }
    }, [abmService, handleError]);

    return {
        loading,
        load,
        create,
        update,
        remove,
        restore,
        loadCountries,
    };
}
