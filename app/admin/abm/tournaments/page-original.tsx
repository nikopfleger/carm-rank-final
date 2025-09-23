"use client";

import { GenericForm } from "@/components/admin/abm/generic-form";
import { GenericGridResponsive as GenericGrid } from "@/components/admin/abm/generic-grid-responsive";
import { AddFieldDef, InlineSubABM, SubABMRow } from "@/components/admin/abm/InlineSubABM";
import { TournamentFinalizeModal } from "@/components/admin/tournament-finalize-modal";
import { useI18nContext } from "@/components/providers/i18n-provider";
import { TournamentStatusBadge, getTournamentStatus } from "@/components/tournaments/tournament-status-badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { useEnumI18n } from "@/hooks/use-enum-i18n";
import { CheckCircle, Lock, Plus } from "lucide-react";
import { useEffect, useState } from "react";

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
  tournamentResults?: TournamentResult[];
}

interface TournamentResult extends SubABMRow {
  id: number;
  tournamentId: number;
  playerId: number;
  position: number;
  pointsWon: number;
  prizeWon?: number;
  player?: {
    id: number;
    nickname: string;
    fullname?: string;
  };
}

// fieldConfig se define dentro del componente para acceder a los hooks

// Las columnas se definen dentro del componente para acceder a las funciones

// Configuración para el sub-ABM de tournament results
const tournamentResultColumns = [
  {
    key: "player.nickname", label: "Jugador", render: (row: TournamentResult) =>
      row && row.player ? `${row.player.nickname}${row.player.fullname ? ` (${row.player.fullname})` : ''}` : 'N/A'
  },
  { key: "position", label: "Posición" },
  { key: "pointsWon", label: "Puntos Ganados" },
  {
    key: "prizeWon", label: "Premio", render: (row: TournamentResult) =>
      row && row.prizeWon ? `$${row.prizeWon.toFixed(2)}` : 'N/A'
  },
];

const tournamentResultAddFields: AddFieldDef[] = [
  { key: "playerId", label: "Jugador", type: "select", required: true, options: [], placeholder: "Seleccionar jugador" },
  { key: "position", label: "Posición Final", type: "text", required: true, placeholder: "1, 2, 3..." },
  { key: "pointsWon", label: "Puntos Ganados", type: "text", required: true, placeholder: "100, 200, 300..." },
  { key: "prizeWon", label: "Premio Ganado", type: "text", required: false, placeholder: "0.00" },
];

