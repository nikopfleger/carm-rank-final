"use client";

import { SeasonCloseModal } from "@/components/admin/season-close-modal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Archive,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Plus,
  Trophy,
  Users
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  gamesCount: number;
  playersCount: number;
  rulesets: {
    id: string;
    name: string;
    sanma: boolean;
  }[];
  createdAt: Date;
}

interface SeasonForm {
  name: string;
  startDate: string;
  endDate: string;
  rulesetIds: string[];
}

// Mock data for demonstration
const mockSeasons: Season[] = [
  {
    id: "1",
    name: "Temporada 2024/25",
    startDate: new Date("2024-03-01"),
    endDate: new Date("2025-02-28"),
    isActive: true,
    gamesCount: 245,
    playersCount: 34,
    rulesets: [
      { id: "1", name: "EMA Riichi", sanma: false },
      { id: "2", name: "EMA Sanma", sanma: true }
    ],
    createdAt: new Date("2024-02-15"),
  },
  {
    id: "2",
    name: "Temporada 2023/24",
    startDate: new Date("2023-03-01"),
    endDate: new Date("2024-02-29"),
    isActive: false,
    gamesCount: 189,
    playersCount: 28,
    rulesets: [
      { id: "1", name: "EMA Riichi", sanma: false }
    ],
    createdAt: new Date("2023-02-15"),
  },
];

// Mock rulesets available
const mockRulesets = [
  { id: "1", name: "EMA Riichi", sanma: false },
  { id: "2", name: "EMA Sanma", sanma: true },
  { id: "3", name: "Torneo Especial", sanma: false },
];

