'use client';

import { BaseStatCard, BaseStatCardProps } from './base-stat-card';

interface SeasonStatCardProps extends BaseStatCardProps {
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string | number;
    sparklineData?: number[];
}

export function SeasonStatCard({
    title,
    value,
    trend = 'neutral',
    trendValue,
    sparklineData,
    color = 'orange',
    className,
    children,
    ...props
}: SeasonStatCardProps) {
    const getTrendColor = () => {
        switch (trend) {
            case 'up': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'down': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    const getTrendIcon = () => {
        switch (trend) {
            case 'up': return '↑';
            case 'down': return '↓';
            default: return '→';
        }
    };

    return (
        <BaseStatCard
            title={title}
            value={value}
            color={color}
            className={className}
            {...props}
        >
            {/* Contenido adicional específico del SeasonStatCard */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {sparklineData && (
                        <div role="img" aria-label="Gráfico de tendencia de puntos de temporada">
                            <svg width="40" height="16" className="text-current">
                                <polyline
                                    points={sparklineData.map((d, i) => `${i * 10},${16 - (d / Math.max(...sparklineData)) * 12}`).join(' ')}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    className="opacity-60"
                                />
                            </svg>
                        </div>
                    )}
                </div>
                {trendValue !== undefined && (
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
                        <span aria-hidden="true">{trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}</span>
                        <span>
                            {trend === 'up' ? 'Aumento' : trend === 'down' ? 'Disminución' : 'Sin cambio'} de
                            <strong className="mx-1">{typeof trendValue === 'number' ? `+${trendValue}` : trendValue}</strong>
                            vs 30 días
                        </span>
                    </div>
                )}
            </div>
            {children}
        </BaseStatCard>
    );
}