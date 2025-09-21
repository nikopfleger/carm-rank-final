'use client';

import { cn } from '@/lib/utils';
import { SimpleTooltip } from './simple-tooltip';

interface RankMicroProgressProps {
    current: number;
    min: number;
    max: number;
    nextLabel?: string;
    color: string;
    className?: string;
    alwaysShow?: boolean; // Nueva prop para controlar visibilidad
}

export function RankMicroProgress({
    current,
    min,
    max,
    nextLabel,
    color,
    className,
    alwaysShow = false,
}: RankMicroProgressProps) {
    const pct = Math.max(0, Math.min(1, (current - min) / Math.max(1, max - min)));
    const remaining = Math.max(0, Math.round(max - current));

    // Mostrar siempre si alwaysShow es true, sino solo si es relevante
    const show = alwaysShow || pct >= 0.7 || pct <= 0.2 || pct >= 0.9 || pct <= 0.1;

    if (!show) return null;

    const percentage = (pct * 100).toFixed(1).replace('.', ',');
    const tooltipText = `${current.toLocaleString('es-AR')} / ${max.toLocaleString('es-AR')} (${percentage}%)${nextLabel ? ` – faltan ${remaining} para ${nextLabel}` : ''}`;

    return (
        <div className={cn("flex items-center gap-2 min-w-0 flex-1", className)}>
            {/* Micro-barra - oculta en móviles */}
            <SimpleTooltip text={tooltipText}>
                <div
                    className="hidden sm:block h-2 w-[120px] max-w-full shrink rounded-full bg-white/10 overflow-hidden cursor-pointer"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(pct * 100)}
                >
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                            width: `${pct * 100}%`,
                            background: `color-mix(in oklab, ${color} 80%, transparent)`,
                            boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 30%, transparent)`,
                        }}
                    />
                </div>
            </SimpleTooltip>

            {/* Etiqueta de progreso - oculta en pantallas pequeñas */}
            <span className="hidden xl:inline text-xs text-muted-foreground tabular-nums shrink-0">
                {remaining > 0 ? `${remaining}${nextLabel ? ` → ${nextLabel}` : ''}` : '✓ listo'}
            </span>
        </div>
    );
}
