'use client';

import { useI18nContext } from '@/components/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { unifiedStyles } from '@/components/ui/unified-styles';
import { fmtInt, fmtPct1, POSITION_COLORS } from '@/lib/format-utils';
import { useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

interface PositionStats {
    total: number;
    avgPosition: number;
    first: number;
    second: number;
    third: number;
    fourth: number;
    firstPercent: number;
    secondPercent: number;
    thirdPercent: number;
    fourthPercent: number;
    rentaiRate: number;
}

interface SeasonPositionStats {
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
}

interface PositionDistributionChartProps {
    stats: PositionStats;
    seasonStats?: SeasonPositionStats | null;
    isSanma?: boolean; // true = 3 jugadores, false = 4 jugadores
    className?: string;
    onBarClick?: (position: string) => void;
    selectedPosition?: string | null;
}

type ViewMode = 'auto' | 'full';
type DataMode = 'general' | 'season';

/** Label renderer que evita comparar floats y siempre toma el payload correcto */
const BarRightLabel = (props: any) => {
    const { x, y, width, height, value, payload } = props;
    const pct = fmtPct1(Number(value ?? 0));
    const textX = (x ?? 0) + (width ?? 0) + 6;
    const textY = (y ?? 0) + (height ?? 0) / 2 + 4;
    return (
        <text
            x={textX}
            y={textY}
            textAnchor="start"
            style={{ fontSize: 12, fontWeight: 500 }}
            fill="currentColor"
        >
            {pct}
        </text>
    );
};

export function PositionDistributionChart({
    stats,
    seasonStats,
    isSanma = false,
    className,
    onBarClick,
    selectedPosition,
}: PositionDistributionChartProps) {
    const { t } = useI18nContext();
    const [viewMode, setViewMode] = useState<ViewMode>('auto');
    const [dataMode, setDataMode] = useState<DataMode>('general');

    // Función para calcular estadísticas de temporada agregadas
    const getSeasonStats = useMemo(() => {
        if (!seasonStats) return null;

        const first = seasonStats.seasonFirstPlaceH + seasonStats.seasonFirstPlaceT;
        const second = seasonStats.seasonSecondPlaceH + seasonStats.seasonSecondPlaceT;
        const third = seasonStats.seasonThirdPlaceH + seasonStats.seasonThirdPlaceT;
        const fourth = seasonStats.seasonFourthPlaceH + seasonStats.seasonFourthPlaceT;
        const total = seasonStats.seasonTotalGames;

        if (total === 0) return null;

        return {
            total,
            avgPosition: seasonStats.seasonAveragePosition,
            first,
            second,
            third,
            fourth,
            firstPercent: (first / total) * 100,
            secondPercent: (second / total) * 100,
            thirdPercent: (third / total) * 100,
            fourthPercent: (fourth / total) * 100,
            rentaiRate: ((first + second) / total) * 100
        };
    }, [seasonStats]);

    // Usar datos de temporada o generales según el modo
    const currentStats = dataMode === 'season' ? getSeasonStats : stats;

    const data = useMemo(
        () => {
            if (!currentStats) return [];

            const positions: Array<{ label: string; value: number; pct: number; color: string }> = [
                { label: '1°', value: currentStats.first || 0, pct: currentStats.firstPercent || 0, color: POSITION_COLORS['1°'] },
                { label: '2°', value: currentStats.second || 0, pct: currentStats.secondPercent || 0, color: POSITION_COLORS['2°'] },
                { label: '3°', value: currentStats.third || 0, pct: currentStats.thirdPercent || 0, color: POSITION_COLORS['3°'] },
            ];

            // Solo agregar 4° lugar si NO es Sanma (3 jugadores)
            if (!isSanma) {
                positions.push(
                    { label: '4°', value: currentStats.fourth || 0, pct: currentStats.fourthPercent || 0, color: POSITION_COLORS['4°'] }
                );
            }

            return positions;
        },
        [currentStats, isSanma]
    );

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">📊</div>
                    <div className="text-lg font-medium">{t('player.profilePage.noDataForSelection')}</div>
                    <div className="text-sm">{t('player.profilePage.tryDifferentFilters')}</div>
                </div>
            </div>
        );
    }

    // Dominio adaptativo: encontrar el % más alto entre todas las posiciones de este jugador
    const maxPercent = Math.max(...data.map((d) => d.pct));
    // Agregar 10% extra para espacio de los labels, redondeado a múltiplos de 5
    const autoMaxWithBuffer = maxPercent + 10; // +10 puntos porcentuales (no 10% del valor)
    const domainAutoMax = Math.max(30, Math.ceil(autoMaxWithBuffer / 5) * 5);
    const domain: [number, number] =
        viewMode === 'auto' ? [0, domainAutoMax] : [0, 100];

    // Muestra muy pequeña (n=1) → opacar solo esa barra
    const smallSampleOpacity = 0.6;

    // Opacidad cuando hay una posición seleccionada
    const getCellOpacity = (label: string, value: number) => {
        const selectedFade = selectedPosition && selectedPosition !== label ? 0.35 : 1;
        const tiny = value === 1 ? smallSampleOpacity : 1;
        return Math.min(selectedFade, tiny);
    };

    const zoomLabel =
        viewMode === 'auto' ? `Auto (0–${domainAutoMax}%)` : '0–100%';

    return (
        <div className={`space-y-4 ${className ?? ''}`}>
            {/* Título + total + zoom */}
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-lg font-semibold text-foreground" id="position-distribution-title">
                        {t('player.profilePage.positionDistribution')}
                    </h4>
                    {dataMode === 'season' && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('player.profilePage.seasonDataOnly', 'Solo datos de temporada actual')}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div
                        className="text-sm text-muted-foreground tabular-nums"
                        role="text"
                        aria-label={`${t('player.profilePage.games')}: ${fmtInt(currentStats?.total || 0)}`}
                    >
                        {fmtInt(currentStats?.total || 0)} {t('player.profilePage.games')}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Toggle General/Temporada */}
                        {seasonStats && getSeasonStats && (
                            <Button
                                className={unifiedStyles.secondaryButton}
                                onClick={() => setDataMode(m => m === 'general' ? 'season' : 'general')}
                                aria-label={`Cambiar vista (Actual: ${dataMode === 'general' ? 'General' : 'Temporada'})`}
                            >
                                {dataMode === 'general' ? t('player.profilePage.general', 'General') : t('player.profilePage.season', 'Temporada')}
                            </Button>
                        )}

                        {/* Zoom toggle */}
                        <Button
                            className={unifiedStyles.secondaryButton}
                            onClick={() =>
                                setViewMode((m) => (m === 'auto' ? 'full' : 'auto'))
                            }
                            aria-label={t('player.profilePage.zoomToggleAria', `Cambiar zoom (Actual: ${zoomLabel})`)}
                            aria-describedby="position-distribution-title"
                        >
                            {t('player.profilePage.zoomLabel', 'Zoom')}: {zoomLabel}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Aviso muestra pequeña */}
            {data.some((d) => d.value === 1) && (
                <div
                    className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg"
                    role="alert"
                    aria-live="polite"
                >
                    <span aria-hidden="true">⚠️ </span>
                    {t(
                        'player.profilePage.smallSampleWarning',
                        'Muestra pequeña detectada (n=1). Los porcentajes pueden ser poco representativos.'
                    )}
                </div>
            )}

            {/* Chart */}
            <div
                className="h-64"
                role="img"
                aria-label={[
                    t('player.profilePage.positionDistribution'),
                    `${t('player.profilePage.firstShort', '1°')}: ${fmtPct1(currentStats?.firstPercent || 0)}`,
                    `${t('player.profilePage.secondShort', '2°')}: ${fmtPct1(currentStats?.secondPercent || 0)}`,
                    `${t('player.profilePage.thirdShort', '3°')}: ${fmtPct1(currentStats?.thirdPercent || 0)}`,
                    `${t('player.profilePage.fourthShort', '4°')}: ${fmtPct1(currentStats?.fourthPercent || 0)}`,
                ].join(' · ')}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ left: 28, right: 60, top: 8, bottom: 8 }}
                        accessibilityLayer
                    >
                        <CartesianGrid
                            horizontal
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke="currentColor"
                            strokeOpacity={0.1}
                        />
                        <XAxis
                            type="number"
                            domain={domain}
                            tickFormatter={(v) => fmtPct1(Number(v))}
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                        />
                        <YAxis type="category" dataKey="label" width={32} />
                        <ReferenceLine
                            x={25}
                            strokeDasharray="4 4"
                            stroke="#6b7280"
                            opacity={0.6}
                            label={{ value: 'Base 25 %', position: 'top', fill: 'var(--muted-foreground)' }}
                        />
                        <Tooltip
                            formatter={(value: number, _name: string, props: any) => [
                                <span key="value" style={{ color: '#ffffff', fontWeight: 'bold' }}>
                                    {`${fmtPct1(value)} — ${fmtInt(props?.payload?.value ?? 0)} ${t('player.profilePage.games')}`}
                                </span>,
                                <span key="label" style={{ color: '#ffffff', fontWeight: 'bold' }}>
                                    {props?.payload?.label}
                                </span>,
                            ]}
                            labelFormatter={() => ''}
                            contentStyle={{
                                backgroundColor: 'rgb(37 99 235)',
                                border: '2px solid #ffffff',
                                borderRadius: 8,
                                fontSize: 16,
                                fontWeight: 700,
                                padding: 12,
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
                            }}
                        />

                        <Bar dataKey="pct" radius={[6, 6, 6, 6]}>
                            {data.map((d, i) => (
                                <Cell
                                    key={i}
                                    fill={d.color}
                                    fillOpacity={getCellOpacity(d.label, d.value)}
                                    role={onBarClick ? 'button' : undefined}
                                    tabIndex={onBarClick ? 0 : -1}
                                    aria-label={`${d.label}: ${fmtInt(d.value)} ${t('player.profilePage.games')} (${fmtPct1(d.pct)})`}
                                    onClick={() => onBarClick?.(d.label)}
                                    onKeyDown={(e) => {
                                        if (onBarClick && (e.key === 'Enter' || e.key === ' ')) {
                                            e.preventDefault();
                                            onBarClick(d.label);
                                        }
                                    }}
                                />
                            ))}
                            <LabelList content={<BarRightLabel />} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Leyenda compacta */}
            <div className="grid grid-cols-2 gap-2 text-sm" role="list" aria-label="Leyenda de posiciones">
                {data.map((item, idx) => (
                    <div
                        key={idx}
                        className={[
                            'flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer',
                            'hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                            selectedPosition === item.label
                                ? 'bg-primary/10 border border-primary/30'
                                : 'border border-transparent',
                        ].join(' ')}
                        onClick={() => onBarClick?.(item.label)}
                        role="button"
                        tabIndex={onBarClick ? 0 : -1}
                        aria-pressed={selectedPosition === item.label}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                            <span className="font-medium">{item.label}</span>
                        </div>
                        <div className="text-right tabular-nums">
                            <div className="font-semibold">{fmtPct1(item.pct)}</div>
                            <div className="text-xs text-muted-foreground">
                                ({fmtInt(item.value)})
                                {item.value === 1 && (
                                    <span className="text-amber-600 dark:text-amber-400 ml-1" aria-label="Muestra pequeña">
                                        n=1
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
