'use client';

import { useI18nContext } from '@/components/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { unifiedStyles } from '@/components/ui/unified-styles';
import { useEffect, useState } from 'react';

interface GamePlayer {
    name: string;
    position: number;
    finalScore: number;
}

interface ChartDataPoint {
    danPoints: number;
    ratePoints: number;
    position: number;
    seasonPoints: number;
    gameDate: string;
    gameId?: number;              // ← puede venir vacío en eventos de torneo
    danVariation: number;
    rateVariation: number;
    seasonVariation: number;      // > 0 / < 0 para juego o torneo
    finalPosition?: number;
    createdAt?: string;
    tournamentId?: number;        // ← identifica puntos de torneo
    tournamentName?: string;      // ← opcional para tooltip
    sanma?: boolean;              // ← para filtrar por 4p/3p
    extraData?: any;
    players?: GamePlayer[];
}

interface HistoricalChartProps {
    chartData: ChartDataPoint[];
    seasonData?: ChartDataPoint[];
    isSanma?: boolean;
    chartType?: 'dan' | 'rate' | 'position' | 'season';
    onChartTypeChange?: (type: 'dan' | 'rate' | 'position' | 'season') => void;
    className?: string;
    danConfigs?: Array<{ rank: string; color: string; minPoints: number; maxPoints: number }>;
}

