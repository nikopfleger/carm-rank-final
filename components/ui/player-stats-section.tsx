'use client';

import { useI18nContext } from '@/components/providers/i18n-provider';
import { SectionWithContext } from '@/components/ui/contextual-info';
import { DanProgressCard } from '@/components/ui/dan-progress-card';
import { HeroStatCard } from '@/components/ui/hero-stat-card';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { SeasonStatCard } from '@/components/ui/season-stat-card';
import { StatCard } from '@/components/ui/stat-card';
import { fmtInt, formatDecimal } from '@/lib/format-utils';
import { DanConfig } from '@/lib/game-helpers-client';
import dynamic from 'next/dynamic';
const PositionDistributionChart = dynamic(() => import('@/components/ui/position-distribution-chart').then(m => m.PositionDistributionChart), { ssr: false });

interface PlayerStatsSectionProps {
    // Dan progress
    currentDan: number;
    currentRank: DanConfig | null;
    nextRank: DanConfig | null;
    dbRankColor?: string;

    // Stats data
    stats: {
        currentDan: number;
        currentRate: number;
        danDelta?: number;
        rateDelta?: number;
        maxRate?: number;
    };
    generalStats: {
        maxRate: number;
        avgPosition: number;
        seasonPoints: number;
    } | null;

    // Position distribution
    currentStats: {
        total: number;
        first: number;
        second: number;
        third: number;
        fourth: number;
        firstPercent: number;
        secondPercent: number;
        thirdPercent: number;
        fourthPercent: number;
        avgPosition: number;
        rentaiRate: number;
    };

    // Season position distribution
    seasonStats?: {
        seasonTotalGames: number;
        seasonAveragePosition: number;
        seasonFirstPlaceH: number;
        seasonSecondPlaceH: number;
        seasonThirdPlaceH: number;
        seasonFourthPlaceH: number;
        seasonFirstPlaceT: number;
        seasonSecondPlaceT: number;
        seasonThirdPlaceT: number;
        seasonFourthPlaceT: number;
    } | null;

    // Game mode
    isSanma?: boolean; // true = 3 jugadores, false = 4 jugadores

    // Chart data
    filteredChartData: Array<{ danPoints: number }>;
}

export function PlayerStatsSection({
    currentDan,
    currentRank,
    nextRank,
    dbRankColor,
    stats,
    generalStats,
    currentStats,
    seasonStats,
    isSanma,
    filteredChartData,
}: PlayerStatsSectionProps) {
    const { t } = useI18nContext();

    // Color por promedio: <2.5 verde, =2.5 amarillo, >2.5 rojo
    const getPositionColor = (avgPosition: number): 'green' | 'yellow' | 'red' => {
        if (avgPosition < 2.5) return 'green';
        if (avgPosition === 2.5) return 'yellow';
        return 'red';
    };

    const positionColor = getPositionColor(generalStats?.avgPosition || 0);

    // Delta de temporada últimos 30 días usando variaciones del chart
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30SeasonDelta = (filteredChartData as any[])?.filter((d) => {
        const dt = new Date(d.gameDate);
        return !isNaN(dt.getTime()) && dt >= thirtyDaysAgo;
    }).reduce((acc, d) => acc + (Number((d as any).seasonVariation || 0)), 0) || 0;

    return (
        <div className="space-y-6">
            {/* Insignia de rango y progreso */}
            <div className="flex justify-center">
                <DanProgressCard
                    currentDan={currentDan}
                    danConfig={currentRank}
                    nextDanConfig={nextRank}
                    dbColor={dbRankColor}
                />
            </div>

            {/* Cards principales - Responsive: 1 col móvil, 2 cols tablet, 4 cols desktop */}
            {generalStats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 items-stretch">
                    <HeroStatCard
                        title={
                            <InfoTooltip content="Total acumulado de puntos Dan - Sistema de clasificación principal">
                                {t("player.profilePage.danPoints")}
                            </InfoTooltip>
                        }
                        value={fmtInt(Math.round(stats.currentDan))}
                        subtitle="Total acumulado"
                        badge={t("player.profilePage.hero")}
                        delta={{
                            value: stats.danDelta || 0,
                            period: "vs 30 días",
                            trend: (stats.danDelta || 0) > 0 ? "up" : (stats.danDelta || 0) < 0 ? "down" : "neutral"
                        }}
                        sparklineData={filteredChartData.slice(-10).map(d => d.danPoints)}
                        color="purple"
                        size="lg"
                        className="lg:col-span-2"
                    />

                    <StatCard
                        title={
                            <InfoTooltip content="Puntos de Rate - Sistema de puntuación secundario">
                                {t("player.profilePage.ratePoints")}
                            </InfoTooltip>
                        }
                        value={fmtInt(Math.round(stats.currentRate))}
                        badge={`${t("player.profilePage.max")}: ${fmtInt(Math.round(stats.maxRate || 1500))}`}
                        color="blue"
                        size="md"
                    />

                    <StatCard
                        title={
                            <InfoTooltip content="Posición promedio en todos los juegos (1° = mejor, 4° = peor)">
                                {t("player.profilePage.avgPosition")}
                            </InfoTooltip>
                        }
                        value={formatDecimal(generalStats.avgPosition || 0, 2)}
                        color={positionColor}
                        size="md"
                    />
                </div>
            )}

            {/* Season points */}
            {generalStats && (
                <div className="mb-4">
                    <SeasonStatCard
                        title={
                            <InfoTooltip content="Puntos de temporada - Acumulados en la temporada actual">
                                {t("player.profilePage.seasonPoints")}
                            </InfoTooltip>
                        }
                        value={fmtInt(Math.round(generalStats.seasonPoints || 0))}
                        trend={last30SeasonDelta > 0 ? "up" : last30SeasonDelta < 0 ? "down" : "neutral"}
                        trendValue={Math.abs(last30SeasonDelta)}
                        color={positionColor}
                    />
                </div>
            )}

            {/* Distribución de posiciones */}
            <div id="position-distribution">
                <SectionWithContext
                    title="Distribución de posiciones"
                    description="Porcentaje de veces que terminaste en cada posición"
                    microcopy={`Distribución de posiciones en ${currentStats.total} juegos`}
                    className="mb-4"
                >
                    <PositionDistributionChart stats={currentStats} seasonStats={seasonStats} isSanma={isSanma} />
                </SectionWithContext>
            </div>
        </div>
    );
}
