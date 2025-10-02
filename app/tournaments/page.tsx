"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import { usePublicService } from "@/components/providers/services-provider";
import { PageHeader } from "@/components/shared/page-header";
import { TournamentStatusBadge } from "@/components/tournaments/tournament-status-badge";
import { Award, Calendar, Clock, Trophy } from "@/components/ui/icons";
import { TournamentsPageSkeleton } from "@/components/ui/loading-skeleton";
import { SectionTitle } from "@/components/ui/section-title";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { unifiedStyles } from "@/components/ui/unified-styles";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { formatYmdForDisplay, toYmd } from '@/lib/format-utils';
import { useEffect, useState } from "react";
import styles from "./page.module.css";

/* Helpers */
const labelOf = (v: any): string => (typeof v === "string" ? v : v?.name ?? "");
const dateOnly = (v: string | Date | undefined) => {
  if (!v) return undefined;
  const d = typeof v === "string" ? new Date(v) : v;
  d.setHours(0, 0, 0, 0);
  return d;
};

type NameRef = string | { id: number; name: string } | null;

interface Tournament {
  id: number;
  name: string;
  type: NameRef;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  participants?: number;
  maxParticipants?: number;
  prize?: string;
  location?: NameRef;        // "Online" o un objeto {id, name}
  seasonId?: number;
  season?: { id: number; name: string };
  tournamentResults?: any[];
}

interface Season { id: number; name: string; isActive: boolean; }

