'use client';

import { Button } from "@/components/ui/button";
import { RankTableSkeleton } from "@/components/ui/loading-skeleton";
import { Pagination } from "@/components/ui/pagination";
import { RankBadgeAuto } from "@/components/ui/rank-badge-auto";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Crown, Eye, Medal, Star, Target, TrendingUp, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { CountryFlag } from "@/components/ui/country-flag";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { playersApi } from "@/lib/api/client";
import { useI18nContext } from "./providers/i18n-provider";
import { getPositionColor, getWinRateColor, unifiedStyles } from "./ui/unified-styles";

// Función para formatear números usando el locale del cliente
const formatNumber = (num: number): string => {
    return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.round(num));
};

/* Tooltip */
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface PlayerData {
    id: number;
    nickname: string;
    fullname?: string;
    player_id: number; // legajo
    country_iso: string;
    country_name: string;
    position: number;
    total_games: number;
    average_position: number;
    dan_points: number;
    rate_points: number;
    season_points?: number;
    max_rate: number;
    win_rate: number;
    rank: string;
    rank_color?: string;
    rank_min_points?: number;
    rank_max_points?: number;
    next_rank?: string;
    first_place_h: number;
    second_place_h: number;
    third_place_h: number;
    fourth_place_h: number;
    first_place_t: number;
    second_place_t: number;
    third_place_t: number;
    fourth_place_t: number;
    trend_dan_delta10?: number;
    trend_season_delta10?: number;
}

interface RankTableProps {
    variant?: "main" | "compact";
    showFilters?: boolean;
    maxRows?: number;
    /** si true, rompe el max-width del layout padre y usa todo el ancho del viewport */
    fullBleed?: boolean;
    onReady?: () => void;
}

