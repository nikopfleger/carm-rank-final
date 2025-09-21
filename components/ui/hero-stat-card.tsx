'use client';

import { BaseStatCard, BaseStatCardProps, statCardColorVariants } from './base-stat-card';
import { Sparkline } from './sparkline';

interface HeroStatCardProps extends BaseStatCardProps {
    delta?: {
        value: number;
        period: string;
        trend: 'up' | 'down' | 'neutral';
    };
    sparklineData?: number[];
}

export function HeroStatCard({
    title,
    value,
    subtitle,
    badge,
    delta,
    sparklineData,
    color = 'blue',
    size = 'md',
    className,
    ...props
}: HeroStatCardProps) {
    const colors = statCardColorVariants[color];

    const getDeltaColor = () => {
        if (!delta) return '';
        switch (delta.trend) {
            case 'up': return 'text-green-600 dark:text-green-400';
            case 'down': return 'text-red-600 dark:text-red-400';
            case 'neutral': return 'text-yellow-600 dark:text-yellow-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getDeltaIcon = () => {
        if (!delta) return '';
        switch (delta.trend) {
            case 'up': return '↗';
            case 'down': return '↘';
            case 'neutral': return '→';
            default: return '';
        }
    };

    return (
        <BaseStatCard
            title={title}
            value={value}
            subtitle={subtitle}
            badge={badge}
            color={color}
            size={size}
            className={className}
            {...props}
        >
            {/* Contenido adicional específico del HeroStatCard */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {sparklineData && (
                        <div role="img" aria-label="Gráfico de tendencia de datos">
                            <Sparkline
                                data={sparklineData}
                                color={colors.sparkline}
                                width={40}
                                height={16}
                            />
                        </div>
                    )}
                </div>
                {delta && (
                    <div
                        className={`text-sm font-medium ${getDeltaColor()}`}
                        role="text"
                        aria-label={`Cambio: ${delta.value > 0 ? '+' : ''}${delta.value} comparado con ${delta.period}`}
                    >
                        <span aria-hidden="true">{getDeltaIcon()}</span>
                        <span className="sr-only">
                            {delta.trend === 'up' ? 'Aumento' : delta.trend === 'down' ? 'Disminución' : 'Sin cambio'} de
                        </span>
                        {delta.value > 0 ? '+' : ''}{delta.value} vs {delta.period}
                    </div>
                )}
            </div>
        </BaseStatCard>
    );
}