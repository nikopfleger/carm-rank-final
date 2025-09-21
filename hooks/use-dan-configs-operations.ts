import { useAbmService } from '@/components/providers/services-provider';
import { useState } from 'react';
import { useErrorHandler } from './use-error-handler';

// Hook personalizado para operaciones ABM de Dan Configs
export function useDanConfigsOperations() {
    const abmService = useAbmService();
    const { handleError, handleSuccess } = useErrorHandler();
    const [loading, setLoading] = useState(false);

    const load = async (showDeleted = false) => {
        setLoading(true);
        try {
            const data = await abmService.getDanConfigs();
            return { data: (data as any).data || [] };
        } catch (error) {
            handleError(error, 'Cargar configuraciones DAN');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const create = async (data: any) => {
        setLoading(true);
        try {
            const result = await abmService.createDanConfig(data);
            handleSuccess('Configuración DAN creada exitosamente', 'Creación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Crear configuración DAN');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const update = async (id: number, data: any) => {
        setLoading(true);
        try {
            const result = await abmService.updateDanConfig(id, data);
            handleSuccess('Configuración DAN actualizada exitosamente', 'Actualización exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Actualizar configuración DAN');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const remove = async (id: number) => {
        setLoading(true);
        try {
            const result = await abmService.deleteDanConfig(id);
            handleSuccess('Configuración DAN eliminada exitosamente', 'Eliminación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Eliminar configuración DAN');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const restore = async (id: number) => {
        setLoading(true);
        try {
            const result = await abmService.restoreDanConfig(id);
            handleSuccess('Configuración DAN restaurada exitosamente', 'Restauración exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Restaurar configuración DAN');
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
