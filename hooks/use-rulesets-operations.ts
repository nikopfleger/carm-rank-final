import { useAbmService } from '@/components/providers/services-provider';
import { useState } from 'react';
import { useErrorHandler } from './use-error-handler';

// Hook personalizado para operaciones ABM de Rulesets
export function useRulesetsOperations() {
    const abmService = useAbmService();
    const { handleError, handleSuccess } = useErrorHandler();
    const [loading, setLoading] = useState(false);

    const load = async (showDeleted = false) => {
        setLoading(true);
        try {
            const data = await abmService.getRulesets();
            return { data: (data as any).data || [] };
        } catch (error) {
            handleError(error, 'Cargar reglas');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const create = async (data: any) => {
        setLoading(true);
        try {
            const result = await abmService.createRuleset(data);
            handleSuccess('Regla creada exitosamente', 'Creación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Crear regla');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const update = async (id: number, data: any) => {
        setLoading(true);
        try {
            const result = await abmService.updateRuleset(id, data);
            handleSuccess('Regla actualizada exitosamente', 'Actualización exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Actualizar regla');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const remove = async (id: number) => {
        setLoading(true);
        try {
            const result = await abmService.deleteRuleset(id);
            handleSuccess('Regla eliminada exitosamente', 'Eliminación exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Eliminar regla');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const restore = async (id: number) => {
        setLoading(true);
        try {
            const result = await abmService.restoreRuleset(id);
            handleSuccess('Regla restaurada exitosamente', 'Restauración exitosa');
            return result;
        } catch (error) {
            handleError(error, 'Restaurar regla');
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
