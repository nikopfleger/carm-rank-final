'use client';

import { cn } from '@/lib/utils';

type Variant = 'subtle' | 'elevated' | 'metal';
type Size = 'sm' | 'md';

export function FancyRankBadge({
    label,
    color,     // hex desde tu DB (ej. '#f59e0b')
    size = 'md',
    variant = 'elevated',
    ariaLabel,
    className,
}: {
    label: string;
    color: string;
    size?: Size;
    variant?: Variant;
    ariaLabel?: string;
    className?: string;
}) {
    const h = size === 'sm' ? 'h-6 text-[11px] px-2.5' : 'h-7 text-xs px-3';
    return (
        <span
            role="status"
            aria-label={ariaLabel ?? label}
            className={cn(
                'fancy-badge relative inline-flex items-center justify-center min-w-[56px] rounded-full font-semibold tracking-wide',
                'text-white focus:outline-none focus-visible:ring-2',
                h,
                {
                    'fancy-badge--subtle': variant === 'subtle',
                    'fancy-badge--elevated': variant === 'elevated',
                    'fancy-badge--metal': variant === 'metal',
                },
                className
            )}
            style={
                {
                    // color base del rango
                    // (lo derivamos para bg/borde/highlight con color-mix)
                    ['--c' as any]: color,
                } as React.CSSProperties
            }
        >
            {label}
        </span>
    );
}
