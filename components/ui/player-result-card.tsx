"use client";

import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/ui/country-flag";
import { RankBadgeAuto } from "@/components/ui/rank-badge-auto";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { unifiedStyles } from "@/components/ui/unified-styles";
import { Award, Eye, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";

interface PlayerResultCardProps {
    position: number;
    player: {
        id: number;
        nickname: string;
        fullname?: string | null;
        country_iso?: string;
        country_name?: string;
    };
    stats: {
        positionAverage?: number;
        winRate?: number;
        ratePoints?: number;
        seasonPoints?: number;
        danPoints?: number;
        rank?: string;
        rank_color?: string;
        rank_spanish?: string;
        rank_min_points?: number;
        rank_max_points?: number;
        next_rank?: string;
        totalGames?: number;
        hanchanGames?: number;
        tonpuusenGames?: number;
        maxRate?: number;
        trend?: 'up' | 'down' | 'stable';
    };
    variant?: 'main' | 'season' | 'tournament';
    showTrend?: boolean;
    showRank?: boolean;
    showCountry?: boolean;
    href?: string;
}

export function PlayerResultCard({
    position,
    player,
    stats,
    variant = 'main',
    showTrend = true,
    showRank = true,
    showCountry = true,
    href
}: PlayerResultCardProps) {
    const getPositionIcon = (position: number) => {
        switch (position) {
            case 1:
                return <Award className="w-5 h-5 text-yellow-500" />;
            case 2:
                return <Award className="w-5 h-5 text-gray-400" />;
            case 3:
                return <Award className="w-5 h-5 text-amber-600" />;
            default:
                return null;
        }
    };

    const getPositionColor = (avgPosition: number) => {
        if (avgPosition < 2.5) return unifiedStyles.colors.success;
        if (avgPosition === 2.5) return unifiedStyles.colors.warning;
        return unifiedStyles.colors.danger;
    };

    const getWinRateColor = (winRate: number) => {
        if (winRate >= 25) return unifiedStyles.colors.success;
        if (winRate >= 20) return unifiedStyles.colors.warning;
        return unifiedStyles.colors.danger;
    };

    const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
        if (!trend) return null;

        switch (trend) {
            case 'up':
                return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'down':
                return <TrendingDown className="w-4 h-4 text-red-500" />;
            case 'stable':
                return <div className="w-4 h-4 rounded-full bg-gray-400" />;
            default:
                return null;
        }
    };

    const CardContent = () => (
        <div className={`group relative ${unifiedStyles.card} hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden`}>
            {/* Efecto de brillo en hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />

            <div className="relative p-4">
                <div className="md:flex md:items-center md:justify-between md:gap-4">
                    {/* Izquierda: posición + jugador */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`${unifiedStyles.positionBadge(position)} relative shrink-0`}>
                            {getPositionIcon(position) && (
                                <div className="absolute top-0.5 left-0.5 opacity-60">
                                    {getPositionIcon(position)}
                                </div>
                            )}
                            <span className="relative z-10">{position}</span>
                        </div>

                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`${unifiedStyles.playerAvatar} shrink-0`}>
                                {player.nickname.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                        {player.nickname}
                                    </h3>
                                    {showCountry && (player.country_iso || player.country_name) && (
                                        <CountryFlag
                                            countryCode={player.country_iso || player.country_name || 'XX'}
                                            countryName={player.country_name}
                                            size="sm"
                                            className="w-6 h-4 rounded shadow-sm shrink-0"
                                        />
                                    )}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                    #{player.id} • {player.fullname || player.nickname}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== Desktop stats (md+) ===== */}
                    <div className="hidden md:flex items-center gap-4 shrink-0">
                        {/* Pos. Prom. */}
                        {stats.positionAverage !== undefined && (
                            <div className={unifiedStyles.statContainer}>
                                <div className={unifiedStyles.statLabel}>Pos. Prom.</div>
                                <div className={`${unifiedStyles.statValue} ${getPositionColor(stats.positionAverage)}`}>
                                    {stats.positionAverage.toFixed(2)}
                                </div>
                            </div>
                        )}

                        {/* % Victoria */}
                        {stats.winRate !== undefined && (
                            <div className={unifiedStyles.statContainer}>
                                <div className={unifiedStyles.statLabel}>% Victoria</div>
                                <div className={`${unifiedStyles.statValue} ${getWinRateColor(stats.winRate)}`}>
                                    {stats.winRate.toFixed(1)}%
                                </div>
                            </div>
                        )}

                        {/* Rate/Season */}
                        {(stats.ratePoints !== undefined || stats.seasonPoints !== undefined) && (
                            <div className="text-center min-w-[80px]">
                                <div className={unifiedStyles.statLabel}>
                                    {variant === 'tournament' ? 'Puntos' : (variant === 'season' ? 'Season' : 'Rate')}
                                </div>
                                <div className={`${unifiedStyles.statValue} ${unifiedStyles.colors.primary}`}>
                                    {variant === 'tournament'
                                        ? stats.seasonPoints?.toLocaleString('es-AR') || '0'
                                        : variant === 'season'
                                            ? Math.round(stats.seasonPoints || 0).toLocaleString('es-AR')
                                            : Math.round(stats.ratePoints || 0).toLocaleString('es-AR')}
                                </div>
                                {variant === 'main' && stats.maxRate && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Máx: {Math.round(stats.maxRate).toLocaleString('es-AR')}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Rango */}
                        {showRank && stats.rank && variant === 'main' && (
                            <div className={unifiedStyles.statContainer}>
                                <div className={unifiedStyles.statLabel}>Rango</div>
                                <TooltipProvider delayDuration={50}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-center">
                                                <RankBadgeAuto rank={stats.rank} dbColor={stats.rank_color} size="md" preferVioletHighDan />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" align="center" className="space-y-2">
                                            <div className="text-sm font-medium">
                                                {stats.rank_spanish || stats.rank}
                                            </div>
                                            {(stats.rank_min_points != null && stats.rank_max_points != null && stats.rank_color) && (
                                                <div className="w-[220px]">
                                                    <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${Math.round(Math.max(0, Math.min(1, ((stats.danPoints || 0) - stats.rank_min_points) / Math.max(1, stats.rank_max_points - stats.rank_min_points))) * 100)}%`,
                                                                background: `color-mix(in oklab, ${stats.rank_color} 82%, transparent)`,
                                                                boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${stats.rank_color} 30%, transparent)`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-muted-foreground text-right">
                                                        {Math.max(0, Math.round(stats.rank_max_points - (stats.danPoints || 0))) > 0
                                                            ? `${Math.max(0, Math.round(stats.rank_max_points - (stats.danPoints || 0)))}${stats.next_rank ? ` → ${stats.next_rank}` : ""}`
                                                            : "✓ listo"}
                                                    </div>
                                                </div>
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        )}

                        {/* Juegos */}
                        {stats.totalGames !== undefined && (
                            <div className={unifiedStyles.statContainer}>
                                <div className={unifiedStyles.statLabel}>Juegos</div>
                                <div className={`${unifiedStyles.statValue} ${unifiedStyles.colors.secondary}`}>
                                    {stats.totalGames.toLocaleString('es-AR')}
                                </div>
                                {variant === "main" && stats.hanchanGames !== undefined && stats.tonpuusenGames !== undefined && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        H:{stats.hanchanGames} T:{stats.tonpuusenGames}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tendencia + Ver */}
                        {showTrend && (
                            <div className="flex items-center gap-2">
                                <div className="text-center">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tend.</div>
                                    <div className="flex justify-center">{getTrendIcon(stats.trend)}</div>
                                </div>
                                {href && (
                                    <Link href={href}>
                                        <Button className={unifiedStyles.smallButton}>
                                            <Eye className="w-3 h-3 mr-1" />
                                            Ver
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ===== Mobile stats (<md) ===== */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 md:hidden w-full">
                        {stats.positionAverage !== undefined && (
                            <div className="text-center">
                                <div className={unifiedStyles.statLabel}>Pos. Prom.</div>
                                <div className={`${unifiedStyles.statValue} ${getPositionColor(stats.positionAverage)}`}>
                                    {stats.positionAverage.toFixed(1)}
                                </div>
                            </div>
                        )}

                        {stats.winRate !== undefined && (
                            <div className="text-center">
                                <div className={unifiedStyles.statLabel}>% Victoria</div>
                                <div className={`${unifiedStyles.statValue} ${getWinRateColor(stats.winRate)}`}>
                                    {stats.winRate.toFixed(1)}%
                                </div>
                            </div>
                        )}

                        {(stats.ratePoints !== undefined || stats.seasonPoints !== undefined) && (
                            <div className="text-center">
                                <div className={unifiedStyles.statLabel}>
                                    {variant === 'tournament' ? 'Puntos' : (variant === 'season' ? 'Season' : 'Rate')}
                                </div>
                                <div className={`${unifiedStyles.statValue} ${unifiedStyles.colors.primary}`}>
                                    {variant === 'tournament'
                                        ? stats.seasonPoints?.toLocaleString('es-AR') || '0'
                                        : variant === 'season'
                                            ? Math.round(stats.seasonPoints || 0).toLocaleString('es-AR')
                                            : Math.round(stats.ratePoints || 0).toLocaleString('es-AR')}
                                </div>
                                {variant === 'main' && stats.maxRate && (
                                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                        Máx: {Math.round(stats.maxRate).toLocaleString('es-AR')}
                                    </div>
                                )}
                            </div>
                        )}

                        {showRank && stats.rank && variant === 'main' && (
                            <div className="flex items-center justify-center">
                                <RankBadgeAuto rank={stats.rank} dbColor={stats.rank_color} size="md" preferVioletHighDan />
                            </div>
                        )}

                        {stats.totalGames !== undefined && (
                            <div className="text-center">
                                <div className={unifiedStyles.statLabel}>Juegos</div>
                                <div className={`${unifiedStyles.statValue} ${unifiedStyles.colors.secondary}`}>
                                    {stats.totalGames.toLocaleString('es-AR')}
                                </div>
                                {variant === "main" && stats.hanchanGames !== undefined && stats.tonpuusenGames !== undefined && (
                                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                        H:{stats.hanchanGames} T:{stats.tonpuusenGames}
                                    </div>
                                )}
                            </div>
                        )}

                        {showTrend && href && (
                            <div className="flex items-center justify-center gap-3 col-span-2">
                                {getTrendIcon(stats.trend)}
                                <Link href={href}>
                                    <Button className={unifiedStyles.smallButton}>
                                        <Eye className="w-3 h-3 mr-1" />
                                        Ver
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href}>
                <CardContent />
            </Link>
        );
    }

    return <CardContent />;
}