export default function TournamentsPage() {
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
        setSelectedSeasonName(t("ui.allSeasons", "Todas las temporadas"));
      } catch (e) {
        handleError(e, "Cargar datos");
        setTournaments([]); setSeasons([]);
        setSelectedSeasonName(t("ui.allSeasons", "Todas las temporadas"));
      } finally { setLoading(false); }
    };
    loadData();
  }, [publicService, t, handleError]);

  /* Filtro y categorías */
  const filteredTournaments = tournaments.filter((tr) => {
    if (!selectedSeason) return true;
    const seasonId = tr.season?.id || (tr as any).seasonId;
    return seasonId && seasonId.toString() === selectedSeason;
  });

  const today0 = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

  const upcomingTournaments = filteredTournaments.filter((t) => (dateOnly(t.startDate) ?? today0) > today0);
  const completedTournaments = filteredTournaments.filter((t) => t.isCompleted);
  const ongoingTournaments = filteredTournaments.filter((t) => (dateOnly(t.startDate) ?? today0) <= today0 && !t.isCompleted);

  const handleSeasonChange = (seasonId: string) => {
    setSelectedSeason(seasonId);
    if (!seasonId) setSelectedSeasonName("Todas las temporadas");
    else {
      const s = seasons.find((x) => x.id.toString() === seasonId);
      setSelectedSeasonName(s ? `${s.name} ${s.isActive ? "(Activa)" : ""}` : "Todas las temporadas");
    }
  };

  /* Colores por temporada */
  const getSeasonColor = (seasonId?: number | null) => {
    const map = {
      1: {
        bg: "bg-blue-500", icon: "from-blue-400 via-blue-500 to-blue-600", border: "hover:border-blue-300 dark:hover:border-blue-600", accent: "text-blue-500",
        completed: { icon: "from-blue-300 via-blue-400 to-blue-500", border: "hover:border-blue-200 dark:hover:border-blue-700", accent: "text-blue-400" }
      },
      2: {
        bg: "bg-green-500", icon: "from-green-400 via-green-500 to-green-600", border: "hover:border-green-300 dark:hover:border-green-600", accent: "text-green-500",
        completed: { icon: "from-green-300 via-green-400 to-green-500", border: "hover:border-green-200 dark:hover:border-green-700", accent: "text-green-400" }
      },
      3: {
        bg: "bg-purple-500", icon: "from-purple-400 via-purple-500 to-purple-600", border: "hover:border-purple-300 dark:hover:border-purple-600", accent: "text-purple-500",
        completed: { icon: "from-purple-300 via-purple-400 to-purple-500", border: "hover:border-purple-200 dark:hover:border-purple-700", accent: "text-purple-400" }
      },
      4: {
        bg: "bg-orange-500", icon: "from-orange-400 via-orange-500 to-orange-600", border: "hover:border-orange-300 dark:hover:border-orange-600", accent: "text-orange-500",
        completed: { icon: "from-orange-300 via-orange-400 to-orange-500", border: "hover:border-orange-200 dark:hover:border-orange-700", accent: "text-orange-400" }
      },
      5: {
        bg: "bg-pink-500", icon: "from-pink-400 via-pink-500 to-pink-600", border: "hover:border-pink-300 dark:hover:border-pink-600", accent: "text-pink-500",
        completed: { icon: "from-pink-300 via-pink-400 to-pink-500", border: "hover:border-pink-200 dark:hover:border-pink-700", accent: "text-pink-400" }
      },
    } as const;

    if (!seasonId || seasonId <= 0 || Number.isNaN(seasonId))
      return {
        bg: "bg-indigo-500", icon: "from-indigo-400 via-indigo-500 to-indigo-600",
        border: "hover:border-indigo-300 dark:hover:border-indigo-600", accent: "text-indigo-500",
        completed: { icon: "from-indigo-300 via-indigo-400 to-indigo-500", border: "hover:border-indigo-200 dark:hover:border-indigo-700", accent: "text-indigo-400" }
      };

    const idx = ((seasonId - 1) % 5) + 1;
    // @ts-ignore
    return map[idx] ?? map[1];
  };

  const getBadgeColor = (t: Tournament) => getSeasonColor(t.season?.id ?? t.seasonId ?? 0).bg;
  const getBadgeTextColor = (bg: string) => (/(yellow|orange|lime|amber)/.test(bg) ? "text-black" : "text-white");
  const getTournamentColors = (t: Tournament) => {
    const s = t.season?.id ?? t.seasonId ?? 0;
    const c = getSeasonColor(s);
    return { icon: c.icon, border: c.border, accent: c.accent };
  };

  if (loading) return <TournamentsPageSkeleton />;

  /* Header (fila 1 + 2) */
  const CardHeader = (t: Tournament, colors: { icon: string; border: string; accent: string }) => {
    const bg = getBadgeColor(t);
    const tx = getBadgeTextColor(bg);
    const seasonLabel = t.season?.name || (t.seasonId ? `Temporada ${t.seasonId}` : "");

    return (
      <>
        {/* Fila 1: Título (clamp 2 líneas, alto fijo por grid) */}
        <div className={`${styles.rowTitle} flex items-start gap-3`}>
          <div className={`w-11 h-11 bg-gradient-to-br ${colors.icon} rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
            <Trophy className="w-5 h-5" />
          </div>
          <h3 className={`text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-snug ${styles.clamp2}`}>{t.name}</h3>
        </div>

        {/* Fila 2: Meta - Individual y Pendiente en misma línea */}
        <div className={`${styles.rowMeta} flex items-center gap-3`}>
          <div className="flex items-center gap-2 shrink-0">
            <Award className={`w-4 h-4 ${colors.accent}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{labelOf(t.type)}</span>
          </div>

          <div className="shrink-0">
            <TournamentStatusBadge
              tournament={{
                id: t.id,
                name: t.name,
                startDate: new Date(t.startDate),
                endDate: t.endDate ? new Date(t.endDate) : undefined,
                isCompleted: t.isCompleted,
                tournamentResults: t.tournamentResults,
              }}
              className="text-[12px] sm:text-xs"
            />
          </div>
        </div>

        {/* Fila 3: Temporada - línea separada */}
        {seasonLabel && (
          <div className={`${styles.rowSeason} flex items-center`}>
            <span
              className={`${bg} ${tx} text-[12px] sm:text-xs md:text-sm px-3 py-1 rounded-full font-medium`}
              title={seasonLabel}
            >
              {seasonLabel}
            </span>
          </div>
        )}
      </>
    );
  };

  /* Card con slots fijos */
  const Card = (t: Tournament, section: "ongoing" | "upcoming" | "completed") => {
    const sId = t.season?.id ?? t.seasonId ?? 0;
    const sc = getSeasonColor(sId);
    const colors = section === "completed"
      ? { icon: sc.completed.icon, border: sc.completed.border, accent: sc.completed.accent }
      : { icon: sc.icon, border: sc.border, accent: sc.accent };


    // Si no hay ubicación, mostramos "Online" como fallback (pedido: que SIEMPRE esté abajo)
    const locationText = labelOf(t.location) || "Online";

    return (
      <div className={`group relative ${unifiedStyles.card} ${colors.border} overflow-hidden ${styles.cardItem}`}>
        <div className={styles.cardBody}>
          {/* 1+2) Título + Meta */}
          {CardHeader(t, colors)}

          {/* 4) Fecha (dos líneas: rango de fechas + estado) */}
          <div className={`${styles.rowDate} flex items-start gap-3`}>
            <Calendar className={`w-4 h-4 mt-0.5 ${colors.accent}`} />
            <div>
              <div className={`text-sm font-medium ${section === "completed" ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white"}`}>
                {t.endDate
                  ? `${formatYmdForDisplay(toYmd(t.startDate), 'es-AR')} - ${formatYmdForDisplay(toYmd(t.endDate), 'es-AR')}`
                  : formatYmdForDisplay(toYmd(t.startDate), 'es-AR')}
              </div>
              <div className={"text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2"}>
                <Clock className="w-4 h-4" />
                <span>{t.isCompleted ? 'Finalizado' : 'Programado'}</span>
              </div>
            </div>
          </div>

          {/* 5) Ubicación fija abajo */}
          <div className={`${styles.rowLocation} mt-2 flex items-center gap-2 text-gray-600 dark:text-gray-300`}>
            <Clock className="w-4 h-4" />
            <span className="text-sm">{locationText}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <PageHeader
        title={t("tournaments.title", "Torneos")}
        subtitle={t("tournaments.subtitle", "Gestiona los torneos de tu club")}
      />

      <SectionTitle title={t("tournaments.listTitle", "Lista de Torneos")} />

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Select onValueChange={handleSeasonChange} value={selectedSeason}>
          <SelectTrigger className="w-[180px]">
            <SelectContent>
              <SelectItem value="">{t("ui.allSeasons", "Todas las temporadas")}</SelectItem>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id.toString()}>
                  {season.name} {season.isActive ? "(Activa)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectTrigger>
        </Select>
      </div>

      <div className="grid gap-4">
        {upcomingTournaments.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3">{t("tournaments.upcoming", "Próximos Torneos")}</h3>
            <div className="grid gap-4">
              {upcomingTournaments.map((t) => (
                <Card key={t.id} t={t} section="upcoming" />
              ))}
            </div>
          </div>
        )}

        {ongoingTournaments.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3">{t("tournaments.ongoing", "Torneos en Curso")}</h3>
            <div className="grid gap-4">
              {ongoingTournaments.map((t) => (
                <Card key={t.id} t={t} section="ongoing" />
              ))}
            </div>
          </div>
        )}

        {completedTournaments.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3">{t("tournaments.completed", "Torneos Completados")}</h3>
            <div className="grid gap-4">
              {completedTournaments.map((t) => (
                <Card key={t.id} t={t} section="completed" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}