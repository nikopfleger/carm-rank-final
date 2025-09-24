import { useAbmService } from '@/components/providers/services-provider';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useErrorHandler } from './use-error-handler';

export function usePlayersOperationsUnified() {
    const abmService = useAbmService();
    const { handleError, handleSuccess } = useErrorHandler();
    const [loading, setLoading] = useState(false);

    // Mantener refs a las funciones de notificación para no meterlas en deps
    const errorRef = useRef(handleError);
    const successRef = useRef(handleSuccess);
    useEffect(() => {
        errorRef.current = handleError;
        successRef.current = handleSuccess;
    }, [handleError, handleSuccess]);

    const load = useCallback(
        async (showDeleted = false) => {
            setLoading(true);
            try {
                if (showDeleted) {
                    const response = await fetch('/api/abm/players?includeDeleted=true', { cache: 'no-store' });
                    if (!response.ok) return { data: [] };
                    const json = await response.json();
                    // Aseguramos forma { data: [...] }
                    return Array.isArray(json) ? { data: json } : { data: json?.data ?? [] };
                } else {
                    const res: any = await abmService.getPlayers();
                    return { data: Array.isArray(res) ? res : res?.data ?? [] };
                }
            } catch (err) {
                errorRef.current(err, 'Cargar jugadores');
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [abmService] // <- solo depende del service
    );

    const create = useCallback(
        async (data: any) => {
            setLoading(true);
            try {
                const result = await abmService.createPlayer(data);
                successRef.current('Jugador creado exitosamente', 'Creación exitosa');
                return result;
            } catch (err) {
                errorRef.current(err, 'Crear jugador');
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [abmService]
    );

    const update = useCallback(
        async (id: number, data: any) => {
            setLoading(true);
            try {
                const result = await abmService.updatePlayer(id, data);
                successRef.current('Jugador actualizado exitosamente', 'Actualización exitosa');
                return result;
            } catch (err) {
                errorRef.current(err, 'Actualizar jugador');
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [abmService]
    );

    const remove = useCallback(
        async (id: number) => {
            setLoading(true);
            try {
                const result = await abmService.deletePlayer(id);
                successRef.current('Jugador eliminado exitosamente', 'Eliminación exitosa');
                return result;
            } catch (err) {
                errorRef.current(err, 'Eliminar jugador');
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [abmService]
    );

    const restore = useCallback(
        async (id: number) => {
            setLoading(true);
            try {
                const result = await abmService.restorePlayer(id);
                successRef.current('Jugador restaurado exitosamente', 'Restauración exitosa');
                return result;
            } catch (err) {
                errorRef.current(err, 'Restaurar jugador');
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [abmService]
    );

    const loadCountries = useCallback(
        async () => {
            try {
                const response = await abmService.getCountries();
                const raw = (response as any)?.data ?? response ?? [];
                return raw.map((country: any) => ({
                    id: country.id,
                    name_es: country.fullName ?? country.name_es,
                    iso_code: country.isoCode ?? country.iso_code,
                }));
            } catch (err) {
                errorRef.current(err, 'Cargar países');
                return [];
            }
        },
        [abmService]
    );

    // Devolver objeto memoizado para que el caller no vea una referencia nueva cada render
    return useMemo(
        () => ({ loading, load, create, update, remove, restore, loadCountries }),
        [loading, load, create, update, remove, restore, loadCountries]
    );
}
