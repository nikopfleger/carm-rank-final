"use client";

import { GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { UnifiedABMLayout } from "@/components/admin/abm/unified-abm-layout";
import PlayerSingleAutocomplete, { Player } from "@/components/players/player-single-autocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
// Dialog ya no se usa - finalización automática
import { useI18nContext } from "@/components/providers/i18n-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { Edit, Minus, Plus, Trophy, Users } from "lucide-react";
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
  version: number;
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
    playerNumber?: number;
  };
}

export default function TournamentResultsSpecialPage() {
  const { handleError, handleSuccess } = useErrorHandler();
  const { t } = useI18nContext();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado para el editor de resultados unificado
  const [showResultsEditor, setShowResultsEditor] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [results, setResults] = useState<TournamentResultData[]>([]);

  // Nota: La finalización ahora es automática al guardar resultados

  // Cargar torneos
  const loadTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/abm/tournaments');
      if (response.ok) {
        const result = await response.json();
        // El endpoint genérico devuelve { success: true, data: rows }
        const data = result.success ? result.data : result;
        setTournaments(Array.isArray(data) ? data : []);
      } else {
        throw new Error(t('abm.tournamentResults.errors.loadTournaments'));
      }
    } catch (error) {
      handleError(error, t('abm.tournamentResults.errors.loadTournaments'));
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
      label: t('abm.tournamentResults.columnHeaders.tournament'),
      sortable: true,
      type: 'text'
    },
    {
      key: 'type',
      label: t('abm.tournamentResults.columnHeaders.type'),
      sortable: true,
      type: 'text',
      width: '120px'
    },
    {
      key: 'startDate',
      label: t('abm.tournamentResults.columnHeaders.date'),
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
      label: t('abm.tournamentResults.columnHeaders.status'),
      sortable: true,
      type: 'boolean',
      width: '120px',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? t('abm.tournamentResults.completed') : t('abm.tournamentResults.inProgress')}
        </Badge>
      )
    },
    {
      key: 'participantsCount',
      label: t('abm.tournamentResults.columnHeaders.participants'),
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

    // Inicializar resultados
    if (tournament.tournamentResults && tournament.tournamentResults.length > 0) {
      setResults([...tournament.tournamentResults].sort((a, b) => a.position - b.position));
    } else {
      // Inicializar con un resultado vacío
      setResults([createEmptyResult(1)]);
    }

    setShowResultsEditor(true);
  };

  // Crear resultado vacío
  const createEmptyResult = (position: number): TournamentResultData => ({
    position,
    pointsWon: 0,
    prizeWon: 0,
    playerId: 0,
    player: {
      id: 0,
      nickname: '',
      fullname: '',
      playerNumber: 0
    }
  });

  // Agregar nuevo resultado
  const addResult = () => {
    const newPosition = results.length + 1;
    setResults([...results, createEmptyResult(newPosition)]);
  };

  // Eliminar resultado (solo para resultados nuevos sin ID)
  const removeResult = (index: number) => {
    const result = results[index];
    // Solo permitir eliminar resultados que no tienen ID (no están guardados)
    if (result.id) {
      return; // No permitir eliminar resultados ya guardados
    }

    const newResults = results.filter((_, i) => i !== index);
    // Reordenar posiciones solo para los nuevos
    const reorderedResults = newResults.map((result, i) => ({
      ...result,
      position: i + 1
    }));
    setResults(reorderedResults);
  };

  // Actualizar resultado (solo para resultados nuevos sin ID)
  const updateResult = (index: number, field: keyof TournamentResultData, value: any) => {
    const result = results[index];
    // Solo permitir editar resultados que no tienen ID (no están guardados)
    if (result.id) {
      return; // No permitir editar resultados ya guardados
    }

    const newResults = [...results];
    if (field === 'player') {
      // value es Player | null del autocomplete
      const selectedPlayer = value as Player | null;
      if (selectedPlayer) {
        newResults[index] = {
          ...newResults[index],
          playerId: selectedPlayer.id,
          player: {
            id: selectedPlayer.id,
            nickname: selectedPlayer.nickname,
            fullname: selectedPlayer.fullname,
            playerNumber: selectedPlayer.playerNumber
          }
        };
      } else {
        // Limpiar selección
        newResults[index] = {
          ...newResults[index],
          playerId: 0,
          player: {
            id: 0,
            nickname: '',
            fullname: '',
            playerNumber: 0
          }
        };
      }
    } else {
      newResults[index] = {
        ...newResults[index],
        [field]: field === 'pointsWon' || field === 'prizeWon' ? parseFloat(value) || 0 : value
      };
    }
    setResults(newResults);
  };

  // Manejar guardado de resultados
  const handleSaveResults = async () => {
    if (!editingTournament) return;

    // Validar resultados
    const errors = validateResults();
    if (errors.length > 0) {
      handleError(new Error(`${t('abm.tournamentResults.errors.validationErrors')}\n${errors.join('\n')}`), t('abm.tournamentResults.errors.saveTournamentResults'));
      return;
    }

    try {
      const response = await fetch(`/api/abm/tournament-results/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tournamentId: editingTournament.id,
          results
        })
      });

      if (response.ok) {
        const result = await response.json();
        const message = result.data?.seasonPointsLoaded
          ? t('abm.tournamentResults.success.resultsAndPointsLoaded')
          : t('abm.tournamentResults.success.resultsSaved');
        handleSuccess(message, 'Guardado exitoso');
        setShowResultsEditor(false);
        setEditingTournament(null);
        setResults([]);
        await loadTournaments(); // Recargar datos
      } else {
        const error = await response.json();
        throw new Error(error.error || t('abm.tournamentResults.errors.saveTournamentResults'));
      }
    } catch (error) {
      handleError(error, t('abm.tournamentResults.errors.saveTournamentResults'));
    }
  };

  // Validar resultados
  const validateResults = (): string[] => {
    const errors: string[] = [];
    const usedPlayerIds = new Set<number>();
    const positions = new Set<number>();

    results.forEach((result, index) => {
      if (!result.playerId || result.playerId === 0) {
        errors.push(`${t('abm.tournamentResults.position')} ${index + 1}: ${t('abm.tournamentResults.validation.playerRequired')}`);
      } else if (usedPlayerIds.has(result.playerId)) {
        errors.push(`${t('abm.tournamentResults.position')} ${index + 1}: ${t('abm.tournamentResults.validation.duplicatePlayer')}`);
      } else {
        usedPlayerIds.add(result.playerId);
      }

      if (positions.has(result.position)) {
        errors.push(`${t('abm.tournamentResults.position')} ${result.position}: ${t('abm.tournamentResults.validation.duplicatePosition')}`);
      } else {
        positions.add(result.position);
      }

      if (result.pointsWon < 0) {
        errors.push(`${t('abm.tournamentResults.position')} ${index + 1}: ${t('abm.tournamentResults.validation.invalidPoints')}`);
      }
    });

    return errors;
  };

  // Nota: La finalización de torneos ahora es automática al guardar resultados

  // Configuración de acciones del grid
  const actions = [
    {
      key: 'edit-results',
      label: t('abm.tournamentResults.editResults'),
      icon: Edit,
      variant: 'outline' as const,
      onClick: (row: Tournament) => handleEditResults(row),
      show: () => true
    }
    // Nota: "Finalizar Torneo" se hace automáticamente al guardar resultados
  ];

  return (
    <>
      <UnifiedABMLayout<Tournament>
        title={t('abm.tournamentResults.title')}
        description={t('abm.tournamentResults.description')}

        // Estado del formulario - ahora usado para editor de resultados
        showForm={showResultsEditor}
        editingItem={editingTournament}
        formTitle={editingTournament ? `${t('abm.tournamentResults.editResults')} ${editingTournament.name}` : ""}

        // Configuración del grid
        data={tournaments}
        columns={columns}
        actions={actions}
        loading={loading}
        includeAddButton={false}
        includeEditButton={false}
        includeDeleteButton={false}
        includeRestoreButton={false}

        // Configuración del formulario (no usado - usamos contenido personalizado)
        formFields={[]}
        formErrors={{}}
        formSuccess={false}
        successMessage=""

        // Configuración de búsqueda y filtros
        searchPlaceholder={t('abm.tournamentResults.searchPlaceholder')}
        showDeleted={false}
        onToggleShowDeleted={undefined}

        // Callbacks
        onAdd={() => { }} // No agregamos torneos desde aquí
        onRefresh={loadTournaments}
        onFormSubmit={async () => await handleSaveResults()}
        onFormCancel={() => {
          setShowResultsEditor(false);
          setEditingTournament(null);
          setResults([]);
        }}

        // Mensajes personalizados
        emptyMessage={t('abm.tournamentResults.emptyMessage')}

        // Contenido adicional personalizado para el editor de resultados
        additionalFormContent={showResultsEditor && editingTournament && (
          <div className="space-y-6">
            {/* Información del torneo */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-start gap-2">
                <Trophy className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    {t('abm.tournamentResults.tournamentInfo')}
                  </h4>
                  <div className="text-sm text-blue-700 dark:text-blue-200 mt-1 space-y-1">
                    <p><strong>{t('abm.tournamentResults.type')}</strong> {editingTournament.type}</p>
                    <p><strong>{t('abm.tournamentResults.date')}</strong> {new Date(editingTournament.startDate).toLocaleDateString()}</p>
                    <p><strong>{t('abm.tournamentResults.status')}</strong> {editingTournament.isCompleted ? t('abm.tournamentResults.completed') : t('abm.tournamentResults.inProgress')}</p>
                    <p><strong>{t('abm.tournamentResults.participants')}</strong> {results.length}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Botón para agregar resultado */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t('abm.tournamentResults.tournamentResults')}</h3>
              <Button onClick={addResult} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('abm.tournamentResults.addPlayer')}
              </Button>
            </div>

            {/* Lista de resultados con scroll */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {results.map((result, index) => {
                // Obtener IDs de jugadores ya seleccionados (excluyendo el actual)
                const excludePlayerIds = results
                  .map((r, i) => i !== index ? r.playerId : null)
                  .filter((id): id is number => id !== null && id !== 0);

                // Convertir el jugador actual al formato esperado por el autocomplete
                const selectedPlayer = result.playerId && result.playerId !== 0 ? {
                  id: result.playerId,
                  nickname: result.player.nickname,
                  playerNumber: result.player.playerNumber || 0,
                  fullname: result.player.fullname
                } as Player : null;

                const isExistingResult = !!result.id; // Resultado ya guardado
                const isEditable = !isExistingResult; // Solo editable si no está guardado

                return (
                  <Card key={index} className={`p-4 ${isExistingResult ? 'bg-gray-50 dark:bg-gray-900/50' : ''}`}>
                    <div className="grid grid-cols-1 md:grid-cols-[80px_1fr_120px_120px_60px] gap-4 items-end">
                      {/* Posición */}
                      <div>
                        <Label htmlFor={`position-${index}`}>{t('abm.tournamentResults.position')}</Label>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {result.position}
                          </div>
                          <span className="text-sm text-gray-600">
                            {result.position === 1 ? '🥇' : result.position === 2 ? '🥈' : result.position === 3 ? '🥉' : '🏅'}
                          </span>
                        </div>
                      </div>

                      {/* Jugador con autocomplete */}
                      <div>
                        <Label htmlFor={`player-${index}`}>{t('abm.tournamentResults.player')}</Label>
                        {isEditable ? (
                          <PlayerSingleAutocomplete
                            selected={selectedPlayer}
                            onChange={(player) => updateResult(index, 'player', player)}
                            excludePlayerIds={excludePlayerIds}
                            placeholder={t('abm.tournamentResults.searchPlayer')}
                          />
                        ) : (
                          <div className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {result.player.nickname} (L{result.player.playerNumber || 'N/A'})
                          </div>
                        )}
                      </div>

                      {/* Puntos */}
                      <div>
                        <Label htmlFor={`points-${index}`}>{t('abm.tournamentResults.points')}</Label>
                        <Input
                          id={`points-${index}`}
                          type="number"
                          step="0.1"
                          value={result.pointsWon}
                          onChange={(e) => updateResult(index, 'pointsWon', e.target.value)}
                          placeholder="0.0"
                          disabled={!isEditable}
                          className={!isEditable ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : ''}
                        />
                      </div>

                      {/* Premio (opcional) */}
                      <div>
                        <Label htmlFor={`prize-${index}`}>{t('abm.tournamentResults.prize')}</Label>
                        <Input
                          id={`prize-${index}`}
                          type="number"
                          step="0.01"
                          value={result.prizeWon || ''}
                          onChange={(e) => updateResult(index, 'prizeWon', e.target.value)}
                          placeholder="0.00"
                          disabled={!isEditable}
                          className={!isEditable ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : ''}
                        />
                      </div>

                      {/* Acciones */}
                      <div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeResult(index)}
                          disabled={!isEditable || results.length <= 1}
                          title={!isEditable ? t('abm.tournamentResults.cannotRemove') : ''}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

          </div>
        )}
      />
    </>
  );
}