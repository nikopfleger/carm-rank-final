"use client";

import { GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { SeasonResultsEditor } from "@/components/admin/season-results-editor";
import { Badge } from "@/components/ui/badge";
import { Edit, Trophy, Users } from "@/components/ui/icons";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { formatYmdForDisplay, toYmd } from '@/lib/format-utils';
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
const UnifiedABMLayout = dynamic(() => import("@/components/admin/abm/unified-abm-layout").then(m => m.UnifiedABMLayout));

interface Season {
    id: number;
    name: string;
    startDate: string;
    endDate?: string;
    isActive: boolean;
    isClosed: boolean;
    participantsCount?: number;
    gamesCount?: number;
    seasonResults?: SeasonResultData[];
}

interface SeasonResultData {
    id?: number;
    seasonId: number;
    playerId: number;
    isSanma: boolean;
    seasonTotalGames: number;
    seasonAveragePosition: number;
    seasonFirstPlaceH: number;
    seasonSecondPlaceH: number;
    seasonThirdPlaceH: number;
    seasonFourthPlaceH: number;
    seasonFirstPlaceT: number;
    seasonSecondPlaceT: number;
    seasonThirdPlaceT: number;
    seasonFourthPlaceT: number;
    seasonPoints: number;
    player: {
        id: number;
        nickname: string;
        fullname?: string;
        playerNumber: number;
    };
}

export default function SeasonResultsSpecialPage() {
    const { handleError, handleSuccess } = useErrorHandler();
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingSeason, setEditingSeason] = useState<Season | null>(null);
    const [showEditor, setShowEditor] = useState(false);

    // Cargar temporadas
    const loadSeasons = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/abm/seasons?includeResults=true');
            if (response.ok) {
                const data = await response.json();
                setSeasons(data);
            } else {
                throw new Error('Error cargando temporadas');
            }
        } catch (error) {
            handleError(error, 'Cargar temporadas');
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    useEffect(() => {
        loadSeasons();
    }, [loadSeasons]);

    // Configuración de columnas del grid
    const columns: GridColumn[] = [
        {
            key: 'id',
            label: 'ID',
            sortable: true,
            type: 'number',
            width: '80px'
        },
        {
            key: 'name',
            label: 'Nombre de la Temporada',
            sortable: true,
            type: 'text'
        },
        {
            key: 'startDate',
            label: 'Fecha Inicio',
            sortable: true,
            type: 'date',
            width: '120px'
        },
        {
            key: 'endDate',
            label: 'Fecha Fin',
            sortable: true,
            type: 'date',
            width: '120px',
            render: (value: string | undefined) => value ? formatYmdForDisplay(toYmd(value), 'es-AR') : '-'
        },
        {
            key: 'isActive',
            label: 'Estado',
            sortable: true,
            type: 'boolean',
            width: '120px',
            render: (value: boolean, row: Season) => {
                if (row.isClosed) {
                    return <Badge variant="secondary">Cerrada</Badge>;
                } else if (value) {
                    return <Badge variant="default">Activa</Badge>;
                } else {
                    return <Badge variant="outline">Inactiva</Badge>;
                }
            }
        },
        {
            key: 'participantsCount',
            label: 'Participantes',
            sortable: true,
            type: 'number',
            width: '120px',
            render: (value: number | undefined, row: Season) => (
                <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {row.seasonResults?.length || value || 0}
                </div>
            )
        },
        {
            key: 'seasonResults',
            label: 'Resultados',
            type: 'text',
            width: '120px',
            render: (value: SeasonResultData[] | undefined) => (
                <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    {value?.length || 0}
                </div>
            )
        }
    ];

    // Manejar edición de resultados
    const handleEditResults = (season: Season) => {
        setEditingSeason(season);
        setShowEditor(true);
    };

    // Manejar guardado de resultados
    const handleSaveResults = async (seasonId: number, results: SeasonResultData[]) => {
        try {
            const response = await fetch(`/api/abm/season-results/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    seasonId,
                    results
                })
            });

            if (response.ok) {
                handleSuccess('Resultados de la temporada guardados exitosamente', 'Guardado exitoso');
                setShowEditor(false);
                setEditingSeason(null);
                await loadSeasons(); // Recargar datos
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Error guardando resultados');
            }
        } catch (error) {
            handleError(error, 'Guardar resultados de la temporada');
        }
    };

    // Configuración de acciones del grid
    const actions = [
        {
            key: 'edit-results',
            label: 'Ver/Editar Resultados',
            icon: Edit,
            variant: 'outline' as const,
            onClick: (row: Season) => handleEditResults(row),
            show: (row: Season) => row.isClosed || !!(row.seasonResults && row.seasonResults.length > 0)
        }
    ];

    return (
        <>
            <UnifiedABMLayout
                title="Resultados de Temporadas"
                description="Gestiona los resultados finales de las temporadas - los resultados se generan automáticamente al cerrar una temporada"

                // Estado del formulario (no usado, pero requerido)
                showForm={false}
                editingItem={null}
                formTitle=""

                // Configuración del grid
                data={seasons}
                columns={columns}
                actions={actions}
                loading={loading}
                includeAddButton={false}
                includeEditButton={false}
                includeDeleteButton={false}
                includeRestoreButton={false}

                // Configuración del formulario (no usado)
                formFields={[]}
                formErrors={{}}
                formSuccess={false}
                successMessage=""

                // Configuración de búsqueda y filtros
                searchPlaceholder="Buscar temporadas..."
                showDeleted={false}
                onToggleShowDeleted={undefined}

                // Callbacks (no usados para este ABM especial)
                onAdd={() => { }} // No agregamos temporadas desde aquí
                onRefresh={loadSeasons}
                onFormSubmit={() => Promise.resolve()}
                onFormCancel={() => { }}

                // Mensajes personalizados
                emptyMessage="No hay temporadas registradas"
            />

            {/* Editor de resultados */}
            {showEditor && editingSeason && (
                <SeasonResultsEditor
                    season={editingSeason}
                    onSave={(results) => handleSaveResults(editingSeason.id, results)}
                    onCancel={() => {
                        setShowEditor(false);
                        setEditingSeason(null);
                    }}
                />
            )}
        </>
    );
}