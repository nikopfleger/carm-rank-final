"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import { usePublicService } from "@/components/providers/services-provider";
import { PageHeader } from "@/components/shared/page-header";
import { TournamentStatusBadge } from "@/components/tournaments/tournament-status-badge";
import { Button } from "@/components/ui/button";
import { Award, Calendar, Clock, Trophy, Users } from "@/components/ui/icons";
import { TournamentsPageSkeleton } from "@/components/ui/loading-skeleton";
import { SectionTitle } from "@/components/ui/section-title";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { unifiedStyles } from "@/components/ui/unified-styles";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

interface Tournament {
  id: number;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  participants?: number;
  maxParticipants?: number;
  prize?: string;
  location?: string;
  seasonId?: number; // Fallback
  season?: {
    id: number;
    name: string;
  };
  tournamentResults?: any[];
}

interface Season {
  id: number;
  name: string;
  isActive: boolean;
}

export default function TournamentsPage() {
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const { t } = useI18nContext();
  const publicService = usePublicService();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedSeasonName, setSelectedSeasonName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [tournamentsResponse, seasonsResponse] = await Promise.all([
          publicService.getTournaments(),
          publicService.getSeasons(),
        ]);

        const tournamentsData = (tournamentsResponse as any)?.data || tournamentsResponse;
        const seasonsData = (seasonsResponse as any)?.data || seasonsResponse;

        setTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
        setSeasons(Array.isArray(seasonsData) ? seasonsData : []);
        setSelectedSeasonName(t('ui.allSeasons', 'Todas las temporadas'));
      } catch (error) {
        handleError(error, "Cargar datos");
        setTournaments([]);
        setSeasons([]);
        setSelectedSeasonName(t('ui.allSeasons', 'Todas las temporadas'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [publicService, t, handleError]);

  // Filtrar torneos por temporada
  const filteredTournaments = tournaments.filter((t) => {
    if (!selectedSeason) return true;
    const seasonId = t.season?.id || (t as any).seasonId;
    return seasonId && seasonId.toString() === selectedSeason;
  });

  const upcomingTournaments = filteredTournaments.filter((t) => !t.isCompleted);
  const completedTournaments = filteredTournaments.filter((t) => t.isCompleted);

  const handleSeasonChange = (seasonId: string) => {
    setSelectedSeason(seasonId);
    if (seasonId === "") {
      setSelectedSeasonName("Todas las temporadas");
    } else {
      const season = seasons.find((s) => s.id.toString() === seasonId);
      setSelectedSeasonName(season ? `${season.name} ${season.isActive ? "(Activa)" : ""}` : "Todas las temporadas");
    }
  };

  // Colores por temporada
  const getSeasonColor = (seasonId: number | null | undefined) => {
    const colorMap = {
      1: {
        bg: "bg-blue-500",
        icon: "from-blue-400 via-blue-500 to-blue-600",
        border: "hover:border-blue-300 dark:hover:border-blue-600",
        accent: "text-blue-500",
        completed: {
          icon: "from-blue-300 via-blue-400 to-blue-500",
          border: "hover:border-blue-200 dark:hover:border-blue-700",
          accent: "text-blue-400",
        },
      },
      2: {
        bg: "bg-green-500",
        icon: "from-green-400 via-green-500 to-green-600",
        border: "hover:border-green-300 dark:hover:border-green-600",
        accent: "text-green-500",
        completed: {
          icon: "from-green-300 via-green-400 to-green-500",
          border: "hover:border-green-200 dark:hover:border-green-700",
          accent: "text-green-400",
        },
      },
      3: {
        bg: "bg-purple-500",
        icon: "from-purple-400 via-purple-500 to-purple-600",
        border: "hover:border-purple-300 dark:hover:border-purple-600",
        accent: "text-purple-500",
        completed: {
          icon: "from-purple-300 via-purple-400 to-purple-500",
          border: "hover:border-purple-200 dark:hover:border-purple-700",
          accent: "text-purple-400",
        },
      },
      4: {
        bg: "bg-orange-500",
        icon: "from-orange-400 via-orange-500 to-orange-600",
        border: "hover:border-orange-300 dark:hover:border-orange-600",
        accent: "text-orange-500",
        completed: {
          icon: "from-orange-300 via-orange-400 to-orange-500",
          border: "hover:border-orange-200 dark:hover:border-orange-700",
          accent: "text-orange-400",
        },
      },
      5: {
        bg: "bg-pink-500",
        icon: "from-pink-400 via-pink-500 to-pink-600",
        border: "hover:border-pink-300 dark:hover:border-pink-600",
        accent: "text-pink-500",
        completed: {
          icon: "from-pink-300 via-pink-400 to-pink-500",
          border: "hover:border-pink-200 dark:hover:border-pink-700",
          accent: "text-pink-400",
        },
      },
    };

    if (!seasonId || seasonId <= 0 || isNaN(seasonId)) {
      return {
        bg: "bg-indigo-500",
        icon: "from-indigo-400 via-indigo-500 to-indigo-600",
        border: "hover:border-indigo-300 dark:hover:border-indigo-600",
        accent: "text-indigo-500",
        completed: {
          icon: "from-indigo-300 via-indigo-400 to-indigo-500",
          border: "hover:border-indigo-200 dark:hover:border-indigo-700",
          accent: "text-indigo-400",
        },
      };
    }

    const idx = ((seasonId - 1) % 5) + 1;
    return (colorMap as any)[idx] || (colorMap as any)[1];
  };

  const getBadgeColor = (t: Tournament) => {
    const seasonId = t.season?.id ?? t.seasonId ?? 0;
    return getSeasonColor(seasonId).bg;
  };

  const getBadgeTextColor = (bgColor: string) => {
    if (bgColor.includes("yellow") || bgColor.includes("orange") || bgColor.includes("lime") || bgColor.includes("amber")) {
      return "text-black";
    }
    return "text-white";
  };

  const getTournamentColors = (t: Tournament) => {
    const seasonId = t.season?.id ?? t.seasonId ?? 0;
    const colorData = getSeasonColor(seasonId);
    return { icon: colorData.icon, border: colorData.border, accent: colorData.accent };
  };

  if (loading) {
    return <TournamentsPageSkeleton />;
  }

  // ===== Header compacto que SIEMPRE envuelve (sin ellipsis) =====
  const CardHeader = (tournament: Tournament, colors: { icon: string; border: string; accent: string }) => {
    const bgColor = getBadgeColor(tournament);
    const textColor = getBadgeTextColor(bgColor);
    const seasonLabel = tournament.season?.name || (tournament.seasonId ? `Temporada ${tournament.seasonId}` : "");

    return (
      <div className="flex items-start gap-3 mb-4">
        {/* Icono */}
        <div
          className={`w-11 h-11 bg-gradient-to-br ${colors.icon} rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0`}
        >
          <Trophy className="w-5 h-5" />
        </div>

        {/* Título + meta */}
        <div className="flex-1">
          {/* Título: múltiples líneas, sin ellipsis */}
          <h3 className="text-[clamp(1rem,1.7vw,1.125rem)] sm:text-xl font-bold text-gray-900 dark:text-white leading-snug break-words whitespace-normal">
            {tournament.name}
          </h3>

          {/* Meta: tipo, temporada y estado. Permite wrap y que el badge baje de línea. */}
          <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <Award className={`w-4 h-4 ${colors.accent} flex-shrink-0`} />
              <span className="text-sm text-gray-600 dark:text-gray-400 break-words whitespace-normal">
                {tournament.type}
              </span>
            </div>

            <TournamentStatusBadge
              tournament={{
                id: tournament.id,
                name: tournament.name,
                startDate: new Date(tournament.startDate),
                endDate: tournament.endDate ? new Date(tournament.endDate) : undefined,
                isCompleted: tournament.isCompleted,
                tournamentResults: tournament.tournamentResults
              }}
              className="text-[12px] sm:text-xs"
            />

            {seasonLabel && (
              <span
                className={`${bgColor} ${textColor} text-[12px] sm:text-xs md:text-sm px-3 py-1 rounded-full font-medium
                            inline-block w-auto max-w-full break-words whitespace-normal leading-tight`}
              >
                {seasonLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.tournamentsPage}>
      {/* Hero Section */}
      <PageHeader icon={Trophy} title="Torneos" subtitle="Torneos oficiales de la comunidad CARM" variant="tournaments" />

      {/* Main Content */}
      <div className="py-8">
        {/* Filtro de Temporada */}
        <div className="mb-8">
          <div className="flex items-center gap-4 justify-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por temporada:</label>
            <Select value={selectedSeason} onValueChange={handleSeasonChange}>
              <SelectTrigger className={`${unifiedStyles.selectTrigger} w-[250px]`}>
                <span className="truncate">{selectedSeasonName}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las temporadas</SelectItem>
                {seasons.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name} {s.isActive && "(Activa)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Próximos torneos */}
        <div className={styles.section}>
          <SectionTitle title="Próximos Torneos" variant="tournaments" />
          {upcomingTournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No hay torneos próximos</h3>
              <p className="text-gray-500 dark:text-gray-500">
                {selectedSeason ? `No hay torneos próximos en la temporada seleccionada.` : "No hay torneos próximos programados en este momento."}
              </p>
            </div>
          ) : (
            <div className={styles.tournamentsGrid}>
              {upcomingTournaments.map((t) => {
                const colors = getTournamentColors(t);
                return (
                  <div key={t.id} className={`group relative ${unifiedStyles.card} ${colors.border} overflow-hidden`}>
                    <div className="relative p-4 sm:p-6">
                      {CardHeader(t, colors)}

                      {/* Info del torneo */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3">
                          <Calendar className={`w-4 h-4 mt-0.5 ${colors.accent}`} />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(t.startDate).toLocaleDateString("es-AR", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(t.startDate).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>

                        {t.participants !== undefined && t.maxParticipants !== undefined && (
                          <div className="flex items-start gap-3">
                            <Users className={`w-4 h-4 mt-0.5 ${colors.accent}`} />
                            <div className="w-full">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {t.participants}/{t.maxParticipants} participantes
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                                <div
                                  className={`bg-gradient-to-r ${colors.icon} h-2 rounded-full transition-all duration-300`}
                                  style={{ width: `${Math.min(100, (t.participants / Math.max(1, t.maxParticipants)) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {t.prize && (
                          <div className="flex items-start gap-3">
                            <Award className={`w-4 h-4 mt-0.5 ${colors.accent}`} />
                            <span className="text-sm text-gray-600 dark:text-gray-400 break-words whitespace-normal">{t.prize}</span>
                          </div>
                        )}

                        {t.location && (
                          <div className="flex items-start gap-3">
                            <Clock className={`w-4 h-4 mt-0.5 ${colors.accent}`} />
                            <span className="text-sm text-gray-600 dark:text-gray-400 break-words whitespace-normal">{t.location}</span>
                          </div>
                        )}
                      </div>

                      <Button className={unifiedStyles.primaryButton} onClick={() => router.push(`/tournaments/${t.id}`)}>
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completados */}
        <div className={styles.section}>
          <SectionTitle title="Torneos Completados" variant="default" />
          {completedTournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No hay torneos completados</h3>
              <p className="text-gray-500 dark:text-gray-500">
                {selectedSeason ? `No hay torneos completados en la temporada seleccionada.` : "No hay torneos completados disponibles."}
              </p>
            </div>
          ) : (
            <div className={styles.tournamentsGrid}>
              {completedTournaments.map((t) => {
                const seasonId = t.season?.id ?? t.seasonId ?? 0;
                const colorData = getSeasonColor(seasonId);
                const colors = {
                  icon: colorData.completed.icon,
                  border: colorData.completed.border,
                  accent: colorData.completed.accent,
                };

                return (
                  <div key={t.id} className={`group relative ${unifiedStyles.card} ${colors.border} overflow-hidden`}>
                    <div className="relative p-4 sm:p-6">
                      {CardHeader(t, colors)}

                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3">
                          <Calendar className={`w-4 h-4 mt-0.5 ${colors.accent}`} />
                          <div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {new Date(t.startDate).toLocaleDateString("es-AR", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">Completado</div>
                          </div>
                        </div>

                        {t.participants && (
                          <div className="flex items-start gap-3">
                            <Users className={`w-4 h-4 mt-0.5 ${colors.accent}`} />
                            <div className="w-full">
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.participants} participantes</div>
                              <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2 mt-1">
                                <div className={`bg-gradient-to-r ${colors.icon} h-2 rounded-full w-full`} />
                              </div>
                            </div>
                          </div>
                        )}

                        {t.prize && (
                          <div className="flex items-start gap-3">
                            <Award className={`w-4 h-4 mt-0.5 ${colors.accent}`} />
                            <span className="text-sm text-gray-500 dark:text-gray-500 break-words whitespace-normal">{t.prize}</span>
                          </div>
                        )}

                        {t.location && (
                          <div className="flex items-start gap-3">
                            <Clock className={`w-4 h-4 mt-0.5 ${colors.accent}`} />
                            <span className="text-sm text-gray-500 dark:text-gray-500 break-words whitespace-normal">{t.location}</span>
                          </div>
                        )}
                      </div>

                      <Button className={unifiedStyles.primaryButton} onClick={() => router.push(`/tournaments/${t.id}`)}>
                        Ver Resultados
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
