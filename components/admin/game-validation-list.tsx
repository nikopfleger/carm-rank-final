"use client";

import { useGameService } from "@/components/providers/services-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { useErrorHandler } from "@/hooks/use-error-handler";
import {
  Calculator,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  Users,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

// ✅ Planilla/cálculos reutilizados
import GameResultsSheet from "@/components/admin/games/game-results-sheet";

// ──────────────────────────────────────────────────────────────────────────────
// Tipos (compatibles con tu /api/games/pending actual, con fallbacks)
// ──────────────────────────────────────────────────────────────────────────────
interface PendingGameData {
  id: number;
  gameDate: string;
  nroJuegoDia?: number | null;
  venue?: string | null;
  duration: "HANCHAN" | "TONPUUSEN";
  sanma: boolean;
  seasonId?: number | null;
  seasonName?: string | null;
  imageUrl?: string | null;
  status: "PENDING" | "VALIDATED" | "REJECTED";
  createdAt: string;
  ruleset: {
    id: number;
    name: string;
    inPoints: number;
    outPoints: number;
    oka: number;
    chonbo: number; // 👈 ya en romaji
    uma: {
      firstPlace: number;
      secondPlace: number;
      thirdPlace: number;
      fourthPlace?: number | null;
    };
  };
  players: Array<{
    id: number;
    nickname: string;
    fullname?: string | null;
    wind?: string | null;
    oorasuScore?: number | null;
    gameScore: number;
    chonbo?: number | null;  // nuevo nombre
    chonbos?: number | null; // fallback nombre viejo
    finalScore?: number | null;
    finalPosition?: number | null;
  }>;
}

// ──────────────────────────────────────────────────────────────────────────────

export function GameValidationList() {
  const { handleError, handleSuccess } = useErrorHandler();
  const gameService = useGameService();
  const [games, setGames] = useState<PendingGameData[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectReasonById, setRejectReasonById] = useState<Record<number, string>>({});
  // Nuevo estado para rastrear qué juegos han sido vistos
  const [viewedGames, setViewedGames] = useState<Set<number>>(new Set());
  // Estado para los contadores
  const [stats, setStats] = useState({ PENDING: 0, VALIDATED: 0, REJECTED: 0 });

  // Cargar pendientes y estadísticas
  const loadPendingGames = useCallback(async () => {
    try {
      setLoading(true);

      // Cargar juegos pendientes y estadísticas en paralelo
      const [gamesData, statsData] = await Promise.all([
        gameService.getPendingGames() as any,
        gameService.getValidationStats() as any
      ]);

      if (gamesData.success) {
        setGames(gamesData.games);
      } else {
        setError(gamesData.message || "Error al cargar juegos pendientes");
        handleError(gamesData, 'Cargar juegos pendientes');
      }

      if (statsData.success) {
        setStats(statsData.stats);
      } else {
        console.error('Error al cargar estadísticas:', statsData.message);
      }
    } catch (error) {
      setError("Error de conexión al cargar juegos");
      handleError(error, 'Cargar juegos pendientes');
    } finally {
      setLoading(false);
    }
  }, [gameService, handleError]);

  useEffect(() => {
    void loadPendingGames();
  }, [loadPendingGames]);

  // Orden: fecha, nroJuegoDia (null al final), id
  const sortedPending = useMemo(() => {
    return games
      .slice()
      .sort((a, b) => {
        const ta = new Date(a.gameDate).getTime();
        const tb = new Date(b.gameDate).getTime();
        if (ta !== tb) return ta - tb;
        const na = a.nroJuegoDia ?? Number.POSITIVE_INFINITY;
        const nb = b.nroJuegoDia ?? Number.POSITIVE_INFINITY;
        if (na !== nb) return na - nb;
        return a.id - b.id;
      });
  }, [games]);

  const firstPendingId = sortedPending[0]?.id ?? null;
  const isFirstPending = (id: number) => firstPendingId != null && id === firstPendingId;

  // Función para marcar un juego como visto
  const markGameAsViewed = (gameId: number) => {
    setViewedGames(prev => new Set([...prev, gameId]));
  };

  // Función para verificar si un juego puede ser procesado
  const canProcessGame = (gameId: number) => {
    return isFirstPending(gameId) && viewedGames.has(gameId);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Acciones aprobar / rechazar (con defensa de orden)
  // ────────────────────────────────────────────────────────────────────────────
  const handleApprove = async (gameId: number) => {
    if (!isFirstPending(gameId)) {
      setError("Debes validar en orden. Procesa primero el juego superior.");
      return;
    }
    setIsProcessing(true);
    try {
      await gameService.approveGame(gameId);
      await loadPendingGames();
      setSelectedGameId(null);
      handleSuccess('Juego aprobado exitosamente', 'Aprobación exitosa');
    } catch (error) {
      setError("Error de conexión al aprobar juego");
      handleError(error, 'Aprobar juego');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (gameId: number) => {
    if (!isFirstPending(gameId)) {
      setError("Debes validar en orden. Procesa primero el juego superior.");
      return;
    }
    const reason = (rejectReasonById[gameId] || "").trim();
    if (!reason) {
      setError("Por favor indica un motivo de rechazo.");
      return;
    }
    setIsProcessing(true);
    try {
      await gameService.rejectGame(gameId, reason);
      await loadPendingGames();
      setSelectedGameId(null);
      handleSuccess('Juego rechazado exitosamente', 'Rechazo exitoso');
    } catch (error) {
      setError("Error de conexión al rechazar juego");
      handleError(error, 'Rechazar juego');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: PendingGameData["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case "VALIDATED":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Validado
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazado
          </Badge>
        );
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Resumen arriba */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.PENDING}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Validados</p>
                <p className="text-2xl font-bold text-green-600">{stats.VALIDATED}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rechazados</p>
                <p className="text-2xl font-bold text-red-600">{stats.REJECTED}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pendientes (resumen + expandible) */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Juegos Pendientes de Validación
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Se procesan en orden: primero por fecha y luego por número de juego del día.
          </p>
        </div>

        {stats.PENDING === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>No hay juegos pendientes de validación.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {sortedPending.map((game, idx) => {
              const isOpen = selectedGameId === game.id;
              const canAct = isFirstPending(game.id);
              const normalizedPlayers = game.players.map((p) => ({
                ...p,
                chonbo: typeof p.chonbo === "number" ? p.chonbo : p.chonbos ?? 0,
              }));

              return (
                <Card key={game.id} className="hover:shadow-md transition-shadow overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-lg">
                        Juego #{game.id} — {game.duration} {game.sanma ? "(Sanma)" : ""}
                        {typeof game.nroJuegoDia === "number" && (
                          <span className="text-sm font-normal text-gray-500 ml-2">
                            (#{game.nroJuegoDia} del día)
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[11px] font-mono">#{idx + 1}</Badge>
                        {idx === 0 && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[11px]">
                            ⏳ Siguiente en procesar
                          </Badge>
                        )}
                        {getStatusBadge(game.status)}
                      </div>
                    </div>

                    {/* Meta compacta como antes */}
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(game.gameDate).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{game.players.length} jugadores</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{game.venue || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        <span>{game.imageUrl ? "Con imagen" : "Sin imagen"}</span>
                      </div>
                    </div>

                    {/* Chips de reglas (IN/OUT/UMA/OKA/chonbo) */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="outline">{game.ruleset.name}</Badge>
                      <Badge variant="outline">IN {game.ruleset.inPoints}</Badge>
                      <Badge variant="outline">OUT {game.ruleset.outPoints}</Badge>
                      <Badge variant="outline">
                        UMA {game.ruleset.uma.firstPlace}/{game.ruleset.uma.secondPlace}/
                        {game.ruleset.uma.thirdPlace}
                        {typeof game.ruleset.uma.fourthPlace === "number" ? `/${game.ruleset.uma.fourthPlace}` : ""}
                      </Badge>
                      <Badge variant="outline">OKA {game.ruleset.oka}</Badge>
                      <Badge variant="outline">Chonbo {game.ruleset.chonbo}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Barra acciones */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {game.seasonName ? (
                          <>Temporada: <b>{game.seasonName}</b></>
                        ) : (
                          <>Casual (no actualiza rate/dan)</>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={isOpen ? "secondary" : "outline"}
                          onClick={() => {
                            if (!isOpen) {
                              // Al abrir el detalle, marcar como visto
                              markGameAsViewed(game.id);
                            }
                            setSelectedGameId(isOpen ? null : game.id);
                          }}
                        >
                          <Calculator className="w-4 h-4 mr-2" />
                          {isOpen ? "Ocultar detalle" : "Ver detalle"}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleApprove(game.id)}
                          disabled={!canProcessGame(game.id) || isProcessing}
                          title={!canProcessGame(game.id) ?
                            (!viewedGames.has(game.id) ? "Primero debes ver el detalle del juego" : "Procesa primero el juego superior")
                            : undefined}
                        >
                          Aprobar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => handleReject(game.id)}
                          disabled={!canProcessGame(game.id) || isProcessing}
                          title={!canProcessGame(game.id) ?
                            (!viewedGames.has(game.id) ? "Primero debes ver el detalle del juego" : "Procesa primero el juego superior")
                            : undefined}
                        >
                          Rechazar
                        </Button>
                      </div>
                    </div>

                    {/* Motivo de rechazo */}
                    <div className="mb-3">
                      <textarea
                        className={`w-full text-sm rounded-md border p-2 ${error && error.includes("motivo de rechazo")
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-400"
                          : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                          }`}
                        rows={2}
                        placeholder="Motivo de rechazo (requerido para rechazar)"
                        value={rejectReasonById[game.id] ?? ""}
                        onChange={(e) => {
                          setRejectReasonById((prev) => ({ ...prev, [game.id]: e.target.value }));
                          // Limpiar error cuando el usuario empiece a escribir
                          if (error && error.includes("motivo de rechazo")) {
                            setError(null);
                          }
                        }}
                      />
                      {/* Error específico del motivo de rechazo */}
                      {error && error.includes("motivo de rechazo") && (
                        <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          {error}
                        </div>
                      )}
                    </div>

                    {/* EXPANDIDO: planilla + imagen DEBAJO, como antes */}
                    {isOpen && (
                      <div className="space-y-4">
                        {/* Planilla readonly (mismo componente) */}
                        <GameResultsSheet
                          ruleset={{
                            id: game.ruleset.id,
                            name: game.ruleset.name,
                            inPoints: game.ruleset.inPoints,
                            outPoints: game.ruleset.outPoints,
                            uma: {
                              firstPlace: game.ruleset.uma.firstPlace,
                              secondPlace: game.ruleset.uma.secondPlace,
                              thirdPlace: game.ruleset.uma.thirdPlace,
                              fourthPlace:
                                typeof game.ruleset.uma.fourthPlace === "number"
                                  ? game.ruleset.uma.fourthPlace
                                  : null,
                            },
                            oka: game.ruleset.oka,
                            chonbo: game.ruleset.chonbo,
                            sanma: game.sanma,
                          }}
                          rows={normalizedPlayers.map((p) => ({
                            id: p.id,
                            displayName: p.fullname || p.nickname,
                            wind: p.wind || "",
                            gameScore: p.gameScore,
                            chonbo: p.chonbo ?? 0,
                            oorasuScore: p.oorasuScore ?? 0,
                          }))}
                          editable={false}
                          showWind={true}
                          showOorasu={true}
                        />

                        {/* Imagen adjunta (si existe) debajo de la planilla */}
                        {game.imageUrl && (
                          <div className="border rounded-md bg-background p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-sm">
                                <ImageIcon className="w-4 h-4" />
                                <span>Imagen adjunta</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={game.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Abrir
                                </a>
                                <a
                                  href={game.imageUrl}
                                  download
                                  className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                                >
                                  <Download className="w-4 h-4" />
                                  Descargar
                                </a>
                              </div>
                            </div>
                            <div className="max-h-[75vh] overflow-auto">
                              <Image
                                src={game.imageUrl}
                                alt="Resultado del juego"
                                width={800}
                                height={600}
                                className="w-full h-auto rounded"
                                unoptimized
                                onError={(e) => {
                                  const img = e.currentTarget as HTMLImageElement;
                                  img.src = '/images/image-not-available.svg';
                                }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              Sugerencia: usá Ctrl/Cmd + rueda del mouse para hacer zoom en el visor.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {!canProcessGame(game.id) && (
                      <div className="mt-2 text-xs text-amber-500">
                        {!viewedGames.has(game.id)
                          ? "👁️ Primero debes ver el detalle del juego para poder procesarlo"
                          : "⏳ Procesa primero el juego superior en la lista"
                        }
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
