'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface InfoChipProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    className?: string;
    variant?: 'default' | 'muted' | 'brand';
    'aria-live'?: 'polite' | 'assertive' | 'off';
}

export function InfoChip({
    icon: Icon,
    label,
    value,
    className,
    variant = 'default',
    'aria-live': ariaLive = 'polite',
}: InfoChipProps) {
    const variantStyles = {
        default: "bg-muted/50 border-border/30 text-muted-foreground",
        muted: "bg-muted/30 border-border/20 text-muted-foreground",
        brand: "bg-brand-500/10 border-brand-500/30 text-brand-700 dark:text-brand-300",
    };

    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium",
                variantStyles[variant],
                className
            )}
            aria-live={ariaLive}
        >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}: </span>
            <span>{value}</span>
        </div>
    );
}
