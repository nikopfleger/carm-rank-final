import { useAbmService } from '@/components/providers/services-provider';
import { useState } from 'react';
import { useErrorHandler } from './use-error-handler';

// Hook personalizado para operaciones ABM de Season Configs
export function useSeasonConfigsOperations() {
    const abmService = useAbmService();
    const { handleError, handleSuccess } = useErrorHandler();
    const [loading, setLoading] = useState(false);

    const load = async (showDeleted = false) => {
        setLoading(true);
        try {
            const data = await abmService.getSeasonConfigs();
            return { data: (data as any).data || [] };
        } catch (error) {
            handleError(error, 'Cargar configuraciones de temporada');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const create = async (data: any) => {
        setLoading(true);
        try {
            const result = await abmService.createSeasonConfig(data);
            handleSuccess('Configuración de temporada creada exitosamente', 'Creación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Crear configuración de temporada');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const update = async (id: number, data: any) => {
        setLoading(true);
        try {
            const result = await abmService.updateSeasonConfig(id, data);
            handleSuccess('Configuración de temporada actualizada exitosamente', 'Actualización exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Actualizar configuración de temporada');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const remove = async (id: number) => {
        setLoading(true);
        try {
            const result = await abmService.deleteSeasonConfig(id);
            handleSuccess('Configuración de temporada eliminada exitosamente', 'Eliminación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Eliminar configuración de temporada');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const restore = async (id: number) => {
        setLoading(true);
        try {
            const result = await abmService.restoreSeasonConfig(id);
            handleSuccess('Configuración de temporada restaurada exitosamente', 'Restauración exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Restaurar configuración de temporada');
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
    };
}
