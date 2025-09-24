'use client';

import { FormField } from '@/components/admin/abm/generic-form';
import { GridAction, GridColumn } from '@/components/admin/abm/generic-grid-responsive';
import { UnifiedABMLayout } from '@/components/admin/abm/unified-abm-layout';
import { useI18nContext } from '@/components/providers/i18n-provider';
import { TournamentStatusBadge } from '@/components/tournaments/tournament-status-badge';
import { Badge } from '@/components/ui/badge';
import { useEnumI18n } from '@/hooks/use-enum-i18n';
import { useTournamentsOperations } from '@/hooks/use-tournaments-operations';
import { useUnifiedABM } from '@/hooks/use-unified-abm';
import { CheckCircle, Edit, ExternalLink, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Tournament {
  id: number;
  name: string;
  type: string;
  startDate: string;
  endDate?: string;
  locationId?: number;
  seasonId?: number;
  isCompleted?: boolean;
  participantsCount?: number;
  gamesCount?: number;
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
  tournamentResults?: any[];
}

export default function TournamentsUnifiedPage() {
  const { t } = useI18nContext();
  const { tournamentTypeOptions, getTournamentTypeLabel } = useEnumI18n();
  const { loading, load, create, update, remove, restore, finalize } = useTournamentsOperations();

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

  const abm = useUnifiedABM<Tournament>({
    loadFunction: async (showDeleted?: boolean) => {
      const result = await load(showDeleted);
      return { data: (result as any).data || [] };
    },
    createFunction: create,
    updateFunction: (id: number | string, data: Partial<Tournament>) => update(Number(id), data),
    deleteFunction: (id: number | string) => remove(Number(id)),
    restoreFunction: (id: number | string) => restore(Number(id))
  });

  // Configuración de columnas del grid (optimizada para evitar scroll horizontal)
  const columns: GridColumn[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      type: 'number',
      width: '70px'
    },
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      type: 'text'
    },
    {
      key: 'type',
      label: 'Tipo',
      sortable: true,
      type: 'text',
      width: '100px',
      render: (value: string) => (
        <Badge variant="outline">
          {getTournamentTypeLabel(value)}
        </Badge>
      )
    },
    {
      key: 'startDate',
      label: 'Inicio',
      sortable: true,
      type: 'date',
      width: '100px'
    },
    {
      key: 'endDate',
      label: 'Fin',
      sortable: true,
      type: 'date',
      width: '100px',
      render: (value: string | undefined) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      key: 'location.name',
      label: 'Ubicación',
      sortable: true,
      type: 'text',
      width: '120px',
      render: (value: string | undefined) => value !== undefined && value !== null ? value : '-'
    },
    {
      key: 'season.name',
      label: 'Temporada',
      sortable: true,
      type: 'text',
      width: '120px',
      render: (value: string | undefined) => value !== undefined && value !== null ? value : '-'
    },
    {
      key: 'isCompleted',
      label: 'Estado',
      sortable: true,
      type: 'boolean',
      width: '120px',
      render: (value: boolean, row: Tournament) => (
        <TournamentStatusBadge
          tournament={{
            id: row.id,
            name: row.name,
            startDate: new Date(row.startDate),
            endDate: row.endDate ? new Date(row.endDate) : undefined,
            isCompleted: row.isCompleted || false,
            tournamentResults: row.tournamentResults
          }}
        />
      )
    },
    {
      key: 'participantsCount',
      label: 'Participantes',
      sortable: true,
      type: 'number',
      width: '100px',
      render: (value: number | undefined, row: Tournament) => (
        row.tournamentResults?.length || value || 0
      )
    }
  ];

  // Configuración de campos del formulario
  const formFields: FormField[] = [
    { key: 'name', label: 'Nombre', type: 'text', required: true },
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: tournamentTypeOptions.map(o => ({
        value: o.value,
        label: getTournamentTypeLabel(o.value)
      }))
    },
    { key: 'startDate', label: 'Fecha Inicio', type: 'date', required: true },
    { key: 'endDate', label: 'Fecha Fin', type: 'date' },
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
    { key: 'extraData', label: 'Datos Extra', type: 'textarea' }
  ];

  // Estado para modal de confirmación de finalización
  const [finalizeConfirm, setFinalizeConfirm] = useState<{ isOpen: boolean; tournament: Tournament | null }>({
    isOpen: false,
    tournament: null
  });

  // Manejar finalización de torneo
  const handleFinalizeTournament = (tournament: Tournament) => {
    console.log('🟡 Modal FINALIZAR abierto para:', tournament);
    setFinalizeConfirm({ isOpen: true, tournament });
  };

  const handleConfirmFinalize = async () => {
    console.log('🟡 Modal FINALIZAR confirmado para:', finalizeConfirm.tournament);
    if (finalizeConfirm.tournament) {
      try {
        await finalize(finalizeConfirm.tournament.id);
        await abm.handleRefresh(); // Recargar datos
        setFinalizeConfirm({ isOpen: false, tournament: null });
      } catch (error) {
        console.error('Error finalizando torneo:', error);
        setFinalizeConfirm({ isOpen: false, tournament: null });
      }
    }
  };

  const handleCancelFinalize = () => {
    console.log('🟡 Modal FINALIZAR cancelado');
    setFinalizeConfirm({ isOpen: false, tournament: null });
  };

  // Configuración de acciones del grid
  const actions: GridAction[] = [
    {
      key: 'view-results',
      label: 'Ver Resultados',
      icon: ExternalLink,
      variant: 'outline',
      onClick: (row: Tournament) => {
        // Navegar al ABM de Tournament Results
        window.open(`/admin/abm/tournament-results`, '_blank');
      },
      show: (row: Tournament) => !!(row.tournamentResults && row.tournamentResults.length > 0)
    },
    {
      key: 'finalize',
      label: 'Finalizar',
      icon: CheckCircle,
      variant: 'default',
      onClick: (row: Tournament) => handleFinalizeTournament(row),
      show: (row: Tournament) => !row.isCompleted && !row.deleted
    },
    {
      key: 'edit',
      label: 'Editar',
      icon: Edit,
      variant: 'outline',
      onClick: abm.handleEdit,
      show: (row: Tournament) => !row.deleted
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      variant: 'destructive',
      onClick: abm.handleDelete,
      show: (row: Tournament) => !row.deleted
    }
  ];

  return (
    <div className="space-y-4">
      {/* Información adicional */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Gestión de Resultados
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
              Los resultados de torneos se gestionan en el{' '}
              <Link
                href="/admin/abm/tournament-results"
                className="underline hover:no-underline font-medium"
              >
                ABM de Resultados de Torneos
              </Link>
              . Desde allí puedes editar los resultados de cada torneo de forma intuitiva.
            </p>
          </div>
        </div>
      </div>

      <UnifiedABMLayout<Tournament>
        title="Torneos"
        description="Gestiona los torneos - crea, edita y finaliza torneos. Los resultados se gestionan por separado."

        // Estado del formulario
        showForm={abm.showForm}
        editingItem={abm.editingItem}
        formTitle={abm.editingItem ? 'Editar Torneo' : 'Crear Torneo'}

        // Configuración del grid
        data={abm.data}
        columns={columns}
        actions={actions}
        loading={loading}

        // Configuración del formulario
        formFields={formFields}
        formErrors={abm.formErrors}
        formSuccess={abm.formSuccess}
        successMessage=""

        // Configuración de búsqueda y filtros
        searchPlaceholder="Buscar torneos..."
        showDeleted={abm.showDeleted}
        onToggleShowDeleted={abm.handleToggleShowDeleted}

        // Callbacks
        onAdd={abm.handleAdd}
        onRefresh={abm.handleRefresh}
        onFormSubmit={abm.handleFormSubmit}
        onFormCancel={abm.handleFormCancel}

        // Mensajes personalizados
        emptyMessage="No hay torneos registrados"
      />

      {/* Modal de confirmación para finalizar torneo */}
      {finalizeConfirm.isOpen && finalizeConfirm.tournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl text-yellow-600">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirmar finalización
              </h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              ¿Estás seguro de que quieres finalizar el torneo &quot;{finalizeConfirm.tournament.name}&quot;?
              Esta acción calculará los resultados automáticamente y no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelFinalize}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmFinalize}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                Finalizar Torneo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
