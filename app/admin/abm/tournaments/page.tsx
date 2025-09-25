"use client";

import { FormField } from "@/components/admin/abm/generic-form";
import { GridAction, GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import UnifiedABMLayout from "@/components/admin/abm/unified-abm-layout";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "@/components/ui/icons";
import { useCrud } from "@/hooks/use-crud";
import { useEnumI18n } from "@/hooks/use-enum-i18n";
import { useEffect, useMemo, useState } from "react";


interface Tournament {
    id: number;
    name: string;
    type: string;
    startDate: string;
    endDate?: string;
    locationId?: number;
    seasonId?: number;
    isCompleted: boolean;
    maxPlayers?: number;
    entryFee?: number;
    prizePool?: number;
    extraData?: any;
    version: number;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
    location?: {
        id: number;
        name: string;
    };
    season?: {
        id: number;
        name: string;
    };
}

export default function TournamentsABMPage() {
    const abm = useCrud<Tournament>({ resource: 'tournaments' });
    const { tournamentTypeOptions, getTournamentTypeLabel } = useEnumI18n();

    // Estados para opciones de selects
    const [locations, setLocations] = useState<any[]>([]);
    const [seasons, setSeasons] = useState<any[]>([]);

    // Cargar datos relacionados
    useEffect(() => {
        const loadRelatedData = async () => {
            try {
                // Cargar ubicaciones
                const locationsResponse = await fetch("/api/abm/locations");
                const locationsResult = await locationsResponse.json();
                const locationsData = locationsResult.data || locationsResult;
                setLocations(locationsData.map((loc: any) => ({
                    value: loc.id,
                    label: loc.name
                })));

                // Cargar temporadas
                const seasonsResponse = await fetch("/api/abm/seasons");
                const seasonsResult = await seasonsResponse.json();
                const seasonsData = seasonsResult.data || seasonsResult;
                setSeasons(seasonsData.map((season: any) => ({
                    value: season.id,
                    label: season.name
                })));
            } catch (error) {
                console.error("Error cargando datos relacionados:", error);
            }
        };

        loadRelatedData();
    }, []);

    // ===== Config del grid =====
    const columns: GridColumn[] = useMemo(() => [
        {
            key: 'name',
            label: 'Nombre',
            sortable: true
        },
        {
            key: 'type',
            label: 'Tipo',
            type: 'badge',
            width: '120px',
            sortable: true,
            render: (value: string) => (
                <Badge variant="outline">
                    {getTournamentTypeLabel(value)}
                </Badge>
            )
        },
        {
            key: 'startDate',
            label: 'Fecha Inicio',
            type: 'date',
            width: '120px',
            sortable: true
        },
        {
            key: 'endDate',
            label: 'Fecha Fin',
            type: 'date',
            width: '120px',
            sortable: true
        },
        {
            key: 'location',
            label: 'Ubicación',
            width: '150px',
            render: (value: any) => value?.name || '-'
        },
        {
            key: 'season',
            label: 'Temporada',
            width: '150px',
            render: (value: any) => value?.name || '-'
        },
        {
            key: 'isCompleted',
            label: 'Estado',
            type: 'boolean',
            width: '100px',
            render: (value: boolean) => (
                <Badge variant={value ? 'default' : 'secondary'}>
                    {value ? 'Completado' : 'Activo'}
                </Badge>
            )
        },
        {
            key: 'version',
            label: 'Versión',
            type: 'badge',
            width: '80px',
            sortable: true
        },
        {
            key: 'deleted',
            label: 'Estado',
            type: 'boolean',
            width: '100px',
            render: (value: boolean) => (
                <Badge variant={value ? 'destructive' : 'default'}>
                    {value ? 'Eliminado' : 'Activo'}
                </Badge>
            )
        },
        {
            key: 'updatedAt',
            label: 'Última Modificación',
            type: 'date',
            width: '150px',
            sortable: true
        }
    ], [getTournamentTypeLabel]);

    // Usamos acciones genéricas del grid
    const actions: GridAction[] = useMemo(() => [
        {
            key: 'manage-results',
            label: 'Gestionar Resultados',
            icon: ExternalLink,
            variant: 'outline',
            onClick: () => {
                window.open('/admin/abm/tournament-results', '_blank');
            },
            show: () => true
        }
    ], []);

    // ===== Form =====
    const formFields: FormField[] = useMemo(() => [
        {
            key: 'name',
            label: 'Nombre',
            type: 'text',
            required: true,
            placeholder: 'ej: Torneo de Primavera 2024'
        },
        {
            key: 'type',
            label: 'Tipo',
            type: 'select',
            required: true,
            options: tournamentTypeOptions.map(o => ({
                value: String(o.value).toLowerCase(),
                label: getTournamentTypeLabel(o.value)
            }))
        },
        {
            key: 'startDate',
            label: 'Fecha Inicio',
            type: 'date',
            required: true
        },
        {
            key: 'endDate',
            label: 'Fecha Fin',
            type: 'date'
        },
        {
            key: 'locationId',
            label: 'Ubicación',
            type: 'select',
            options: locations
        },
        {
            key: 'seasonId',
            label: 'Temporada',
            type: 'select',
            required: true,
            options: seasons
        },
        {
            key: 'maxPlayers',
            label: 'Máximo de Jugadores',
            type: 'number'
        },
        {
            key: 'entryFee',
            label: 'Costo de Inscripción',
            type: 'number'
        },
        {
            key: 'prizePool',
            label: 'Premio Total',
            type: 'number'
        },
        {
            key: 'extraData',
            label: 'Datos Extra',
            type: 'textarea'
        }
    ], [tournamentTypeOptions, getTournamentTypeLabel, locations, seasons]);

    return (
        <UnifiedABMLayout
            title="Administración de Torneos"
            description="Gestiona los torneos del sistema - para resultados y finalización, usa el ABM de Tournament Results"

            // Estado del formulario
            showForm={abm.showForm}
            editingItem={abm.editingItem}

            // Grid
            data={abm.data}
            columns={columns}
            actions={actions}
            loading={abm.loading}

            // Form
            formFields={formFields}
            formErrors={abm.formErrors}
            formSuccess={abm.formSuccess}
            successMessage="Torneo guardado correctamente"

            // Búsqueda / filtros
            searchPlaceholder="Buscar torneos..."
            showDeleted={abm.showDeleted}
            onToggleShowDeleted={abm.handleToggleShowDeleted}

            // Callbacks
            onAdd={abm.handleAdd}
            onRefresh={abm.handleRefresh}
            onEditRow={abm.handleEdit}
            onDeleteRow={abm.handleDelete}
            onRestoreRow={abm.handleRestore}
            onFormSubmit={abm.handleFormSubmit}
            onFormCancel={abm.handleCancel}

            // Empty
            emptyMessage="No hay torneos registrados"
        />
    );
}