export function RankTableNew({
    variant = "main",
    showFilters = true,
    maxRows,
    fullBleed = true,
    onReady,
}: RankTableProps) {
    const { t } = useI18nContext();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [showInactive, setShowInactive] = useState(false);
    const [playerCount, setPlayerCount] = useState<'3players' | '4players'>('4players');
    const [rankingType, setRankingType] = useState<'GENERAL' | 'TEMPORADA'>('GENERAL');

    const [playerData, setPlayerData] = useState<PlayerData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [uniqueGames, setUniqueGames] = useState<number | null>(null);

    const [initializing, setInitializing] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [lastupdatedAt, setLastupdatedAt] = useState<Date | null>(null);
    const [nextRefreshAt, setNextRefreshAt] = useState<Date | null>(null);
    const [urlParamsLoaded, setUrlParamsLoaded] = useState(false);

    const fetchAbortRef = useRef<AbortController | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewAll, setViewAll] = useState(false);
    const [filteredPlayers, setFilteredPlayers] = useState<PlayerData[]>([]);

    // Notificar a la página contenedora cuando el primer load terminó
    useEffect(() => {
        if (!initializing) onReady?.();
    }, [initializing, onReady]);

    // init from URL (solo setea estado desde la URL, no hace fetch)
    useEffect(() => {
        const page = searchParams.get('page');
        const search = searchParams.get('search');
        const mode = searchParams.get('mode');
        const type = searchParams.get('type');
        const inactive = searchParams.get('inactive');
        const perPage = searchParams.get('perPage');
        const viewAllParam = searchParams.get('viewAll');

        if (page) setCurrentPage(parseInt(page, 10));
        if (search) setSearchQuery(search);
        if (mode) setPlayerCount(mode as '3players' | '4players');
        if (type) setRankingType(type as 'GENERAL' | 'TEMPORADA');
        if (inactive) setShowInactive(inactive === 'true');
        if (perPage) setItemsPerPage(parseInt(perPage, 10));
        if (viewAllParam) setViewAll(viewAllParam === 'true');

        setUrlParamsLoaded(true);
    }, [searchParams]);

    const updateURL = (updates: Record<string, string | number | boolean | null>) => {
        const currentParams = new URLSearchParams(searchParams.toString());
        let hasChanges = false;

        Object.entries(updates).forEach(([key, value]) => {
            const currentValue = currentParams.get(key);
            const newValue = value === null || value === '' || value === false ? null : String(value);
            if (currentValue !== newValue) {
                hasChanges = true;
                if (newValue === null) currentParams.delete(key);
                else currentParams.set(key, newValue);
            }
        });

        // si cambió algo distinto de page, reseteamos page a 1
        if (updates.page === undefined && Object.keys(updates).some(k => k !== 'page')) {
            const p = currentParams.get('page');
            if (p !== '1') {
                currentParams.set('page', '1');
                hasChanges = true;
            }
        }

        if (hasChanges) {
            const newURL = `${window.location.pathname}?${currentParams.toString()}`;
            startTransition(() => {
                router.replace(newURL, { scroll: false });
            });
        }
    };

    // filter by search (en memoria)
    useEffect(() => {
        const list = maxRows ? playerData.slice(0, maxRows) : playerData;
        if (!list.length) {
            setFilteredPlayers([]);
            return;
        }
        if (!searchQuery.trim()) {
            setFilteredPlayers(list);
            return;
        }
        const q = searchQuery.toLowerCase().trim();
        const filtered = list.filter(p =>
            p.nickname.toLowerCase().includes(q) ||
            p.fullname?.toLowerCase().includes(q) ||
            p.player_id.toString().includes(q)
        );
        setFilteredPlayers(filtered);
        setCurrentPage(1);
    }, [playerData, searchQuery, maxRows]);

    // pagination
    const paginatedPlayers = useMemo(() => {
        if (viewAll) return filteredPlayers;
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPlayers.slice(start, start + itemsPerPage);
    }, [filteredPlayers, viewAll, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        updateURL({ search: q || null, page: 1 });
    };
    const handleSearchClear = () => {
        setSearchQuery('');
        updateURL({ search: null, page: 1 });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setViewAll(false);
        updateURL({ page, viewAll: false });
    };

    const handlePlayerCountChange = (newCount: '3players' | '4players') => {
        setPlayerCount(newCount);
        updateURL({ mode: newCount, page: 1 });
        fetchPlayers({ includeInactive: showInactive, sanma: newCount === "3players", type: rankingType });
    };

    const handleViewAllToggle = () => {
        const nv = !viewAll;
        setViewAll(nv);
        if (!nv) {
            setCurrentPage(1);
            updateURL({ viewAll: false, page: 1 });
        } else {
            updateURL({ viewAll: true, page: null });
        }
    };

    async function fetchPlayers(opts: { includeInactive: boolean; sanma: boolean; type: 'GENERAL' | 'TEMPORADA'; firstLoad?: boolean }) {
        if (fetchAbortRef.current) fetchAbortRef.current.abort();
        const controller = new AbortController();
        fetchAbortRef.current = controller;

        try {
            opts.firstLoad ? setInitializing(true) : setIsFetching(true);

            const playersResponse = await playersApi.getAll({ includeInactive: opts.includeInactive, sanma: opts.sanma, type: opts.type });

            if (playersResponse.success && playersResponse.data) {
                const list = playersResponse.data as any[];
                setPlayerData(Array.isArray(list) ? list : []);
                setError(null);
                if (playersResponse.refreshedAt) setLastupdatedAt(new Date(playersResponse.refreshedAt));
                if (playersResponse.nextRefreshAt) setNextRefreshAt(new Date(playersResponse.nextRefreshAt));

                // calcular juegos únicos aproximados
                const seats = opts.sanma ? 3 : 4;
                const approx = Math.round((Array.isArray(list) ? list.reduce((s, p: any) => s + (p.total_games || 0), 0) : 0) / seats);
                setUniqueGames(approx);
            } else {
                setError(playersResponse.error || "Error cargando el ranking");
            }
        } catch (e: any) {
            if (e?.name !== "AbortError") setError("Error de conexión");
        } finally {
            opts.firstLoad ? setInitializing(false) : setIsFetching(false);
            fetchAbortRef.current = null;
            setLastupdatedAt(new Date());
        }
    }

    // initial load: SOLO una vez cuando ya leímos la URL
    useEffect(() => {
        if (!urlParamsLoaded) return;
        fetchPlayers({ includeInactive: showInactive, sanma: playerCount === "3players", type: rankingType, firstLoad: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlParamsLoaded]);

    // auto-refresh cada 5 min (si no hay búsqueda, en page 1 y sin "ver todo")
    useEffect(() => {
        const id = setInterval(() => {
            if (!searchQuery && currentPage === 1 && !viewAll) {
                fetchPlayers({ includeInactive: showInactive, sanma: playerCount === "3players", type: rankingType });
            }
        }, 5 * 60 * 1000);
        return () => clearInterval(id);
    }, [showInactive, playerCount, rankingType, searchQuery, currentPage, viewAll]);

    const getTrendIcon = (p: PlayerData) => {
        const d = rankingType === 'GENERAL' ? (p.trend_dan_delta10 || 0) : (p.trend_season_delta10 || 0);
        if (d > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
        if (d < 0) return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    };

    const getPositionIcon = (position: number) => {
        if (position === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
        if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
        if (position === 3) return <Award className="w-5 h-5 text-orange-500" />;
        if (position <= 10) return <Star className="w-4 h-4 text-blue-500" />;
        return null;
    };

    const getPositionGradient = (position: number) => {
        if (position === 1) return "from-yellow-400 via-yellow-500 to-yellow-600";
        if (position === 2) return "from-gray-300 via-gray-400 to-gray-500";
        if (position === 3) return "from-orange-400 via-orange-500 to-orange-600";
        if (position <= 10) return "from-blue-400 via-blue-500 to-blue-600";
        return "from-gray-200 via-gray-300 to-gray-400";
    };

    if (initializing) {
        return <RankTableSkeleton />;
    }

    if (error) {
        return (
            <div className={`w-full space-y-4 px-3 sm:px-4 mx-auto xl:max-w-[1400px] 2xl:max-w-[1600px] ${fullBleed ? 'w-screen ml-[50%] -translate-x-[50%]' : ''}`}>
                <div className="text-center py-8">
                    <div className="text-red-600 dark:text-red-400 mb-2">Error cargando el ranking</div>
                    <div className="text-gray-600 dark:text-gray-400">{error}</div>
                    <Button onClick={() => fetchPlayers({ includeInactive: showInactive, sanma: playerCount === "3players", type: rankingType })} variant="outline" className="mt-4">
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full space-y-6 px-3 sm:px-4 mx-auto max-w-6xl pb-24 lg:pb-0 ${fullBleed ? 'w-screen ml-[50%] -translate-x-[50%]' : ''}`}>
            {lastupdatedAt && (
                <div className="text-xs text-muted-foreground text-center py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
                    ✨ Última actualización: {lastupdatedAt.toLocaleTimeString('es-AR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    {nextRefreshAt && (
                        <> • Próxima actualización: {nextRefreshAt.toLocaleTimeString('es-AR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>
                    )}
                    {isFetching && <> • Actualizando…</>}
                </div>
            )}

            {showFilters && variant === "main" && (
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/30 py-6 rounded-xl">
                    <div className="space-y-6">
                        {/* Fila principal de filtros */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                            {/* Filtros principales */}
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                                {/* Filtro de jugadores activos/inactivos */}
                                <Select
                                    value={showInactive ? "Todos" : "Activos"}
                                    onValueChange={(v) => {
                                        const ni = v === "Todos";
                                        setShowInactive(ni);
                                        updateURL({ inactive: ni || null, page: 1 });
                                        fetchPlayers({ includeInactive: ni, sanma: playerCount === "3players", type: rankingType });
                                    }}
                                >
                                    <SelectTrigger className={`${unifiedStyles.selectTrigger} shrink-0 w-28 sm:w-32`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Activos">Activos</SelectItem>
                                        <SelectItem value="Todos">Todos</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Toggle de modo de juego */}
                                <ToggleGroup
                                    type="single"
                                    value={playerCount === "4players" ? "4p" : "3p"}
                                    onValueChange={(v) => v && handlePlayerCountChange(v === "4p" ? "4players" : "3players")}
                                    className={`${unifiedStyles.toggleGroup} shrink-0`}
                                >
                                    <ToggleGroupItem value="4p" className={unifiedStyles.toggleGroupItem}>
                                        {t('player.profilePage.fourPlayerMode', '4p')}
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="3p" className={unifiedStyles.toggleGroupItem}>
                                        {t('player.profilePage.threePlayerMode', '3p')}
                                    </ToggleGroupItem>
                                </ToggleGroup>

                                {/* Toggle de tipo de ranking */}
                                <ToggleGroup
                                    type="single"
                                    value={rankingType === 'GENERAL' ? 'general' : 'temporada'}
                                    onValueChange={(v) => {
                                        if (!v) return;
                                        const nt = v === 'general' ? 'GENERAL' : 'TEMPORADA';
                                        setRankingType(nt);
                                        updateURL({ type: nt, page: 1 });
                                        fetchPlayers({ includeInactive: showInactive, sanma: playerCount === "3players", type: nt });
                                    }}
                                    className={`${unifiedStyles.toggleGroup} shrink-0`}
                                >
                                    <ToggleGroupItem value="general" className={unifiedStyles.toggleGroupItem}>
                                        General
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="temporada" className={unifiedStyles.toggleGroupItem}>
                                        Temporada
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </div>

                            {/* Controles de visualización */}
                            <div className="flex flex-wrap items-center gap-2 ml-auto">
                                {/* Info de jugadores */}
                                <div className={`${unifiedStyles.infoChip} max-w-[160px]`}>
                                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">
                                        {searchQuery ? `${filteredPlayers.length} de ${playerData.length}` : `${filteredPlayers.length}`} jugadores
                                    </span>
                                </div>

                                {/* Toggle ver todo/paginado */}
                                <Button
                                    variant={viewAll ? "default" : "outline"}
                                    onClick={handleViewAllToggle}
                                    className={unifiedStyles.primaryButton}
                                >
                                    {viewAll ? "Ver paginado" : "Ver todo"}
                                </Button>

                                {/* Selector de items por página */}
                                {!viewAll && (
                                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                                        <span className="text-sm text-muted-foreground">Por pág.:</span>
                                        <Select
                                            value={itemsPerPage.toString()}
                                            onValueChange={(v) => {
                                                const pp = Number(v);
                                                setItemsPerPage(pp);
                                                updateURL({ perPage: pp, page: 1 });
                                            }}
                                        >
                                            <SelectTrigger className={`${unifiedStyles.selectTrigger} w-20`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="25">25</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                                <SelectItem value="100">100</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Barra de búsqueda */}
                        <div className="w-full">
                            <SearchInput
                                placeholder="Escribe nombre o #ID exacto para ir al jugador, o busca parcialmente para filtrar…"
                                value={searchQuery}
                                onChange={handleSearch}
                                onClear={handleSearchClear}
                                debounceMs={250}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Nueva tabla con diseño de cards */}
            <div className="space-y-3">
                {paginatedPlayers.map((p, i) => (
                    <div
                        key={p.player_id ?? p.id ?? `player-${i}`}
                        id={`player-${p.position}`}
                        className={`group relative ${unifiedStyles.card} hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden`}
                    >
                        {/* Efecto de brillo en hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />

                        <div className="relative p-4">
                            <div className="md:flex md:items-center md:justify-between md:gap-4">
                                {/* Izquierda: posición + jugador */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={`${unifiedStyles.positionBadge(p.position)} relative shrink-0`}>
                                        {getPositionIcon(p.position) && (
                                            <div className="absolute top-0.5 left-0.5 opacity-60">
                                                {getPositionIcon(p.position)}
                                            </div>
                                        )}
                                        <span className="relative z-10">{p.position}</span>
                                    </div>

                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`${unifiedStyles.playerAvatar} shrink-0`}>
                                            {p.nickname.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                                    {p.nickname}
                                                </h3>
                                                <CountryFlag
                                                    countryCode={p.country_iso || p.country_name}
                                                    countryName={p.country_name}
                                                    size="sm"
                                                    className="w-6 h-4 rounded shadow-sm shrink-0"
                                                />
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                #{p.player_id} • {p.fullname || p.nickname}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ===== Desktop stats (md+) ===== */}
                                <div className="hidden md:flex items-center gap-4 shrink-0">
                                    {/* Pos. Prom. */}
                                    <div className={unifiedStyles.statContainer}>
                                        <div className={unifiedStyles.statLabel}>Pos. Prom.</div>
                                        <div className={`${unifiedStyles.statValue} ${getPositionColor(p.average_position || 0)}`}>
                                            {(p.average_position || 0).toFixed(2)}
                                        </div>
                                    </div>

                                    {/* % Victoria */}
                                    <div className={unifiedStyles.statContainer}>
                                        <div className={unifiedStyles.statLabel}>% Victoria</div>
                                        <div className={`${unifiedStyles.statValue} ${getWinRateColor(p.win_rate || 0)}`}>
                                            {(p.win_rate || 0).toFixed(1)}%
                                        </div>
                                    </div>

                                    {/* Rate/Season */}
                                    <div className="text-center min-w-[80px]">
                                        <div className={unifiedStyles.statLabel}>
                                            {rankingType === 'GENERAL' ? 'Rate' : 'Season'}
                                        </div>
                                        <div className={`${unifiedStyles.statValue} ${unifiedStyles.colors.primary}`}>
                                            {rankingType === 'GENERAL'
                                                ? formatNumber(p.rate_points)
                                                : formatNumber(p.season_points || 0)}
                                        </div>
                                        {rankingType === 'GENERAL' && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Máx: {formatNumber(p.max_rate)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Rango */}
                                    {rankingType === 'GENERAL' && (
                                        <div className={unifiedStyles.statContainer}>
                                            <div className={unifiedStyles.statLabel}>Rango</div>
                                            <TooltipProvider delayDuration={50}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="inline-flex items-center justify-center">
                                                            <RankBadgeAuto rank={p.rank} dbColor={p.rank_color} size="md" preferVioletHighDan />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" align="center" className="space-y-2">
                                                        <div className="text-sm font-medium">
                                                            {t(`ranks.${p.rank}`, p.rank)}
                                                        </div>
                                                        {(p.rank_min_points != null && p.rank_max_points != null && p.rank_color) && (
                                                            <div className="w-[220px]">
                                                                <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full"
                                                                        style={{
                                                                            width: `${Math.round(Math.max(0, Math.min(1, (p.dan_points - p.rank_min_points) / Math.max(1, p.rank_max_points - p.rank_min_points))) * 100)}%`,
                                                                            background: `color-mix(in oklab, ${p.rank_color} 82%, transparent)`,
                                                                            boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${p.rank_color} 30%, transparent)`,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="mt-1 text-[11px] text-muted-foreground text-right">
                                                                    {Math.max(0, Math.round(p.rank_max_points - p.dan_points)) > 0
                                                                        ? `${Math.max(0, Math.round(p.rank_max_points - p.dan_points))}${p.next_rank ? ` → ${p.next_rank}` : ""}`
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
                                    <div className={unifiedStyles.statContainer}>
                                        <div className={unifiedStyles.statLabel}>Juegos</div>
                                        <div className={`${unifiedStyles.statValue} ${unifiedStyles.colors.secondary}`}>
                                            {rankingType === 'GENERAL'
                                                ? formatNumber(p.total_games)
                                                : formatNumber(p.first_place_h + p.second_place_h + p.third_place_h + p.fourth_place_h + p.first_place_t + p.second_place_t + p.third_place_t + p.fourth_place_t)}
                                        </div>
                                        {variant === "main" && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                H:{p.first_place_h + p.second_place_h + p.third_place_h + p.fourth_place_h}
                                                {' '}T:{p.first_place_t + p.second_place_t + p.third_place_t + p.fourth_place_t}
                                            </div>
                                        )}
                                    </div>

                                    {/* Tendencia + Ver */}
                                    {variant === "main" && (
                                        <div className="flex items-center gap-2">
                                            <div className="text-center">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tend.</div>
                                                <div className="flex justify-center">{getTrendIcon(p)}</div>
                                            </div>
                                            <Link href={`/player/${p.player_id || p.id}`}>
                                                <Button className={unifiedStyles.smallButton}>
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    Ver
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* ===== Mobile stats (<md) ===== */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 md:hidden w-full">
                                    <div className="text-center">
                                        <div className={unifiedStyles.statLabel}>Pos. Prom.</div>
                                        <div className={`${unifiedStyles.statValue} ${getPositionColor(p.average_position || 0)}`}>
                                            {(p.average_position || 0).toFixed(1)}
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className={unifiedStyles.statLabel}>% Victoria</div>
                                        <div className={`${unifiedStyles.statValue} ${getWinRateColor(p.win_rate || 0)}`}>
                                            {(p.win_rate || 0).toFixed(1)}%
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className={unifiedStyles.statLabel}>
                                            {rankingType === 'GENERAL' ? 'Rate' : 'Season'}
                                        </div>
                                        <div className={`${unifiedStyles.statValue} ${unifiedStyles.colors.primary}`}>
                                            {rankingType === 'GENERAL'
                                                ? formatNumber(p.rate_points)
                                                : formatNumber(p.season_points || 0)}
                                        </div>
                                        {rankingType === 'GENERAL' && (
                                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                                Máx: {formatNumber(p.max_rate)}
                                            </div>
                                        )}
                                    </div>

                                    {rankingType === 'GENERAL' && (
                                        <div className="flex items-center justify-center">
                                            <RankBadgeAuto rank={p.rank} dbColor={p.rank_color} size="md" preferVioletHighDan />
                                        </div>
                                    )}

                                    <div className="text-center">
                                        <div className={unifiedStyles.statLabel}>Juegos</div>
                                        <div className={`${unifiedStyles.statValue} ${unifiedStyles.colors.secondary}`}>
                                            {rankingType === 'GENERAL'
                                                ? formatNumber(p.total_games)
                                                : formatNumber(p.first_place_h + p.second_place_h + p.third_place_h + p.fourth_place_h + p.first_place_t + p.second_place_t + p.third_place_t + p.fourth_place_t)}
                                        </div>
                                        {variant === "main" && (
                                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                                H:{p.first_place_h + p.second_place_h + p.third_place_h + p.fourth_place_h}
                                                {' '}T:{p.first_place_t + p.second_place_t + p.third_place_t + p.fourth_place_t}
                                            </div>
                                        )}
                                    </div>

                                    {variant === "main" && (
                                        <div className="flex items-center justify-center gap-3 col-span-2">
                                            {getTrendIcon(p)}
                                            <Link href={`/player/${p.player_id || p.id}`}>
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
                ))}
            </div>

            {showFilters && variant === "main" && !viewAll && totalPages > 1 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredPlayers.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        compact={false}
                    />
                </div>
            )}

            {variant === "main" && (
                <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="text-blue-700 dark:text-blue-300 font-medium">{filteredPlayers.length} jugadores</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                            <Trophy className="w-4 h-4 text-purple-500" />
                            <span className="text-purple-700 dark:text-purple-300 font-medium">
                                {formatNumber(uniqueGames ?? filteredPlayers.reduce((s, p) => s + p.total_games, 0))} juegos
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30">
                            <Target className="w-4 h-4 text-green-500" />
                            <span className="text-green-700 dark:text-green-300 font-medium">
                                {rankingType === 'GENERAL'
                                    ? <>Rate prom: {filteredPlayers.length > 0 ? formatNumber(filteredPlayers.reduce((s, p) => s + p.rate_points, 0) / filteredPlayers.length) : 0}</>
                                    : <>Season prom: {filteredPlayers.length > 0 ? formatNumber(filteredPlayers.reduce((s, p) => s + (p.season_points || 0), 0) / filteredPlayers.length) : 0}</>
                                }
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                            <TrendingUp className="w-4 h-4 text-yellow-500" />
                            <span className="text-yellow-700 dark:text-yellow-300 font-medium">Temporada 2024/25</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
