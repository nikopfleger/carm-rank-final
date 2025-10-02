"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import { usePublicService } from "@/components/providers/services-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, Eye, Settings, Trophy, Users } from "@/components/ui/icons";
import { SeasonsPageSkeleton } from "@/components/ui/loading-skeleton";
import { SectionTitle } from "@/components/ui/section-title";
import { unifiedStyles } from "@/components/ui/unified-styles";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { formatYmdForDisplay, toYmd } from '@/lib/format-utils';
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

interface Season {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  players: number;
  games: number;
  tournaments: number;
  rulesets: number;
  rulesetNames?: string[];
}

export default function SeasonsPage() {
  const { handleError } = useErrorHandler();
  const { t } = useI18nContext();
  const publicService = usePublicService();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSeasons = async () => {
      try {
        setLoading(true);
        const data = await publicService.getSeasons();
        const now = new Date();
        const mapped = (Array.isArray((data as any)?.data) ? (data as any).data : (data as any))
          .map((s: any) => {
            const start = new Date(s.startDate);
            const end = new Date(s.endDate);
            const isActiveByDate = now >= start && now <= end;
            const status = (s.isActive === true || isActiveByDate) ? 'active' : 'completed';
            return {
              id: s.id,
              name: s.name,
              startDate: s.startDate,
              endDate: s.endDate,
              status,
              players: s.playersCount ?? s.players ?? 0,
              games: s.gamesCount ?? s.games ?? 0,
              tournaments: s.tournamentsCount ?? s.tournaments ?? 0,
              rulesets: s.rulesetsCount ?? s.rulesets ?? 0,
              rulesetNames: s.rulesetNames ?? []
            } as Season;
          });
        setSeasons(mapped);
      } catch (error) {
        handleError(error, t('common.loading', 'Cargar temporadas'));
        // Fallback a datos mock si falla la API
        setSeasons([
          {
            id: 5,
            name: "Season 5 - 2025",
            startDate: "2025-01-01",
            endDate: "2025-12-31",
            status: "active",
            players: 0,
            games: 0,
            tournaments: 1,
            rulesets: 0
          },
          {
            id: 4,
            name: "Season 4 - 2024",
            startDate: "2024-10-01",
            endDate: "2024-12-31",
            status: "completed",
            players: 10,
            games: 45,
            tournaments: 2,
            rulesets: 1
          },
          {
            id: 3,
            name: "Season 3 - 2023",
            startDate: "2023-01-01",
            endDate: "2023-12-31",
            status: "completed",
            players: 9,
            games: 38,
            tournaments: 2,
            rulesets: 1
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadSeasons();
  }, [publicService, handleError, t]);

  if (loading) {
    return (
      <div className={styles.seasonsPage}>
        <SeasonsPageSkeleton />
      </div>
    );
  }

  return (
    <div className={styles.seasonsPage}>
      {/* Hero Section */}
      <PageHeader
        icon={Calendar}
        title={t('navigation.seasons', 'Temporadas')}
        subtitle={t('pages.seasons.title', 'Temporadas del ranking CAMR')}
        variant="players"
      />

      {/* Main Content */}
      <div className="py-8">
        <SectionTitle title={t('ui.availableSeasons', 'Temporadas Disponibles')} variant="seasons" />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {seasons.map((season) => (
            <div
              key={season.id}
              className={`group relative ${unifiedStyles.card} overflow-hidden`}
            >
              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />

              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {season.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {formatYmdForDisplay(toYmd(season.startDate), 'es-AR')} - {formatYmdForDisplay(toYmd(season.endDate), 'es-AR')}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={season.status === 'active' ? 'default' : 'secondary'}
                    className={season.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : ''}
                  >
                    {season.status === 'active' ? t('ui.active', 'Activa') : t('ui.completed', 'Completada')}
                  </Badge>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="text-lg font-bold text-yellow-500">
                      {season.tournaments}
                    </div>
                    <div className="text-xs text-gray-500">{t('ui.tournaments', 'torneos')}</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-lg font-bold text-blue-500">
                      {season.players}
                    </div>
                    <div className="text-xs text-gray-500">{t('ui.players', 'jugadores')}</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <BarChart3 className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="text-lg font-bold text-purple-500">
                      {season.games}
                    </div>
                    <div className="text-xs text-gray-500">{t('ui.games', 'juegos')}</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Settings className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-lg font-bold text-green-500">
                      {season.rulesets}
                    </div>
                    <div className="text-xs text-gray-500">{t('ui.rules', 'reglas')}</div>
                  </div>
                </div>

                {/* Ruleset names */}
                <div className={`mb-4 p-3 ${unifiedStyles.card} rounded-lg`}>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>{t('ui.rulesLabel', 'Reglas:')}:</strong> {season.rulesetNames && season.rulesetNames.length > 0
                      ? season.rulesetNames.join(', ')
                      : '—'}
                  </div>
                </div>

                {/* Ver resultados button */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link href={`/seasons/${season.id}`}>
                    <Button className={`w-full ${unifiedStyles.primaryButton}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      {t('ui.seeResults', 'Ver Resultados')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