export default function TournamentsABMPage() {
  const { t } = useI18nContext();
  const { tournamentTypeOptions, getTournamentTypeLabel } = useEnumI18n();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  // Configuración de campos del formulario
  const fieldConfig = {
    id: { type: "number", label: "ID", readOnly: true },
    name: { type: "text", label: "Nombre", required: true },
    type: {
      type: "select", label: "Tipo", required: true,
      options: tournamentTypeOptions.map(o => ({ value: o.value, label: getTournamentTypeLabel(o.value) }))
    },
    startDate: { type: "date", label: "Fecha Inicio", required: true },
    endDate: { type: "date", label: "Fecha Fin" },
    locationId: { type: "select", label: "Ubicación", options: [] },
    seasonId: { type: "select", label: "Temporada", options: [] },
    maxPlayers: { type: "number", label: "Máximo de Jugadores", min: 4, max: 100 },
    entryFee: { type: "number", label: "Costo de Inscripción", min: 0, step: 0.01 },
    prizePool: { type: "number", label: "Premio Total", min: 0, step: 0.01 },
    extraData: { type: "textarea", label: "Datos Extra" },
    version: { type: "number", label: "Versión", readOnly: true },
    deleted: { type: "boolean", label: "Eliminado", readOnly: true },
    createdAt: { type: "datetime", label: "Creado", readOnly: true },
    updatedAt: { type: "datetime", label: "Actualizado", readOnly: true },
  };

  // Estados para el sub-ABM de tournament results
  const [tournamentResults, setTournamentResults] = useState<TournamentResult[]>([]);
  const [pendingAdds, setPendingAdds] = useState<TournamentResult[]>([]);
  const [pendingDeletes, setPendingDeletes] = useState<number[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<Record<number, Partial<TournamentResult>>>({});

  // Estados para el modal de finalización de torneo
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [tournamentToFinalize, setTournamentToFinalize] = useState<Tournament | null>(null);
  const [tournamentParticipants, setTournamentParticipants] = useState<any[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);

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
        // evitar mutar fuera de estado; se rellena en render usando locations

        // Cargar temporadas
        const seasonsResponse = await fetch("/api/abm/seasons");
        const seasonsResult = await seasonsResponse.json();
        const seasonsData = seasonsResult.data || seasonsResult;
        setSeasons(seasonsData.map((season: any) => ({
          value: season.id,
          label: season.name
        })));
        // evitar mutar fuera de estado; se rellena en render usando seasons

        // Cargar jugadores
        const playersResponse = await fetch("/api/abm/players");
        const playersResult = await playersResponse.json();
        const playersData = playersResult.data || playersResult;
        const playersOptions = playersData.map((player: any) => ({
          value: player.id,
          label: `${player.nickname}${player.fullname ? ` (${player.fullname})` : ''}`
        }));
        setPlayers(playersOptions);
        // evitar mutación directa; se pasa como prop en render
      } catch (error) {
        console.error("Error cargando datos relacionados:", error);
      }
    };

    loadRelatedData();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/abm/tournaments");
      const result = await response.json();
      const data = result.data || result;
      setTournaments(data);
    } catch (error) {
      console.error("Error cargando torneos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleCreate = () => {
    setEditingTournament(null);
    setShowForm(true);
  };

  const handleEdit = async (tournament: Tournament) => {
    // Formatear fechas para el formulario
    const formattedTournament = {
      ...tournament,
      type: tournament.type ? String(tournament.type).toLowerCase() : '',
      startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : '',
      endDate: tournament.endDate ? new Date(tournament.endDate).toISOString().split('T')[0] : ''
    };
    setEditingTournament(formattedTournament);
    setShowForm(true);
    // Cargar resultados del torneo
    await loadTournamentResults(tournament.id);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este torneo?")) {
      try {
        await fetch(`/api/abm/tournaments/${id}`, {
          method: "DELETE",
        });
        loadTournaments();
      } catch (error) {
        console.error("Error eliminando torneo:", error);
      }
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await fetch(`/api/abm/tournaments/${id}/restore`, {
        method: "POST",
      });
      loadTournaments();
    } catch (error) {
      console.error("Error restaurando torneo:", error);
    }
  };

  const handleCloseTournament = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres cerrar este torneo? Esta acción no se puede deshacer.")) {
      try {
        await fetch(`/api/abm/tournaments/${id}/close`, {
          method: "POST",
        });
        loadTournaments();
      } catch (error) {
        console.error("Error cerrando torneo:", error);
      }
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingTournament) {
        await fetch(`/api/abm/tournaments/${editingTournament.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await fetch("/api/abm/tournaments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      setShowForm(false);
      setEditingTournament(null);
      loadTournaments();
    } catch (error) {
      console.error("Error guardando torneo:", error);
    }
  };

  // Funciones para el sub-ABM de tournament results
  const loadTournamentResults = async (tournamentId: number) => {
    try {
      const response = await fetch(`/api/abm/tournament-results?tournamentId=${tournamentId}`);
      const result = await response.json();
      const data = result.data || result;
      setTournamentResults(data);
    } catch (error) {
      console.error("Error cargando resultados del torneo:", error);
    }
  };

  const handleStageAdd = (draft: Partial<TournamentResult>) => {
    const newResult: TournamentResult = {
      id: Date.now(), // ID temporal
      tournamentId: editingTournament?.id || 0,
      playerId: parseInt(draft.playerId as any),
      position: parseInt(draft.position as any),
      pointsWon: parseInt(draft.pointsWon as any),
      prizeWon: draft.prizeWon ? parseFloat(draft.prizeWon as any) : undefined,
      pending: true
    };
    setPendingAdds(prev => [...prev, newResult]);
  };

  const handleStageDelete = (id: number) => {
    setPendingDeletes(prev => [...prev, id]);
  };

  const handleStageRestore = (id: number) => {
    setPendingDeletes(prev => prev.filter(delId => delId !== id));
  };

  const handleStageUpdate = (id: number, partial: Partial<TournamentResult>) => {
    setPendingUpdates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...partial }
    }));
  };

  const saveTournamentResults = async () => {
    try {
      // Guardar adds
      for (const add of pendingAdds) {
        await fetch("/api/abm/tournament-results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tournamentId: add.tournamentId,
            playerId: add.playerId,
            position: add.position,
            pointsWon: add.pointsWon,
            prizeWon: add.prizeWon
          }),
        });
      }

      // Guardar updates
      for (const [id, updates] of Object.entries(pendingUpdates)) {
        await fetch(`/api/abm/tournament-results/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
      }

      // Guardar deletes
      for (const id of pendingDeletes) {
        await fetch(`/api/abm/tournament-results/${id}`, {
          method: "DELETE",
        });
      }

      // Limpiar estados pendientes
      setPendingAdds([]);
      setPendingDeletes([]);
      setPendingUpdates({});

      // Recargar resultados
      if (editingTournament) {
        await loadTournamentResults(editingTournament.id);
      }
    } catch (error) {
      console.error("Error guardando resultados del torneo:", error);
    }
  };

  const handleFinalizeTournament = async (tournament: Tournament) => {
    setTournamentToFinalize(tournament);

    // Cargar información del torneo y participantes
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/finalize`);
      if (res.ok) {
        const data = await res.json();
        setTournamentParticipants(data.data.participants || []);
      }
    } catch (e) {
      console.error('Error loading tournament info', e);
    }

    setShowFinalizeModal(true);
  };

  const handleConfirmFinalizeTournament = async () => {
    if (!tournamentToFinalize) return;

    setIsFinalizing(true);

    try {
      const res = await fetch(`/api/tournaments/${tournamentToFinalize.id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationText: 'FINALIZAR'
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to finalize tournament');
      }

      // Recargar torneos
      await loadTournaments();

      // Cerrar modal
      setShowFinalizeModal(false);
      setTournamentToFinalize(null);
      setTournamentParticipants([]);

      alert('Torneo finalizado exitosamente');

    } catch (e) {
      console.error('Error finalizing tournament', e);
      alert('Error al finalizar torneo: ' + (e as Error).message);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleCancelFinalizeTournament = () => {
    setShowFinalizeModal(false);
    setTournamentToFinalize(null);
    setTournamentParticipants([]);
  };

  // Definir columnas dentro del componente para acceder a las funciones
  const columns = [
    { key: "id", label: "ID", width: "80px" },
    { key: "name", label: "Nombre", width: "200px" },
    {
      key: "type",
      label: "Tipo",
      width: "100px",
      render: (value: any, row: Tournament) => (row && row.type ? getTournamentTypeLabel(row.type) : 'N/A')
    },
    { key: "maxPlayers", label: "Max Jugadores", width: "100px" },
    {
      key: "startDate",
      label: "Inicio",
      width: "100px",
      render: (value: any, row: Tournament) => row && row.startDate ? new Date(row.startDate).toLocaleDateString('es-AR') : 'N/A'
    },
    {
      key: "endDate",
      label: "Fin",
      width: "100px",
      render: (value: any, row: Tournament) => row && row.endDate ? new Date(row.endDate).toLocaleDateString('es-AR') : 'N/A'
    },
    { key: "location.name", label: "Ubicación", width: "120px" },
    { key: "season.name", label: "Temporada", width: "120px" },
    {
      key: "status",
      label: "Estado",
      width: "120px",
      render: (value: any, row: Tournament) => row ? (
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
      ) : null
    },
    {
      key: "actions",
      label: "Acciones",
      width: "150px",
      render: (value: any, row: Tournament) => {
        if (!row) return null;
        const status = getTournamentStatus({
          id: row.id,
          name: row.name,
          startDate: new Date(row.startDate),
          endDate: row.endDate ? new Date(row.endDate) : undefined,
          isCompleted: row.isCompleted || false,
          tournamentResults: row.tournamentResults
        });

        return (
          <div className="flex gap-2">
            {!row.endDate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCloseTournament(row.id)}
                className="text-orange-600 hover:text-orange-700"
              >
                <Lock className="w-4 h-4 mr-1" />
                Cerrar
              </Button>
            )}
            {status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFinalizeTournament(row)}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Finalizar
              </Button>
            )}
            {row.endDate && status === 'completed' && (
              <span className="text-sm text-gray-500">Finalizado</span>
            )}
          </div>
        );
      }
    },
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Administración de Torneos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona torneos y competencias
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Torneo
        </Button>
      </div>

      <GenericGrid
        data={tournaments}
        columns={columns}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
        searchFields={["name", "type"]}
        entityName="torneo"
      />

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingTournament ? "Editar Torneo" : "Nuevo Torneo"}
            </h2>

            <GenericForm
              initialData={editingTournament}
              fields={Object.entries(fieldConfig)
                .filter(([key]) => key !== "version" && key !== "extraData")
                .map(([key, config]) => ({
                  key,
                  label: config.label,
                  type: config.type as any,
                  required: (config as any).required,
                  options: key === 'locationId' ? locations : key === 'seasonId' ? seasons : (config as any).options,
                  validation: (config as any).min !== undefined || (config as any).max !== undefined ? {
                    min: (config as any).min,
                    max: (config as any).max,
                    message: (config as any).step ? `Debe ser un número con máximo ${(config as any).step} decimales` : undefined
                  } : undefined,
                  readonly: (config as any).readOnly,
                  placeholder: (config as any).placeholder
                }))}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingTournament(null);
                setTournamentResults([]);
                setPendingAdds([]);
                setPendingDeletes([]);
                setPendingUpdates({});
              }}
              title=""
            />

            {/* Sub-ABM para Tournament Results */}
            {editingTournament && (
              <div className="mt-6">
                <InlineSubABM
                  title="Resultados del Torneo"
                  columns={tournamentResultColumns}
                  rows={tournamentResults}
                  onStageAdd={handleStageAdd}
                  onStageDelete={handleStageDelete}
                  onStageRestore={handleStageRestore}
                  onStageUpdate={handleStageUpdate}
                  pendingAdds={pendingAdds}
                  pendingDeletes={pendingDeletes}
                  pendingUpdates={pendingUpdates}
                  addFields={[
                    { ...tournamentResultAddFields[0], options: players },
                    tournamentResultAddFields[1],
                    tournamentResultAddFields[2],
                    tournamentResultAddFields[3],
                  ]}
                  customChangeCounter={
                    (pendingAdds.length > 0 || Object.keys(pendingUpdates).length > 0 || pendingDeletes.length > 0) && (
                      <div className="mt-2 text-xs text-gray-500">
                        Cambios pendientes: +{pendingAdds.length} / ~{Object.keys(pendingUpdates).length} / -{pendingDeletes.length}.
                        <Button
                          size="sm"
                          onClick={saveTournamentResults}
                          className="ml-2"
                        >
                          Guardar Cambios
                        </Button>
                      </div>
                    )
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de finalización de torneo */}
      <TournamentFinalizeModal
        isOpen={showFinalizeModal}
        tournament={tournamentToFinalize ? {
          id: tournamentToFinalize.id,
          name: tournamentToFinalize.name,
          startDate: new Date(tournamentToFinalize.startDate),
          endDate: tournamentToFinalize.endDate ? new Date(tournamentToFinalize.endDate) : undefined,
          isCompleted: tournamentToFinalize.isCompleted || false,
          participantsCount: tournamentParticipants.length,
          gamesCount: tournamentToFinalize.gamesCount,
          type: tournamentToFinalize.type
        } : null}
        participants={tournamentParticipants}
        onConfirm={handleConfirmFinalizeTournament}
        onCancel={handleCancelFinalizeTournament}
        loading={isFinalizing}
      />
    </div>
  );
}
