import { useAbmService } from '@/components/providers/services-provider';
import { useCallback, useState } from 'react';
import { useErrorHandler } from './use-error-handler';

// Hook personalizado para operaciones ABM de Countries
export function useCountriesOperations() {
    const abmService = useAbmService();
    const { handleError, handleSuccess } = useErrorHandler();
    const [loading, setLoading] = useState(false);

    const load = useCallback(async (deleted = false) => {
        setLoading(true);
        try {
            const data = await abmService.getCountries(deleted);
            return data;
        } catch (error) {
            handleError(error, 'Cargar países');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError]);

    const create = useCallback(async (data: any) => {
        setLoading(true);
        try {
            const result = await abmService.createCountry(data);
            handleSuccess('País creado exitosamente', 'Creación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Crear país');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError, handleSuccess]);

    const update = useCallback(async (id: number, data: any) => {
        setLoading(true);
        try {
            const result = await abmService.updateCountry(id, data);
            handleSuccess('País actualizado exitosamente', 'Actualización exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Actualizar país');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError, handleSuccess]);

    const remove = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const result = await abmService.deleteCountry(id);
            handleSuccess('País eliminado exitosamente', 'Eliminación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Eliminar país');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError, handleSuccess]);

    const restore = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const result = await abmService.restoreCountry(id);
            handleSuccess('País restaurado exitosamente', 'Restauración exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Restaurar país');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError, handleSuccess]);

    return {
        loading,
        load,
        create,
        update,
        remove,
        restore,
    };
}

// Hook personalizado para operaciones ABM de Players
export function usePlayersOperations() {
    const abmService = useAbmService();
    const { handleError, handleSuccess } = useErrorHandler();
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await abmService.getPlayers();
            return data;
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

    return {
        loading,
        load,
        create,
        update,
        remove,
        restore,
    };
}

// Hook personalizado para operaciones ABM de UMA
export function useUmaOperations() {
    const abmService = useAbmService();
    const { handleError, handleSuccess } = useErrorHandler();
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await abmService.getUmas();
            return data;
        } catch (error) {
            handleError(error, 'Cargar UMA');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError]);

    const create = useCallback(async (data: any) => {
        setLoading(true);
        try {
            const result = await abmService.createUma(data);
            handleSuccess('UMA creado exitosamente', 'Creación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Crear UMA');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError, handleSuccess]);

    const update = useCallback(async (id: number, data: any) => {
        setLoading(true);
        try {
            const result = await abmService.updateUma(id, data);
            handleSuccess('UMA actualizado exitosamente', 'Actualización exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Actualizar UMA');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError, handleSuccess]);

    const remove = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const result = await abmService.deleteUma(id);
            handleSuccess('UMA eliminado exitosamente', 'Eliminación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Eliminar UMA');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError, handleSuccess]);

    const restore = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const result = await abmService.restoreUma(id);
            handleSuccess('UMA restaurado exitosamente', 'Restauración exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Restaurar UMA');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError, handleSuccess]);

    return {
        loading,
        load,
        create,
        update,
        remove,
        restore,
    };
}
