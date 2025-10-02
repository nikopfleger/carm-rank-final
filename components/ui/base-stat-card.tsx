'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { FormattedNumber } from './formatted-number';

// Tipos de color unificados
export type StatCardColor = 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'first' | 'second' | 'third' | 'fourth';

// Variantes de color unificadas
export const statCardColorVariants = {
    purple: {
        border: 'border-purple-200 dark:border-purple-700',
        title: 'text-purple-600 dark:text-purple-400',
        value: 'text-purple-700 dark:text-purple-300',
        subtitle: 'text-purple-600 dark:text-purple-400',
        badge: 'text-purple-500 dark:text-purple-400 bg-purple-100 dark:bg-purple-800/50',
        sparkline: '#8b5cf6',
        progress: 'bg-purple-200 dark:bg-purple-800'
    },
    blue: {
        border: 'border-blue-200 dark:border-blue-700',
        title: 'text-blue-600 dark:text-blue-400',
        value: 'text-blue-700 dark:text-blue-300',
        subtitle: 'text-blue-600 dark:text-blue-400',
        badge: 'text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-800/50',
        sparkline: '#3b82f6',
        progress: 'bg-blue-200 dark:bg-blue-800'
    },
    green: {
        border: 'border-green-200 dark:border-green-700',
        title: 'text-green-600 dark:text-green-400',
        value: 'text-green-700 dark:text-green-300',
        subtitle: 'text-green-600 dark:text-green-400',
        badge: 'text-green-500 dark:text-green-400 bg-green-100 dark:bg-green-800/50',
        sparkline: '#10b981',
        progress: 'bg-green-200 dark:bg-green-800'
    },
    orange: {
        border: 'border-orange-200 dark:border-orange-700',
        title: 'text-orange-600 dark:text-orange-400',
        value: 'text-orange-700 dark:text-orange-300',
        subtitle: 'text-orange-600 dark:text-orange-400',
        badge: 'text-orange-500 dark:text-orange-400 bg-orange-100 dark:bg-orange-800/50',
        sparkline: '#f59e0b',
        progress: 'bg-orange-200 dark:bg-orange-800'
    },
    red: {
        border: 'border-red-200 dark:border-red-700',
        title: 'text-red-600 dark:text-red-400',
        value: 'text-red-700 dark:text-red-300',
        subtitle: 'text-red-600 dark:text-red-400',
        badge: 'text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-800/50',
        sparkline: '#ef4444',
        progress: 'bg-red-200 dark:bg-red-800'
    },
    yellow: {
        border: 'border-yellow-200 dark:border-yellow-700',
        title: 'text-yellow-600 dark:text-yellow-400',
        value: 'text-yellow-700 dark:text-yellow-300',
        subtitle: 'text-yellow-600 dark:text-yellow-400',
        badge: 'text-yellow-500 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-800/50',
        sparkline: '#eab308',
        progress: 'bg-yellow-200 dark:bg-yellow-800'
    },
    // Colores semánticos de posición
    first: {
        border: 'border-amber-200 dark:border-amber-700',
        title: 'text-amber-600 dark:text-amber-400',
        value: 'text-amber-700 dark:text-amber-300',
        subtitle: 'text-amber-600 dark:text-amber-400',
        badge: 'text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-800/50',
        sparkline: '#F5C542',
        progress: 'bg-amber-200 dark:bg-amber-800'
    },
    second: {
        border: 'border-slate-200 dark:border-slate-700',
        title: 'text-slate-600 dark:text-slate-400',
        value: 'text-slate-700 dark:text-slate-300',
        subtitle: 'text-slate-600 dark:text-slate-400',
        badge: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50',
        sparkline: '#C0C7D1',
        progress: 'bg-slate-200 dark:bg-slate-800'
    },
    third: {
        border: 'border-orange-200 dark:border-orange-700',
        title: 'text-orange-600 dark:text-orange-400',
        value: 'text-orange-700 dark:text-orange-300',
        subtitle: 'text-orange-600 dark:text-orange-400',
        badge: 'text-orange-500 dark:text-orange-400 bg-orange-100 dark:bg-orange-800/50',
        sparkline: '#CD7F32',
        progress: 'bg-orange-200 dark:bg-orange-800'
    },
    fourth: {
        border: 'border-red-200 dark:border-red-700',
        title: 'text-red-600 dark:text-red-400',
        value: 'text-red-700 dark:text-red-300',
        subtitle: 'text-red-600 dark:text-red-400',
        badge: 'text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-800/50',
        sparkline: '#EF4444',
        progress: 'bg-red-200 dark:bg-red-800'
    }
} as const;

// Variantes de tamaño unificadas
export const statCardSizeVariants = {
    sm: {
        container: 'p-4',
        title: 'text-sm',
        value: 'text-2xl',
        subtitle: 'text-xs'
    },
    md: {
        container: 'p-6',
        title: 'text-sm',
        value: 'text-3xl',
        subtitle: 'text-sm'
    },
    lg: {
        container: 'p-6',
        title: 'text-sm',
        value: 'text-4xl',
        subtitle: 'text-sm'
    }
} as const;

// Props base para todas las stat cards
export interface BaseStatCardProps {
    title: string | ReactNode;
    value: string | number;
    subtitle?: string;
    badge?: string;
    color?: StatCardColor;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    children?: ReactNode;
}

// Componente base reutilizable
export function BaseStatCard({
    title,
    value,
    subtitle,
    badge,
    color = 'blue',
    size = 'md',
    className,
    children
}: BaseStatCardProps) {
    const colors = statCardColorVariants[color];
    const sizes = statCardSizeVariants[size];

    return (
        <div
            className={cn(
                'group relative bg-white dark:bg-gray-800 rounded-xl border border-border/40 shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 transition-all duration-200',
                colors.border,
                sizes.container,
                className
            )}
            role="region"
            aria-label={typeof title === 'string' ? title : 'Estadística'}
            tabIndex={0}
        >
            <div className="relative">
                <div className="flex items-center justify-between mb-2">
                    <div
                        className={cn('font-medium', colors.title, sizes.title)}
                        role="heading"
                        aria-level={3}
                    >
                        {title}
                    </div>
                    {badge && (
                        <div
                            className={cn('text-sm px-2 py-1 rounded-full', colors.badge)}
                            role="status"
                            aria-label={`Estado: ${badge}`}
                        >
                            {badge}
                        </div>
                    )}
                </div>

                <div
                    className={cn('font-bold mb-2 tabular', colors.value, sizes.value)}
                    role="text"
                    aria-label={`Valor: ${value}`}
                >
                    {/* Para evitar hydration mismatch, si el valor es numérico delegamos el formateo al cliente */}
                    {typeof value === 'number' ? <FormattedNumber value={value} options={{ maximumFractionDigits: 0 }} /> : value}
                </div>

                {subtitle && (
                    <div
                        className={cn(colors.subtitle, sizes.subtitle)}
                        role="text"
                        aria-label={`Información adicional: ${subtitle}`}
                    >
                        {subtitle}
                    </div>
                )}

                {children}
            </div>
        </div>
    );
}
