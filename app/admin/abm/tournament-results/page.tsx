"use client";

import { GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { UnifiedABMLayout } from "@/components/admin/abm/unified-abm-layout";
import { TournamentResultsEditor } from "@/components/admin/tournament-results-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { AlertTriangle, CheckCircle, Edit, Trophy, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Tournament {
  id: number;
  name: string;
  type: string;
  startDate: string;
  endDate?: string;
  isCompleted: boolean;
  participantsCount?: number;
  gamesCount?: number;
  location?: {
    id: number;
    name: string;
  };
  season?: {
    id: number;
    name: string;
  };
  tournamentResults?: TournamentResultData[];
}

interface TournamentResultData {
  id?: number;
  position: number;
  pointsWon: number;
  prizeWon?: number;
  playerId: number;
  player: {
    id: number;
    nickname: string;
    fullname?: string;
  };
}

export default function TournamentResultsSpecialPage() {
  const { handleError, handleSuccess } = useErrorHandler();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [finalizeConfirm, setFinalizeConfirm] = useState<{ isOpen: boolean; tournament: Tournament | null }>({
    isOpen: false,
    tournament: null
  });

  // Cargar torneos
  const loadTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/abm/tournaments?includeResults=true');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data);
      } else {
        throw new Error('Error cargando torneos');
      }
    } catch (error) {
      handleError(error, 'Cargar torneos');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

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
      label: 'Nombre del Torneo',
      sortable: true,
      type: 'text'
    },
    {
      key: 'type',
      label: 'Tipo',
      sortable: true,
      type: 'text',
      width: '120px'
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
      render: (value: string | undefined) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      key: 'location.name',
      label: 'Ubicación',
      sortable: true,
      type: 'text',
      width: '150px',
      render: (value: string | undefined) => value !== undefined && value !== null ? value : '-'
    },
    {
      key: 'season.name',
      label: 'Temporada',
      sortable: true,
      type: 'text',
      width: '150px',
      render: (value: string | undefined) => value !== undefined && value !== null ? value : '-'
    },
    {
      key: 'isCompleted',
      label: 'Estado',
      sortable: true,
      type: 'boolean',
      width: '120px',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Completado' : 'En Curso'}
        </Badge>
      )
    },
    {
      key: 'participantsCount',
      label: 'Participantes',
      sortable: true,
      type: 'number',
      width: '120px',
      render: (value: number | undefined, row: Tournament) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {row.tournamentResults?.length || value || 0}
        </div>
      )
    },
    {
      key: 'tournamentResults',
      label: 'Resultados',
      type: 'text',
      width: '120px',
      render: (value: TournamentResultData[] | undefined) => (
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4" />
          {value?.length || 0}
        </div>
      )
    }
  ];

  // Manejar edición de resultados
  const handleEditResults = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setShowEditor(true);
  };

  // Manejar guardado de resultados
  const handleSaveResults = async (tournamentId: number, results: TournamentResultData[]) => {
    try {
      const response = await fetch(`/api/abm/tournament-results/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tournamentId,
          results
        })
      });

      if (response.ok) {
        handleSuccess('Resultados del torneo guardados exitosamente', 'Guardado exitoso');
        setShowEditor(false);
        setEditingTournament(null);
        await loadTournaments(); // Recargar datos
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error guardando resultados');
      }
    } catch (error) {
      handleError(error, 'Guardar resultados del torneo');
    }
  };

  // Manejar finalización de torneo
  const handleFinalizeTournament = (tournament: Tournament) => {
    setFinalizeConfirm({ isOpen: true, tournament });
  };

  const handleConfirmFinalize = async () => {
    if (!finalizeConfirm.tournament) return;

    try {
      const response = await fetch(`/api/abm/tournament-results/${finalizeConfirm.tournament.id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        handleSuccess('Torneo finalizado exitosamente. Los puntos de temporada han sido cargados.', 'Finalización exitosa');
        setFinalizeConfirm({ isOpen: false, tournament: null });
        await loadTournaments(); // Recargar datos
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error finalizando torneo');
      }
    } catch (error) {
      handleError(error, 'Finalizar torneo');
      setFinalizeConfirm({ isOpen: false, tournament: null });
    }
  };

  const handleCancelFinalize = () => {
    setFinalizeConfirm({ isOpen: false, tournament: null });
  };

  // Configuración de acciones del grid
  const actions = [
    {
      key: 'edit-results',
      label: 'Editar Resultados',
      icon: Edit,
      variant: 'outline' as const,
      onClick: (row: Tournament) => handleEditResults(row),
      show: () => true
    },
    {
      key: 'finalize',
      label: 'Finalizar Torneo',
      icon: CheckCircle,
      variant: 'default' as const,
      onClick: (row: Tournament) => handleFinalizeTournament(row),
      show: (row: Tournament) => !row.isCompleted && (row.tournamentResults?.length || 0) > 0
    }
  ];

  return (
    <>
      <UnifiedABMLayout<Tournament>
        title="Resultados de Torneos"
        description="Gestiona los resultados de los torneos - selecciona un torneo para editar sus resultados"

        // Estado del formulario (no usado, pero requerido)
        showForm={false}
        editingItem={null}
        formTitle=""

        // Configuración del grid
        data={tournaments}
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
        searchPlaceholder="Buscar torneos..."
        showDeleted={false}
        onToggleShowDeleted={undefined}

        // Callbacks (no usados para este ABM especial)
        onAdd={() => { }} // No agregamos torneos desde aquí
        onRefresh={loadTournaments}
        onFormSubmit={() => Promise.resolve()}
        onFormCancel={() => { }}

        // Mensajes personalizados
        emptyMessage="No hay torneos registrados"
      />

      {/* Editor de resultados */}
      {showEditor && editingTournament && (
        <TournamentResultsEditor
          tournament={editingTournament}
          onSave={(results) => handleSaveResults(editingTournament.id, results)}
          onCancel={() => {
            setShowEditor(false);
            setEditingTournament(null);
          }}
        />
      )}

      {/* Modal de confirmación de finalización */}
      <Dialog open={finalizeConfirm.isOpen} onOpenChange={(open) => !open && handleCancelFinalize()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Finalizar Torneo
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <div className="font-semibold text-amber-700">
                ⚠️ Esta acción realizará las siguientes operaciones:
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Cerrar el torneo:</strong> Se marcará como completado y se establecerá fecha de fin</li>
                <li><strong>Cargar puntos de temporada:</strong> Se convertirán los resultados en puntos para el ranking</li>
                <li><strong>Procesar ranking:</strong> Los puntos se aplicarán a la temporada correspondiente</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="font-medium text-amber-800">
                  Torneo: <strong>{finalizeConfirm.tournament?.name}</strong>
                </div>
                <div className="text-sm text-amber-700">
                  Esta acción no se puede deshacer.
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelFinalize}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmFinalize}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar Torneo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}