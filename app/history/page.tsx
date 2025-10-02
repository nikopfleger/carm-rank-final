"use client";

import PlayerMultiAutocomplete, { Player } from "@/components/players/player-multi-autocomplete";
import { useI18nContext } from "@/components/providers/i18n-provider";
import { usePublicService } from "@/components/providers/services-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { CardListSkeleton } from "@/components/ui/loading-skeleton";
import { SectionTitle } from "@/components/ui/section-title";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { unifiedStyles } from "@/components/ui/unified-styles";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { formatYmdForDisplay, toYmd } from '@/lib/format-utils';
import { formatGameType, GAME_TYPE_OPTIONS } from "@/lib/game-type-utils";
import { Calendar, Download, Filter, History as HistoryIcon, MapPin, RotateCcw, Trophy, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

// Tipos
interface GameResult {
    id: number;
    playerId: number;
    finalPosition: number;
    finalScore: number;
    danPointsEarned: number;
    rateChange: number;
    player: {
        id: number;
        nickname: string;
        playerNumber: number;
        fullname?: string;
    };
}

interface Game {
    id: number;
    gameDate: string;
    gameType: "HANCHAN" | "TONPUUSEN";
    isValidated: boolean;
    extraData?: { venue?: string; nroJuegoDia?: number };
    location?: { id: number; name: string; city: string };
    season?: { id: number; name: string; isActive: boolean };
    gameResults: GameResult[];
}

interface Season {
    id: number;
    name: string;
    isActive: boolean;
}

interface Location {
    id: number;
    name: string;
    city: string;
}

export default function HistoryPage() {
    const { handleError } = useErrorHandler();
    const publicService = usePublicService();
    const { t } = useI18nContext();

    // Estados principales
    const [games, setGames] = useState<Game[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [dateRange, setDateRange] = useState<{ firstGameDate: string | null, lastGameDate: string | null }>({ firstGameDate: null, lastGameDate: null });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [filtersReady, setFiltersReady] = useState(false); // ✅ Nuevo estado para controlar cuando están listos los filtros

    // Filtros
    const [filters, setFilters] = useState({
        dateFrom: "",
        dateTo: "",
        seasonId: "",
        gameType: "",
        locationId: "",
    });
    const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

    // Estado para filtros en mobile (modal)
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [tempFilters, setTempFilters] = useState(filters);
    const [tempPlayers, setTempPlayers] = useState<Player[]>([]);

    // Paginación y scroll infinito
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalGames, setTotalGames] = useState(0);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Refs anti-carrera
    const initRef = useRef(false);
    const reqSeqRef = useRef(0);
    const isLoadingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const pageRef = useRef(1);

    useEffect(() => { isLoadingRef.current = isLoadingMore; }, [isLoadingMore]);
    useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
    useEffect(() => { pageRef.current = page; }, [page]);

    // Cargar datos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [seasonsData, locationsData] = await Promise.all([
                    publicService.getSeasons(),
                    publicService.getLocations?.() || Promise.resolve([])
                    // Deshabilitar temporalmente date-range para evitar sobrecarga
                    // fetch('/api/games/date-range')
                ]);

                // Validar que seasonsData sea un array
                if (Array.isArray(seasonsData)) {
                    setSeasons(seasonsData as Season[]);
                } else {
                    console.error('Seasons data is not an array:', seasonsData);
                    setSeasons([]);
                }

                // Validar que locationsData sea un array
                if (Array.isArray(locationsData)) {
                    setLocations(locationsData as Location[]);
                } else {
                    console.error('Locations data is not an array:', locationsData);
                    setLocations([]);
                }

                // Cargar rango de fechas - DESHABILITADO temporalmente para evitar sobrecarga
                // if (dateRangeRes.ok) {
                //     const dateRangeData = await dateRangeRes.json();
                //     setDateRange(dateRangeData.data || { firstGameDate: null, lastGameDate: null });
                // }
            } catch (error) {
                console.error('Error loading initial data:', error);
                handleError(error, t('common.loading', 'Cargar datos iniciales'));
                setSeasons([]);
                setLocations([]);
            }
        };
        loadInitialData();
    }, [publicService, handleError, t]);

    // Setear fechas por defecto (últimos 7 días para evitar cargar demasiados juegos)
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7); // Cambiar a 7 días para evitar sobrecarga

        setFilters(prev => ({
            ...prev,
            dateFrom: sevenDaysAgo.toISOString().split("T")[0],
            dateTo: today.toISOString().split("T")[0],
        }));

        // ✅ Marcar que los filtros iniciales están listos
        setFiltersReady(true);
    }, []);

    // Construir query base
    const queryBase = useMemo(() => {
        const params = new URLSearchParams();
        if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.append("dateTo", filters.dateTo);
        if (filters.seasonId) params.append("seasonId", filters.seasonId);
        if (filters.gameType) params.append("gameType", filters.gameType);
        if (filters.locationId) params.append("locationId", filters.locationId);
        if (selectedPlayers.length > 0) {
            params.append("playerIds", selectedPlayers.map(p => p.id).join(","));
        }
        return params;
    }, [filters, selectedPlayers]);

    // Función para hacer fetch de datos
    const fetchGames = useCallback(async (targetPage: number, reset = false) => {
        try {
            const params = new URLSearchParams(queryBase);
            params.append("page", targetPage.toString());
            params.append("limit", "10"); // Reducir a 10 para evitar sobrecarga inicial

            const response = await fetch(`/api/games/history?${params.toString()}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error al cargar juegos');
            }

            return data.data;
        } catch (error) {
            console.error('[History] Error:', error);
            throw error;
        }
    }, [queryBase]);

    // Carga inicial y recarga por filtros
    useEffect(() => {
        // ✅ ESPERAMOS que los filtros iniciales estén seteados
        if (!filtersReady) return;

        const loadGames = async () => {
            setGames([]);
            setHasMore(true);
            setPage(1);
            setError(null);
            setLoading(true);

            try {
                const data = await fetchGames(1, true);

                if (data) {
                    setGames(data.games || []);
                    setTotalGames(data.pagination?.total || 0);
                    setHasMore(data.pagination?.hasMore || false);
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : "Error desconocido");
            } finally {
                setLoading(false);
            }
        };

        loadGames();
    }, [fetchGames, filtersReady]); // Se ejecuta cuando los filtros están listos

    // Scroll infinito
    const loadMore = useCallback(async () => {
        if (!hasMoreRef.current || isLoadingRef.current || loading) return;

        try {
            isLoadingRef.current = true;
            setIsLoadingMore(true);

            const nextPage = pageRef.current + 1;
            const data = await fetchGames(nextPage);

            if (data) {
                setGames(prev => [...prev, ...(data.games || [])]);
                setPage(nextPage);
                pageRef.current = nextPage; // Sincronizar ref inmediatamente
                const hasMoreData = data.pagination?.hasMore || false;
                setHasMore(hasMoreData);
                hasMoreRef.current = hasMoreData; // Sincronizar ref inmediatamente
                setTotalGames(data.pagination?.total || 0);
            }
        } catch (e) {
            console.error('[History] Error loading more:', e);
            setError(e instanceof Error ? e.message : "Error al cargar más juegos");
        } finally {
            setIsLoadingMore(false);
            isLoadingRef.current = false;
        }
    }, [fetchGames, loading]);

    // Observer para scroll infinito
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: "100px" }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [loadMore]);

    // Helpers
    const clearFilters = () => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7); // Cambiar a 7 días por defecto
        const defaultFilters = {
            dateFrom: sevenDaysAgo.toISOString().split("T")[0],
            dateTo: today.toISOString().split("T")[0],
            seasonId: "",
            gameType: "",
            locationId: "",
        };

        // Actualizar tanto los filtros principales como los temporales del modal
        setFilters(defaultFilters);
        setTempFilters(defaultFilters);
        setSelectedPlayers([]);
        setTempPlayers([]);

        // Resetear paginación para que se dispare la recarga
        setPage(1);
        setHasMore(true);
        pageRef.current = 1;
        hasMoreRef.current = true;
    };

    const setFilter = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const exportCSV = () => {
        const headers = ["ID", "Fecha", "Tipo", "Ubicación", "Temporada", "Jugadores", "Puntajes"];
        const rows = games.map(game => {
            const players = game.gameResults
                .sort((a, b) => a.finalPosition - b.finalPosition)
                .map(r => `${r.finalPosition}#${r.player.nickname}(${r.finalScore})`)
                .join(" | ");

            return [
                game.id,
                formatYmdForDisplay(toYmd(game.gameDate), 'es-AR'),
                formatGameType(game.gameType),
                game.location?.name || "",
                game.season?.name || "",
                players,
                game.gameResults.map(r => r.finalScore).join(", ")
            ];
        });

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `historial-juegos-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={styles.historyPage}>
            {/* Hero */}
            <PageHeader
                icon={HistoryIcon}
                title={t('history.title', 'Historial de Juegos')}
                subtitle={t('history.subtitle', 'Explorá y filtrá partidas almacenadas en la base de datos')}
                variant="default"
            />

            {/* Contenido */}
            <div className={styles.content}>
                <div className={styles.contentSpace}>
                    {/* Filtros: Desktop (barra compacta) */}
                    <div className="sticky top-16 z-30 mb-4 hidden md:block">
                        <div className="rounded-xl border bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 overflow-x-auto pr-2 min-w-0">
                                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs shrink-0">
                                        <Calendar className="h-3 w-3" />
                                        {filters.dateFrom || "—"} → {filters.dateTo || "—"}
                                    </span>
                                    {filters.seasonId && (
                                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs shrink-0">
                                            <Trophy className="h-3 w-3" />
                                            Temporada #{filters.seasonId}
                                        </span>
                                    )}
                                    {filters.gameType && (
                                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs shrink-0">
                                            <span className="h-2 w-2 rounded-full bg-purple-500" />
                                            {GAME_TYPE_OPTIONS.find(o => o.value === filters.gameType)?.label ?? filters.gameType}
                                        </span>
                                    )}
                                    {filters.locationId && (
                                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs shrink-0">
                                            <MapPin className="h-3 w-3" />
                                            ID {filters.locationId}
                                        </span>
                                    )}
                                    {selectedPlayers.length > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs shrink-0">
                                            <Users className="h-3 w-3" />
                                            {selectedPlayers.length} jugador{selectedPlayers.length > 1 ? 'es' : ''}
                                        </span>
                                    )}
                                </div>
                                <div className="ml-auto flex items-center gap-2 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { setTempFilters(filters); setTempPlayers(selectedPlayers); setIsMobileFiltersOpen(true); }}
                                        className="h-8"
                                    >
                                        <Filter className="h-4 w-4 mr-1" />
                                        {t('ui.editFilters', 'Editar filtros')}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={clearFilters} className="h-8">
                                        <RotateCcw className="h-4 w-4 mr-1" />
                                        {t('ui.clear', 'Limpiar')}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={exportCSV} className="h-8">
                                        <Download className="h-4 w-4 mr-1" />
                                        {t('ui.exportCSV', 'Exportar CSV')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filtros: Mobile (botón + modal) */}
                    <div className="md:hidden mb-4 flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setTempFilters(filters);
                                setTempPlayers(selectedPlayers);
                                setIsMobileFiltersOpen(true);
                            }}
                            className="flex items-center gap-2"
                        >
                            <Filter className="h-4 w-4" /> {t('ui.filters', 'Filtros')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportCSV} className="flex items-center gap-2">
                            <Download className="h-4 w-4" /> {t('ui.exportCSV', 'Exportar CSV')}
                        </Button>
                    </div>

                    <Dialog open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
                        <DialogContent className="w-[95vw] sm:max-w-[720px] p-0">
                            <DialogHeader className="px-5 pt-5 pb-2">
                                <DialogTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" /> {t('ui.searchFilters', 'Filtros de Búsqueda')}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="px-5 pb-4 space-y-4">
                                {/* Presets */}
                                <div>
                                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">{t('ui.period', 'Período')}</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: t('ui.all', 'Todas'), days: "all" },
                                            { label: t('ui.today', 'Hoy'), days: 0 },
                                            { label: t('ui.days7', '7 días'), days: 7 },
                                            { label: t('ui.days30', '30 días'), days: 30 },
                                            { label: t('ui.currentYear', 'Año actual'), days: "year" }
                                        ].map((preset) => (
                                            <Button
                                                key={preset.label}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const today = new Date();
                                                    let fromDate = new Date();
                                                    let toDate = today;

                                                    if (preset.days === "all") {
                                                        // Usar rango amplio sin consultar BD para evitar sobrecarga
                                                        fromDate = new Date('2014-01-01'); // Fecha estimada del primer juego
                                                        toDate = today;
                                                    } else if (preset.days === "year") {
                                                        fromDate = new Date(today.getFullYear(), 0, 1);
                                                    } else {
                                                        fromDate.setDate(today.getDate() - (preset.days as number));
                                                    }
                                                    setTempFilters(prev => ({
                                                        ...prev,
                                                        dateFrom: fromDate.toISOString().split('T')[0],
                                                        dateTo: toDate.toISOString().split('T')[0]
                                                    }));
                                                }}
                                                className="h-7 px-2 text-xs"
                                            >
                                                {preset.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Fechas */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="m-dateFrom">{t('ui.from', 'Desde')}</Label>
                                        <Input id="m-dateFrom" type="date" value={tempFilters.dateFrom} onChange={(e) => setTempFilters(prev => ({ ...prev, dateFrom: e.target.value }))} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="m-dateTo">{t('ui.to', 'Hasta')}</Label>
                                        <Input id="m-dateTo" type="date" value={tempFilters.dateTo} onChange={(e) => setTempFilters(prev => ({ ...prev, dateTo: e.target.value }))} className="mt-1" />
                                    </div>
                                </div>

                                {/* Contexto */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    <div>
                                        <Label htmlFor="m-season">{t('navigation.seasons', 'Temporada')}</Label>
                                        <Select value={tempFilters.seasonId} onValueChange={(v) => setTempFilters(prev => ({ ...prev, seasonId: v }))}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder={t('ui.allSeasons', 'Todas las temporadas')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">{t('ui.allSeasons', 'Todas las temporadas')}</SelectItem>
                                                {Array.isArray(seasons) && seasons.map((s) => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>
                                                        {s.name} {s.isActive && `(${t('ui.active', 'Activa')})`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="m-gameType">{t('game.type', 'Tipo de Juego')}</Label>
                                        <Select value={tempFilters.gameType} onValueChange={(v) => setTempFilters(prev => ({ ...prev, gameType: v }))}>
                                            <SelectTrigger className="mt-1">
                                                <span>
                                                    {tempFilters.gameType ? GAME_TYPE_OPTIONS.find(opt => opt.value === tempFilters.gameType)?.label || t('ui.allGameTypes', 'Todos los tipos') : t('ui.allGameTypes', 'Todos los tipos')}
                                                </span>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {GAME_TYPE_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="sm:col-span-2 md:col-span-1">
                                        <Label htmlFor="m-location">{t('game.location', 'Ubicación')}</Label>
                                        <Select value={tempFilters.locationId} onValueChange={(v) => setTempFilters(prev => ({ ...prev, locationId: v }))}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder={t('ui.allLocations', 'Todas las ubicaciones')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">{t('ui.allLocations', 'Todas las ubicaciones')}</SelectItem>
                                                {Array.isArray(locations) && locations.map((l) => (
                                                    <SelectItem key={l.id} value={l.id.toString()}>
                                                        {l.name} - {l.city}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Avanzados */}
                                <div className="pt-2">
                                    <Label>{t('ui.players', 'Jugadores')}</Label>
                                    <PlayerMultiAutocomplete selected={tempPlayers} onChange={setTempPlayers} placeholder={t('ui.searchPlayers', 'Buscar y añadir jugadores...')} />
                                </div>
                            </div>
                            <DialogFooter className="px-5 pb-5">
                                <div className="flex w-full justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsMobileFiltersOpen(false);
                                        }}
                                    >
                                        {t('ui.cancel', 'Cancelar')}
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                clearFilters();
                                            }}
                                        >
                                            {t('ui.clear', 'Limpiar')}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setFilters(tempFilters);
                                                setSelectedPlayers(tempPlayers);
                                                setIsMobileFiltersOpen(false);
                                            }}
                                        >
                                            {t('ui.accept', 'Aceptar')}
                                        </Button>
                                    </div>
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Resultados */}
                    <SectionTitle
                        title={`${t('history.results', 'Resultados')} (${totalGames} ${t('history.games', 'juegos')})`}
                        variant="history"
                    />
                    {loading && <CardListSkeleton count={5} />}

                    {error && (
                        <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
                            <CardContent className="pt-6">
                                <div className="text-red-600 dark:text-red-400">{error}</div>
                            </CardContent>
                        </Card>
                    )}

                    {games.length === 0 && !loading ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <div className="text-gray-500 dark:text-gray-400">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium mb-2">{t('ui.noGamesFound', 'No se encontraron juegos')}</h3>
                                    <p className="text-sm">{t('ui.adjustFilters', 'Intenta ajustar los filtros de búsqueda')}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {games.map((game) => (
                                <Card key={game.id} className={`${unifiedStyles.card} hover:border-blue-300 dark:hover:border-blue-600`}>
                                    <CardHeader className="pb-3">
                                        <div className="grid items-center gap-2 md:grid-cols-[1fr_auto]">
                                            {/* Izquierda: id + fecha + nro del día */}
                                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg min-w-0">
                                                <span className="text-muted-foreground text-sm shrink-0">#{game.id}</span>
                                                <span className="text-sm shrink-0">
                                                    {game.gameDate ? formatYmdForDisplay(toYmd(game.gameDate), 'es-AR') : "Sin fecha"}
                                                </span>
                                                {game.extraData?.nroJuegoDia && (
                                                    <Badge variant="outline" className="text-xs px-2 py-1 shrink-0">{t('ui.game', 'Juego')} #{game.extraData.nroJuegoDia}</Badge>
                                                )}
                                            </CardTitle>

                                            {/* Derecha: badges */}
                                            <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end">
                                                {game.location && (
                                                    <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-1 shrink-0">
                                                        <MapPin className="h-3 w-3" />
                                                        {game.location.name}
                                                    </Badge>
                                                )}
                                                <Badge
                                                    variant={game.gameType === "HANCHAN" ? "default" : "secondary"}
                                                    className={`text-xs px-2 py-1 shrink-0 ${game.gameType === "HANCHAN" ? "bg-blue-500" : "bg-purple-500"}`}
                                                >
                                                    {formatGameType(game.gameType)}
                                                </Badge>
                                                {game.season && (
                                                    <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-1 max-w-[220px] sm:max-w-[320px]">
                                                        <Trophy className="h-3 w-3" />
                                                        <span className="truncate">{game.season.name}</span>
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-3">
                                        <div className="divide-y divide-gray-200/60 dark:divide-gray-700/60">
                                            {game.gameResults
                                                .sort((a, b) => a.finalPosition - b.finalPosition)
                                                .map((result) => (
                                                    <div
                                                        key={result.id}
                                                        className="grid items-center gap-3 rounded-xl p-3 bg-transparent hover:bg-white/5 dark:hover:bg-white/5 grid-cols-[36px_1fr_9ch] sm:grid-cols-[40px_1fr_10ch]"
                                                    >
                                                        {/* Posición */}
                                                        <div
                                                            className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base ${result.finalPosition === 1
                                                                ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600"
                                                                : result.finalPosition === 2
                                                                    ? "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500"
                                                                    : result.finalPosition === 3
                                                                        ? "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600"
                                                                        : "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600"
                                                                }`}
                                                        >
                                                            {result.finalPosition}
                                                        </div>

                                                        {/* Nombre */}
                                                        <div className="min-w-0">
                                                            <div className="text-[15px] font-medium text-white leading-tight break-words sm:truncate overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] sm:[display:block]" title={result.player.nickname}>
                                                                {result.player.nickname}
                                                                <span className="text-slate-400 ml-1 hidden sm:inline">(L{result.player.playerNumber})</span>
                                                            </div>
                                                            <div className="text-xs text-slate-400 leading-snug">
                                                                <span className="sm:hidden">L{result.player.playerNumber}</span>
                                                                {result.player.fullname && <span className="hidden sm:inline">{result.player.fullname}</span>}
                                                            </div>
                                                        </div>

                                                        {/* Score (columna fija a la derecha) */}
                                                        <div className="text-right">
                                                            <div className="font-mono tabular-nums text-lg sm:text-xl font-bold text-white whitespace-nowrap">
                                                                {Number(result.finalScore) > 0 ? "+" : ""}{Number(result.finalScore).toFixed(1)}
                                                            </div>
                                                        </div>

                                                        {/* Deltas: en XS ocupa todo el ancho; en SM lo dejamos debajo */}
                                                        <div className="col-span-3 sm:col-span-3 mt-1">
                                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                                                <div className="flex items-center gap-3">
                                                                    {Number(result.danPointsEarned) !== 0 && (
                                                                        <span className={`${Number(result.danPointsEarned) > 0 ? "text-green-400" : "text-red-400"} font-medium`}>
                                                                            Dan {Number(result.danPointsEarned) > 0 ? "+" : ""}{Number(result.danPointsEarned)}
                                                                        </span>
                                                                    )}
                                                                    {Number(result.rateChange) !== 0 && (
                                                                        <span className={`${Number(result.rateChange) > 0 ? "text-green-400" : "text-red-400"} font-medium`}>
                                                                            Rate {Number(result.rateChange) > 0 ? "+" : ""}{Number(result.rateChange).toFixed(1)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Scroll infinito */}
                            {hasMore && (
                                <div ref={loadMoreRef} className="flex justify-center py-8">
                                    {isLoadingMore ? (
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <LoadingOverlay size="sm" fullScreen={false} />
                                            {t('ui.loadingMore', 'Cargando más juegos...')}
                                        </div>
                                    ) : (
                                        <div className="text-gray-400 text-sm">{t('ui.scrollToLoadMore', 'Desplázate hacia abajo para cargar más')}</div>
                                    )}
                                </div>
                            )}

                            {!hasMore && games.length > 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-sm">{t('ui.endOfHistory', 'Has llegado al final del historial')}</div>
                                    <div className="text-xs mt-1">{t('ui.showing', 'Mostrando')} {games.length} {t('ui.of', 'de')} {totalGames} {t('ui.games', 'juegos')}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