export function SeasonManagement() {
  const [seasons, setSeasons] = useState<Season[]>(mockSeasons);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SeasonForm>({
    name: "",
    startDate: "",
    endDate: "",
    rulesetIds: [],
  });

  // Estados para el modal de cierre de temporada
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [seasonToActivate, setSeasonToActivate] = useState<Season | null>(null);
  const [seasonStats, setSeasonStats] = useState<any>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Try to load seasons from API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/seasons', { cache: 'no-store' });
        const json = await res.json();
        if (res.ok && Array.isArray(json.data)) {
          const mapped: Season[] = json.data.map((s: any) => ({
            id: String(s.id),
            name: s.name,
            startDate: new Date(s.startDate ?? s.start_date),
            endDate: s.endDate ? new Date(s.endDate) : undefined,
            isActive: !!s.isActive,
            gamesCount: s.gamesCount ?? 0,
            playersCount: s.playersCount ?? 0,
            rulesets: [],
            createdAt: new Date(s.createdAt ?? Date.now())
          }));
          setSeasons(mapped);
        }
      } catch {
        // keep mock fallback silently
      }
    };
    load();
  }, []);

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        start_date: formData.startDate,
        end_date: formData.endDate || undefined,
      };
      const res = await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create season');
      const reload = await fetch('/api/seasons', { cache: 'no-store' });
      const json = await reload.json();
      if (reload.ok && Array.isArray(json.data)) {
        const mapped: Season[] = json.data.map((s: any) => ({
          id: String(s.id),
          name: s.name,
          startDate: new Date(s.startDate ?? s.start_date),
          endDate: s.endDate ? new Date(s.endDate) : undefined,
          isActive: !!s.isActive,
          gamesCount: s.gamesCount ?? 0,
          playersCount: s.playersCount ?? 0,
          rulesets: [],
          createdAt: new Date(s.createdAt ?? Date.now())
        }));
        setSeasons(mapped);
      }
      setFormData({ name: "", startDate: "", endDate: "", rulesetIds: [] });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating season:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveSeason = async (seasonId: string) => {
    try {
      const res = await fetch(`/api/seasons/${seasonId}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to archive season');
      const reload = await fetch('/api/seasons', { cache: 'no-store' });
      const json = await reload.json();
      if (reload.ok && Array.isArray(json.data)) {
        const mapped: Season[] = json.data.map((s: any) => ({
          id: String(s.id), name: s.name,
          startDate: new Date(s.startDate ?? s.start_date),
          endDate: s.endDate ? new Date(s.endDate) : undefined,
          isActive: !!s.isActive,
          gamesCount: s.gamesCount ?? 0, playersCount: s.playersCount ?? 0,
          rulesets: [], createdAt: new Date(s.createdAt ?? Date.now())
        }));
        setSeasons(mapped);
      }
    } catch (error) {
      console.error("Error archiving season:", error);
    }
  };

  const handleActivateSeason = async (seasonId: string) => {
    const seasonToActivate = seasons.find(s => s.id === seasonId);
    const currentActiveSeason = seasons.find(s => s.isActive);

    if (!seasonToActivate) return;

    // Si no hay temporada activa, activar directamente
    if (!currentActiveSeason) {
      try {
        const res = await fetch(`/api/seasons/${seasonId}?action=activate`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to activate season');
        await reloadSeasons();
      } catch (e) {
        console.error('Error activating season', e);
      }
      return;
    }

    // Si hay temporada activa, mostrar modal de confirmación
    setSeasonToActivate(seasonToActivate);

    // Cargar estadísticas de la temporada actual
    try {
      const statsRes = await fetch(`/api/seasons/${currentActiveSeason.id}/close`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setSeasonStats(statsData.data);
      }
    } catch (e) {
      console.error('Error loading season stats', e);
    }

    setShowCloseModal(true);
  };

  const handleConfirmSeasonClose = async () => {
    if (!seasonToActivate) return;

    const currentActiveSeason = seasons.find(s => s.isActive);
    if (!currentActiveSeason) return;

    setIsClosing(true);

    try {
      const res = await fetch(`/api/seasons/${currentActiveSeason.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newSeasonId: parseInt(seasonToActivate.id),
          confirmationText: 'CONFIRMAR'
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to close season');
      }

      // Recargar temporadas
      await reloadSeasons();

      // Cerrar modal
      setShowCloseModal(false);
      setSeasonToActivate(null);
      setSeasonStats(null);

    } catch (e) {
      console.error('Error closing season', e);
      // TODO: Mostrar error al usuario
    } finally {
      setIsClosing(false);
    }
  };

  const handleCancelSeasonClose = () => {
    setShowCloseModal(false);
    setSeasonToActivate(null);
    setSeasonStats(null);
  };

  const reloadSeasons = async () => {
    try {
      const reload = await fetch('/api/seasons', { cache: 'no-store' });
      const json = await reload.json();
      if (reload.ok && Array.isArray(json.data)) {
        const mapped: Season[] = json.data.map((s: any) => ({
          id: String(s.id), name: s.name,
          startDate: new Date(s.startDate ?? s.start_date),
          endDate: s.endDate ? new Date(s.endDate) : undefined,
          isActive: !!s.isActive,
          gamesCount: s.gamesCount ?? 0, playersCount: s.playersCount ?? 0,
          rulesets: [], createdAt: new Date(s.createdAt ?? Date.now())
        }));
        setSeasons(mapped);
      }
    } catch (e) {
      console.error('Error reloading seasons', e);
    }
  };

  const handleRulesetChange = (rulesetId: string, isSelected: boolean) => {
    if (isSelected) {
      setFormData({
        ...formData,
        rulesetIds: [...formData.rulesetIds, rulesetId]
      });
    } else {
      setFormData({
        ...formData,
        rulesetIds: formData.rulesetIds.filter(id => id !== rulesetId)
      });
    }
  };

  const activeSeason = seasons.find(s => s.isActive);
  const inactiveSeasons = seasons.filter(s => !s.isActive);

  return (
    <div className="space-y-6">
      {/* Active Season Section */}
      {activeSeason && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Temporada Activa
          </h2>
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-green-800 dark:text-green-400">
                  {activeSeason.name}
                </CardTitle>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Activa
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Inicio</div>
                    <div className="font-medium">{activeSeason.startDate.toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Fin</div>
                    <div className="font-medium">
                      {activeSeason.endDate?.toLocaleDateString() || "Sin definir"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Juegos</div>
                    <div className="font-medium">{activeSeason.gamesCount}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Jugadores</div>
                    <div className="font-medium">{activeSeason.playersCount}</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reglas de Juego:
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeSeason.rulesets.map((ruleset) => (
                    <Badge key={ruleset.id} variant="outline">
                      {ruleset.name} {ruleset.sanma && "(Sanma)"}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleArchiveSeason(activeSeason.id)}
                >
                  <Archive className="w-4 h-4 mr-1" />
                  Archivar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create New Season */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {activeSeason ? "Crear Nueva Temporada" : "Crear Temporada"}
          </h2>
          {!showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Nueva Temporada
            </Button>
          )}
        </div>

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Crear Nueva Temporada</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSeason} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seasonName">Nombre de la Temporada</Label>
                    <Input
                      id="seasonName"
                      placeholder="ej: Temporada 2025/26"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="startDate">Fecha de Inicio</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">Fecha de Fin (Opcional)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Reglas de Juego</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {mockRulesets.map((ruleset) => (
                      <label key={ruleset.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.rulesetIds.includes(ruleset.id)}
                          onChange={(e) => handleRulesetChange(ruleset.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">
                          {ruleset.name} {ruleset.sanma && "(Sanma)"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {activeSeason && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Al crear una nueva temporada, la temporada actual &quot;{activeSeason.name}&quot; se archivará automáticamente.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creando..." : "Crear Temporada"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Historical Seasons */}
      {inactiveSeasons.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Temporadas Anteriores
          </h2>
          <div className="space-y-4">
            {inactiveSeasons.map((season) => (
              <Card key={season.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{season.name}</CardTitle>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      <Archive className="w-3 h-3 mr-1" />
                      Archivada
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Período</div>
                        <div className="font-medium text-sm">
                          {season.startDate.toLocaleDateString()} - {season.endDate?.toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Juegos</div>
                        <div className="font-medium">{season.gamesCount}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Jugadores</div>
                        <div className="font-medium">{season.playersCount}</div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="default" size="sm" onClick={() => handleActivateSeason(season.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Activar
                      </Button>
                      <Button variant="outline" size="sm">
                        Ver Rankings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      {/* Modal de cierre de temporada */}
      <SeasonCloseModal
        isOpen={showCloseModal}
        currentSeason={seasons.find(s => s.isActive) ? {
          id: parseInt(seasons.find(s => s.isActive)!.id),
          name: seasons.find(s => s.isActive)!.name,
          startDate: seasons.find(s => s.isActive)!.startDate,
          endDate: seasons.find(s => s.isActive)!.endDate,
          isActive: true,
          gamesCount: seasons.find(s => s.isActive)!.gamesCount,
          playersCount: seasons.find(s => s.isActive)!.playersCount
        } : null}
        newSeason={seasonToActivate ? {
          id: parseInt(seasonToActivate.id),
          name: seasonToActivate.name,
          startDate: seasonToActivate.startDate,
          endDate: seasonToActivate.endDate,
          isActive: false,
          gamesCount: seasonToActivate.gamesCount,
          playersCount: seasonToActivate.playersCount
        } : {} as any}
        seasonStats={seasonStats}
        onConfirm={handleConfirmSeasonClose}
        onCancel={handleCancelSeasonClose}
        loading={isClosing}
      />
    </div>
  );
}
