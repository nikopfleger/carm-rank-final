import { useAbmService } from '@/components/providers/services-provider';
import { useState } from 'react';
import { useErrorHandler } from './use-error-handler';

// Hook personalizado para operaciones ABM de Rate Configs
export function useRateConfigsOperations() {
    const abmService = useAbmService();
    const { handleError, handleSuccess } = useErrorHandler();
    const [loading, setLoading] = useState(false);

    const load = async (showDeleted = false) => {
        setLoading(true);
        try {
            const data = await abmService.getRateConfigs();
            return { data: (data as any).data || [] };
        } catch (error) {
            handleError(error, 'Cargar configuraciones RATE');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const create = async (data: any) => {
        setLoading(true);
        try {
            const result = await abmService.createRateConfig(data);
            handleSuccess('Configuración RATE creada exitosamente', 'Creación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Crear configuración RATE');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const update = async (id: number, data: any) => {
        setLoading(true);
        try {
            const result = await abmService.updateRateConfig(id, data);
            handleSuccess('Configuración RATE actualizada exitosamente', 'Actualización exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Actualizar configuración RATE');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const remove = async (id: number) => {
        setLoading(true);
        try {
            const result = await abmService.deleteRateConfig(id);
            handleSuccess('Configuración RATE eliminada exitosamente', 'Eliminación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Eliminar configuración RATE');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const restore = async (id: number) => {
        setLoading(true);
        try {
            const result = await abmService.restoreRateConfig(id);
            handleSuccess('Configuración RATE restaurada exitosamente', 'Restauración exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Restaurar configuración RATE');
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
