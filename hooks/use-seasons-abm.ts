import { useCallback, useState } from 'react';
import { useSeasonsOperations } from './use-seasons-operations';
import { useUnifiedABM } from './use-unified-abm';

interface Season {
    id: number;
    name: string;
    startDate: string;
    endDate?: string;
    isActive: boolean;
    isClosed: boolean;
    extraData?: any;
    version: number;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

// Hook especializado para ABM de Seasons con funcionalidades especiales
export function useSeasonsABM() {
    const seasonsOps = useSeasonsOperations();

    // Estados especiales para Seasons
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [seasonToActivate, setSeasonToActivate] = useState<Season | null>(null);
    const [seasonStats, setSeasonStats] = useState<any>(null);
    const [isClosing, setIsClosing] = useState(false);

    // ⚓️ funciones estables
    const loadFn = useCallback(async (showDeleted?: boolean) => {
        const result = await seasonsOps.load(showDeleted);
        return result;
    }, [seasonsOps.load]);

    const createFn = useCallback((data: Partial<Season>) => seasonsOps.create(data), [seasonsOps.create]);

    const updateFn = useCallback((id: number | string, data: Partial<Season>) => {
        // Formatear fechas antes de enviar
        const formattedData = {
            ...data,
            startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
            endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        };
        return seasonsOps.update(Number(id), formattedData);
    }, [seasonsOps.update]);

    const deleteFn = useCallback((id: number | string) => seasonsOps.remove(Number(id)), [seasonsOps.remove]);
    const restoreFn = useCallback((id: number | string) => seasonsOps.restore(Number(id)), [seasonsOps.restore]);

    // Hook base unificado
    const abm = useUnifiedABM<Season>({
        loadFunction: loadFn,
        createFunction: createFn,
        updateFunction: updateFn,
        deleteFunction: deleteFn,
        restoreFunction: restoreFn
    });

    // Función especial para manejar edición con formato de fechas
    const handleEditSeason = (season: Season) => {
        // Formatear fechas para el formulario
        const formattedSeason = {
            ...season,
            startDate: season.startDate ? new Date(season.startDate).toISOString().split('T')[0] : '',
            endDate: season.endDate ? new Date(season.endDate).toISOString().split('T')[0] : ''
        };
        abm.handleEdit(formattedSeason);
    };

    // Función especial para activar/cerrar temporadas
    const handleActivateSeason = async (season: Season) => {
        try {
            // Si es la temporada activa, mostrar modal para cerrarla
            if (season.isActive) {
                setSeasonToActivate(null); // Solo cerrar, no activar otra

                // Cargar estadísticas de la temporada actual
                const stats = await seasonsOps.getSeasonStats(season.id);
                if (stats) {
                    setSeasonStats(stats);
                }

                setShowCloseModal(true);
                return;
            }

            const currentActiveSeason = abm.data.find(s => s.isActive);

            // Si no hay temporada activa, activar directamente
            if (!currentActiveSeason) {
                await seasonsOps.activateSeason(season.id);
                await abm.loadData();
                return;
            }

            // Si hay temporada activa y queremos activar otra, mostrar modal de confirmación
            setSeasonToActivate(season);

            // Cargar estadísticas de la temporada actual
            const stats = await seasonsOps.getSeasonStats(currentActiveSeason.id);
            if (stats) {
                setSeasonStats(stats);
            }

            setShowCloseModal(true);
        } catch (error) {
            console.error('Error handling season activation:', error);
        }
    };

    // Función para confirmar el cierre de temporada
    const handleConfirmSeasonClose = async () => {
        const currentActiveSeason = abm.data.find(s => s.isActive);
        if (!currentActiveSeason) return;

        setIsClosing(true);

        try {
            await seasonsOps.closeSeason(
                currentActiveSeason.id,
                seasonToActivate?.id
            );

            // Recargar temporadas
            await abm.loadData();

            // Cerrar modal
            setShowCloseModal(false);
            setSeasonToActivate(null);
            setSeasonStats(null);

        } catch (error) {
            console.error('Error closing season:', error);
        } finally {
            setIsClosing(false);
        }
    };

    // Función para cancelar el cierre de temporada
    const handleCancelSeasonClose = () => {
        setShowCloseModal(false);
        setSeasonToActivate(null);
        setSeasonStats(null);
    };

    return {
        // Propiedades del ABM base
        ...abm,

        // Sobrescribir handleEdit con formato especial
        handleEdit: handleEditSeason,

        // Estados especiales para Seasons
        showCloseModal,
        seasonToActivate,
        seasonStats,
        isClosing,

        // Funciones especiales para Seasons
        handleActivateSeason,
        handleConfirmSeasonClose,
        handleCancelSeasonClose,

        // Loading combinado
        loading: abm.loading || seasonsOps.loading,
    };
}