export function HistoricalChart({ chartData, seasonData = [], isSanma = false, chartType: externalChartType, onChartTypeChange, className, danConfigs = [] }: HistoricalChartProps) {
    const { t } = useI18nContext();
    const [internalChartType, setInternalChartType] = useState<'dan' | 'rate' | 'position' | 'season'>('dan');

    // Usar chartType externo si está disponible, sino usar el interno
    const chartType = externalChartType ?? internalChartType;
    const setChartType = onChartTypeChange ?? setInternalChartType;
    // Mantener estado inicial estable para SSR/CSR; ajustar en efecto
    const [gameCount, setGameCount] = useState<10 | 20 | 50>(20);
    const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; data: ChartDataPoint | null }>({
        visible: false,
        x: 0,
        y: 0,
        data: null
    });

    // Estado para zoom del gráfico (solo en mobile)
    const [chartZoom, setChartZoom] = useState(1);
    const [isMobile, setIsMobile] = useState(false);

    // Detectar si es mobile y ajustar gameCount luego de hidratar
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            setGameCount(window.innerWidth < 640 ? 10 : 20);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // En "season", usamos seasonData separado que incluye eventos de torneo
    let dataToFilter = chartData;
    if (chartType === 'season') {
        dataToFilter = seasonData;
    }

    // Filtrar por sanma (4p/3p) según la selección del usuario
    const filteredBySanma = dataToFilter.filter(point => point.sanma === isSanma);

    // Los datos ya vienen ordenados correctamente de la base de datos
    // Para DAN y RATE y POSITION hacer reverse para mostrar cronológicamente (más antiguos a la izquierda)
    // Para SEASON mantener el orden original (más recientes a la izquierda)
    const sortedData = (chartType === 'dan' || chartType === 'rate' || chartType === 'position')
        ? [...filteredBySanma].reverse()
        : filteredBySanma;

    // En "season" el selector "Últimos N" debe aplicar a la lista combinada (juegos+torneos)
    const filteredData = sortedData.slice(-gameCount);

    const handleMouseEnter = (event: React.MouseEvent, point: ChartDataPoint) => {
        if ((event.target as SVGElement).tagName.toLowerCase() === 'circle') {
            setTooltip({
                visible: true,
                x: event.clientX,
                y: event.clientY - 10,
                data: point
            });
        }
    };

    const handleMouseLeave = () => {
        setTooltip({ visible: false, x: 0, y: 0, data: null });
    };

    const renderNoDataMessage = () => (
        <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <div>
                <div className="text-4xl mb-4">📊</div>
                <div className="font-medium text-lg mb-2">No hay datos para mostrar</div>
                <div className="text-sm">
                    No hay datos de {isSanma ? '3' : '4'} jugadores para el tipo de gráfico seleccionado
                </div>
            </div>
        </div>
    );

    const renderChart = () => {
        if (filteredData.length === 0) return null;

        const width = 1000;
        const height = 300;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        const values = filteredData.map(d => {
            switch (chartType) {
                case 'dan': return d.danPoints;
                case 'rate': return d.ratePoints;
                case 'position': return d.position;
                case 'season': return d.seasonPoints;
                default: return d.danPoints;
            }
        });

        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        // Evitar rango 0 (todos iguales)
        const valueRange = Math.max(1, maxValue - minValue);
        const adjustedMin = minValue - valueRange * 0.1;
        const adjustedMax = maxValue + valueRange * 0.1;
        const adjustedRange = adjustedMax - adjustedMin;

        const calculateCleanTicks = (min: number, max: number, targetTicks: number = 5) => {
            const range = Math.max(1, max - min);
            const rawStep = range / (targetTicks - 1);
            const possibleSteps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
            const bestStep = possibleSteps.find(s => s >= rawStep) ?? possibleSteps[possibleSteps.length - 1];

            const ticks: number[] = [];
            const startTick = Math.floor(min / bestStep) * bestStep;
            const endTick = Math.ceil(max / bestStep) * bestStep;
            for (let tick = startTick; tick <= endTick; tick += bestStep) {
                if (tick >= min && tick <= max) ticks.push(tick);
            }
            return ticks;
        };

        const yTicks = calculateCleanTicks(adjustedMin, adjustedMax);

        // ✅ Helper para convertir valor->y según el tipo de gráfico
        const yScale = (val: number) => {
            const t = (val - adjustedMin) / adjustedRange; // 0..1
            if (chartType === 'position') {
                // 1 (mínimo) arriba; máximos abajo
                return padding + t * chartHeight;
            }
            // dan / rate / season: valores altos arriba
            return padding + chartHeight - t * chartHeight;
        };

        const points = filteredData.map((d, index) => {
            const x = padding + (index / Math.max(1, filteredData.length - 1)) * chartWidth;
            const value =
                chartType === 'dan' ? d.danPoints :
                    chartType === 'rate' ? d.ratePoints :
                        chartType === 'position' ? d.position :
                            d.seasonPoints;

            return { x, y: yScale(value), data: d };
        });

        const pathData = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');

        const danReferenceLines = chartType === 'dan' && danConfigs.length > 0 ? (
            <>
                {(() => {
                    const currentDan = filteredData.at(-1)?.danPoints ?? 0;
                    const nearest = [...danConfigs]
                        .map(cfg => ({ ...cfg, __dist: Math.abs(cfg.minPoints - currentDan) }))
                        .sort((a, b) => a.__dist - b.__dist)
                        .slice(0, 3)
                        .filter(config => config.minPoints >= adjustedMin && config.minPoints <= adjustedMax);
                    return nearest.map((config) => (
                        <g key={`dan-${config.minPoints}`}>
                            <line
                                x1={padding}
                                y1={yScale(config.minPoints)}
                                x2={width - padding}
                                y2={yScale(config.minPoints)}
                                stroke={config.color}
                                strokeWidth="2"
                                strokeDasharray="5 5"
                                opacity={0.7}
                            />
                            <text
                                x={width - padding - 8}
                                y={yScale(config.minPoints)}
                                textAnchor="end"
                                dominantBaseline="central"
                                fontSize="11"
                                fill={config.color}
                                fontWeight="bold"
                            >
                                <title>{t(`ranks.${config.rank}`, config.rank)}</title>
                                {config.rank}
                            </text>
                        </g>
                    ));
                })()}
            </>
        ) : null;

        return (
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {danReferenceLines}

                <path
                    d={pathData}
                    fill="none"
                    stroke={chartType === 'dan' ? '#8b5cf6' : chartType === 'rate' ? '#f97316' : chartType === 'position' ? '#10b981' : '#f59e0b'}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {points.map((pt, idx) => (
                    <g key={idx}>
                        <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="5"
                            fill={
                                chartType === 'season'
                                    ? '#F59E0B' // mismo color de línea para season
                                    : chartType === 'dan' ? '#8B5CF6'
                                        : chartType === 'rate' ? '#F97316'
                                            : chartType === 'position' ? '#10B981'
                                                : '#EF4444'
                            }
                            stroke="white"
                            strokeWidth="3"
                            className="hover:r-7 transition-all duration-200 cursor-pointer"
                            style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }}
                            onMouseEnter={(e) => handleMouseEnter(e, pt.data)}
                            onMouseLeave={handleMouseLeave}
                        />
                        <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="12"
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={(e) => handleMouseEnter(e, pt.data)}
                            onMouseLeave={handleMouseLeave}
                        />
                    </g>
                ))}

                {/* Ejes */}
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#374151" strokeWidth="2" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#374151" strokeWidth="2" />

                {/* Líneas horizontales de cuadrícula */}
                {yTicks.map((value, index) => (
                    <line
                        key={index}
                        x1={padding}
                        y1={yScale(value)}
                        x2={width - padding}
                        y2={yScale(value)}
                        stroke="#374151"
                        strokeWidth="1"
                        opacity="0.3"
                    />
                ))}


                {/* Ticks Y */}
                {yTicks.map((value, index) => (
                    <text
                        key={index}
                        x={padding - 10}
                        y={yScale(value) + 5}
                        textAnchor="end"
                        className="text-xs fill-gray-600 dark:fill-gray-400"
                    >
                        {Math.round(value)}
                    </text>
                ))}

                {/* Ticks X */}
                {points.filter((_, idx) => idx % Math.ceil(filteredData.length / 5) === 0).map((pt, idx) => {
                    const dataIndex = points.indexOf(pt);
                    const date = new Date(filteredData[dataIndex].gameDate);
                    const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
                    return (
                        <text
                            key={idx}
                            x={pt.x}
                            y={height - padding + 20}
                            textAnchor="middle"
                            className="text-xs fill-gray-600 dark:fill-gray-400"
                        >
                            {dateStr}
                        </text>
                    );
                })}
            </svg>
        );
    };

    if (chartData.length === 0) {
        return (
            <Card className={`p-6 ${className}`}>
                <div className="text-center text-gray-500 dark:text-gray-400">
                    {t('player.profilePage.noDataAvailable')}
                </div>
            </Card>
        );
    }

    return (
        <Card className={`p-6 ${className}`}>
            <div className="space-y-6">
                <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100" id="historical-chart-title">
                        <span aria-hidden="true">📈</span>
                        <span className="sr-only">Gráfico de evolución histórica:</span>
                        {t('player.profilePage.historicalEvolution')}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                        {filteredData.length > 0
                            ? `Mostrando últimos ${Math.min(filteredData.length, gameCount)} registros`
                            : 'No hay datos para el tipo de gráfico seleccionado'
                        }
                    </p>
                </div>

                {/* Controles - Responsive */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4" role="toolbar" aria-label="Controles del gráfico histórico">
                    {/* Botones de tipo - Responsive: 2x2 en móvil, línea en desktop */}
                    <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto" role="group" aria-label="Tipo de datos">
                        <Button
                            className={`${unifiedStyles.secondaryButton} ${chartType === 'dan' ? 'ring-2 ring-blue-500' : ''} text-xs sm:text-sm px-2 sm:px-3`}
                            size="sm"
                            onClick={() => setChartType('dan')}
                            aria-pressed={chartType === 'dan'}
                        >
                            Dan Points
                        </Button>
                        <Button
                            className={`${unifiedStyles.secondaryButton} ${chartType === 'rate' ? 'ring-2 ring-blue-500' : ''} text-xs sm:text-sm px-2 sm:px-3`}
                            size="sm"
                            onClick={() => setChartType('rate')}
                            aria-pressed={chartType === 'rate'}
                        >
                            Rate Points
                        </Button>
                        <Button
                            className={`${unifiedStyles.secondaryButton} ${chartType === 'position' ? 'ring-2 ring-blue-500' : ''} text-xs sm:text-sm px-2 sm:px-3`}
                            size="sm"
                            onClick={() => setChartType('position')}
                            aria-pressed={chartType === 'position'}
                        >
                            {t('player.profilePage.position')}
                        </Button>
                        <Button
                            className={`${unifiedStyles.secondaryButton} ${chartType === 'season' ? 'ring-2 ring-blue-500' : ''} text-xs sm:text-sm px-2 sm:px-3`}
                            size="sm"
                            onClick={() => setChartType('season')}
                            aria-pressed={chartType === 'season'}
                        >
                            Puntos Temporada
                        </Button>
                    </div>

                    {/* Selector de cantidad - Más compacto en móvil */}
                    <Select value={gameCount.toString()} onValueChange={(v) => setGameCount(parseInt(v) as any)}>
                        <SelectTrigger className={`${unifiedStyles.selectTrigger} w-full sm:w-32`} aria-label="Número de registros a mostrar">
                            <span className="text-xs sm:text-sm">Últimos {gameCount}</span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">Últimos 10</SelectItem>
                            <SelectItem value="20">Últimos 20</SelectItem>
                            <SelectItem value="50">Últimos 50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Controles de zoom para mobile */}
                {isMobile && filteredData.length > 0 && (
                    <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setChartZoom(Math.max(0.5, chartZoom - 0.25))}
                            disabled={chartZoom <= 0.5}
                        >
                            🔍-
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
                            {Math.round(chartZoom * 100)}%
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setChartZoom(Math.min(3, chartZoom + 0.25))}
                            disabled={chartZoom >= 3}
                        >
                            🔍+
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setChartZoom(1)}
                        >
                            Reset
                        </Button>
                    </div>
                )}

                {/* Chart - Responsive height con scroll horizontal en mobile */}
                <div
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2 sm:p-4 relative"
                    role="img"
                    aria-label={`Gráfico de evolución histórica de ${chartType === 'dan' ? 'puntos Dan' :
                        chartType === 'rate' ? 'puntos Rate' :
                            chartType === 'position' ? 'posición promedio' :
                                'puntos de temporada'
                        }. Mostrando los últimos ${gameCount} registros.`}
                    onMouseLeave={handleMouseLeave}
                >
                    <div
                        className={`h-64 sm:h-80 w-full ${isMobile ? 'overflow-x-auto overflow-y-hidden' : 'min-w-0'}`}
                        style={{
                            touchAction: isMobile ? 'pan-x pan-y' : 'auto'
                        }}
                    >
                        <div
                            style={{
                                width: isMobile ? `${chartZoom * 100}%` : '100%',
                                height: '100%',
                                minWidth: isMobile ? '100%' : 'auto'
                            }}
                        >
                            {filteredData.length > 0 ? renderChart() : renderNoDataMessage()}
                        </div>
                    </div>

                    {/* Instrucciones para mobile */}
                    {isMobile && filteredData.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                            💡 Usa los botones de zoom arriba o desliza horizontalmente para navegar
                        </div>
                    )}

                    {/* Tooltip */}
                    {tooltip.visible && tooltip.data && (
                        <div
                            className="fixed z-50 bg-gray-900 dark:bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-700 max-w-sm"
                            style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px`, transform: 'translate(-50%, -100%)' }}
                        >
                            <div className="text-sm font-semibold mb-2">
                                {tooltip.data.tournamentId
                                    ? `🏆 Torneo${tooltip.data.tournamentName ? `: ${tooltip.data.tournamentName}` : ''} – ${tooltip.data.gameDate}`
                                    : `🎮 Juego${tooltip.data.gameId ? ` #${tooltip.data.gameId}` : ''} – ${tooltip.data.gameDate}`}
                            </div>

                            <div className="text-xs space-y-1">
                                {tooltip.data.players && tooltip.data.players.length > 0 && (
                                    <>
                                        <div className="font-medium text-blue-300">
                                            {tooltip.data.tournamentId ? '🏆 Resultados del torneo:' : '🎮 Resultados del juego:'}
                                        </div>
                                        {tooltip.data.tournamentId && (
                                            <div className="text-xs text-gray-400 mb-1">
                                                Top 3 + tu posición
                                            </div>
                                        )}
                                        {(() => {
                                            if (!tooltip.data.players) return null;

                                            const sortedPlayers = tooltip.data.players.sort((a, b) => a.position - b.position);

                                            // Para torneos, mostrar solo Top 3 + posición del jugador actual
                                            if (tooltip.data.tournamentId) {
                                                const top3 = sortedPlayers.slice(0, 3);
                                                const currentPlayerPosition = tooltip.data.position;

                                                // Si el jugador actual está fuera del top 3, lo agregamos
                                                let playersToShow = [...top3];
                                                if (currentPlayerPosition && currentPlayerPosition > 3) {
                                                    const currentPlayer = sortedPlayers.find(p => p.position === currentPlayerPosition);
                                                    if (currentPlayer) {
                                                        playersToShow.push(currentPlayer);
                                                    }
                                                }

                                                return playersToShow.map((p, i) => {
                                                    // Mostrar "..." entre el top 3 y la posición del jugador si hay gap
                                                    const showDots = i === 3 && p.position > 4;
                                                    // Resaltar la posición del jugador actual
                                                    const isCurrentPlayer = p.position === currentPlayerPosition;
                                                    return (
                                                        <div key={i}>
                                                            {showDots && (
                                                                <div className="flex justify-center text-gray-500">
                                                                    <span>...</span>
                                                                </div>
                                                            )}
                                                            <div className={`flex justify-between ${isCurrentPlayer ? 'bg-blue-800/30 px-1 rounded' : ''}`}>
                                                                <span>
                                                                    {p.position}° {p.name}
                                                                    {isCurrentPlayer && <span className="text-blue-300 ml-1">←</span>}
                                                                </span>
                                                                <span className={p.finalScore >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                                    {p.finalScore >= 0 ? '+' : ''}{p.finalScore}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            } else {
                                                // Para juegos normales (4 jugadores), mostrar todos
                                                return sortedPlayers.map((p, i) => (
                                                    <div key={i} className="flex justify-between">
                                                        <span>{p.position}° {p.name}</span>
                                                        <span className={p.finalScore >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                            {p.finalScore >= 0 ? '+' : ''}{p.finalScore}
                                                        </span>
                                                    </div>
                                                ));
                                            }
                                        })()}
                                    </>
                                )}

                                <div className="border-t border-gray-600 pt-1 mt-2">
                                    <div className="text-blue-300">📊 Puntos actuales:</div>

                                    {chartType === 'dan' && (
                                        <div className="font-medium">
                                            Dan: {Math.round(tooltip.data.danPoints)}
                                            <span className="text-sm text-gray-400 ml-1">
                                                ({tooltip.data.danVariation >= 0 ? '+' : ''}{tooltip.data.danVariation.toFixed(1)})
                                            </span>
                                        </div>
                                    )}

                                    {chartType === 'rate' && (
                                        <div className="font-medium">
                                            Rate: {Math.round(tooltip.data.ratePoints)}
                                            <span className="text-sm text-gray-400 ml-1">
                                                ({tooltip.data.rateVariation >= 0 ? '+' : ''}{tooltip.data.rateVariation.toFixed(1)})
                                            </span>
                                        </div>
                                    )}

                                    {chartType === 'season' && (
                                        <div className="font-medium">
                                            Season: {Math.round(tooltip.data.seasonPoints)}
                                            <span className="text-sm text-gray-400 ml-1">
                                                ({tooltip.data.seasonVariation >= 0 ? '+' : ''}{tooltip.data.seasonVariation.toFixed(1)})
                                            </span>

                                            {tooltip.data.tournamentId && (
                                                <div className="mt-2 p-2 bg-blue-900/30 rounded border border-blue-600">
                                                    <div className="text-blue-300 font-medium">🏆 Puntos de Torneo</div>
                                                    <div className="text-xs text-gray-300">
                                                        {tooltip.data.tournamentName ?? 'Torneo'}
                                                    </div>
                                                    <div className="text-xs text-gray-300">
                                                        Posición: {tooltip.data.position}°
                                                    </div>
                                                    <div className="text-xs text-gray-300">
                                                        Puntos ganados: {tooltip.data.seasonVariation}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {chartType === 'position' && (
                                        <>
                                            <div className="font-medium">
                                                Dan: {Math.round(tooltip.data.danPoints)}
                                                <span className="text-sm text-gray-400 ml-1">
                                                    ({tooltip.data.danVariation >= 0 ? '+' : ''}{tooltip.data.danVariation.toFixed(1)})
                                                </span>
                                            </div>
                                            <div className="font-medium">
                                                Rate: {Math.round(tooltip.data.ratePoints)}
                                                <span className="text-sm text-gray-400 ml-1">
                                                    ({tooltip.data.rateVariation >= 0 ? '+' : ''}{tooltip.data.rateVariation.toFixed(1)})
                                                </span>
                                            </div>
                                            <div className="font-medium">
                                                Season: {Math.round(tooltip.data.seasonPoints)}
                                                <span className="text-sm text-gray-400 ml-1">
                                                    ({tooltip.data.seasonVariation >= 0 ? '+' : ''}{tooltip.data.seasonVariation.toFixed(1)})
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
