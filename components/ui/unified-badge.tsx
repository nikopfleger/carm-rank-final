"use client";

import { Badge, BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";
import { unifiedStyles } from "./unified-styles";

export type UnifiedBadgeVariant =
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'position'
    | 'status'
    | 'outline';

export type UnifiedBadgeSize = 'sm' | 'md' | 'lg';

export interface UnifiedBadgeProps extends Omit<BadgeProps, 'variant'> {
    variant?: UnifiedBadgeVariant;
    size?: UnifiedBadgeSize;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    position?: number; // Para badges de posición
    removable?: boolean;
    onRemove?: () => void;
}

const badgeVariantStyles: Record<UnifiedBadgeVariant, string> = {
    default: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
    success: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800",
    warning: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800",
    danger: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800",
    info: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
    position: "", // Se calcula dinámicamente
    status: "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
    outline: "bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
};

const badgeSizeStyles: Record<UnifiedBadgeSize, string> = {
    sm: "px-2 py-0.5 text-xs rounded-md",
    md: "px-3 py-1 text-sm rounded-lg",
    lg: "px-4 py-1.5 text-base rounded-xl"
};

export const UnifiedBadge = ({
    variant = 'default',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    position,
    removable = false,
    onRemove,
    children,
    className,
    ...props
}: UnifiedBadgeProps) => {
    // Para badges de posición, usar el estilo especial
    const positionStyle = variant === 'position' && position
        ? unifiedStyles.positionBadge(position)
        : badgeVariantStyles[variant];

    return (
        <Badge
            className={cn(
                variant === 'position' ? positionStyle : badgeVariantStyles[variant],
                badgeSizeStyles[size],
                "inline-flex items-center gap-1.5 font-medium transition-colors",
                className
            )}
            {...props}
        >
            {Icon && iconPosition === 'left' && (
                <Icon className={cn(
                    size === 'sm' ? "w-3 h-3" : size === 'md' ? "w-4 h-4" : "w-5 h-5"
                )} />
            )}

            {children}

            {Icon && iconPosition === 'right' && (
                <Icon className={cn(
                    size === 'sm' ? "w-3 h-3" : size === 'md' ? "w-4 h-4" : "w-5 h-5"
                )} />
            )}

            {removable && onRemove && (
                <button
                    onClick={onRemove}
                    className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
                    aria-label="Remover"
                >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
        </Badge>
    );
};

UnifiedBadge.displayName = "UnifiedBadge";

// Componente especializado para badges de posición
export interface PositionBadgeProps extends Omit<UnifiedBadgeProps, 'variant' | 'position'> {
    position: number;
    showIcon?: boolean;
}

export const PositionBadge: React.FC<PositionBadgeProps> = ({
    position,
    showIcon = false,
    className,
    ...props
}) => {
    const getPositionIcon = (pos: number) => {
        switch (pos) {
            case 1: return "🥇";
            case 2: return "🥈";
            case 3: return "🥉";
            default: return null;
        }
    };

    return (
        <UnifiedBadge
            variant="position"
            position={position}
            className={cn("min-w-[48px] justify-center", className)}
            {...props}
        >
            {showIcon && getPositionIcon(position)}
            {position}
        </UnifiedBadge>
    );
};

// Componente para chips informativos
export interface InfoChipProps {
    icon?: LucideIcon;
    children: React.ReactNode;
    className?: string;
}

export const InfoChip: React.FC<InfoChipProps> = ({ icon: Icon, children, className }) => {
    return (
        <div className={cn(unifiedStyles.infoChip, className)}>
            {Icon && <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {children}
            </span>
        </div>
    );
};

// Componente para mostrar estadísticas con color semántico
export interface StatBadgeProps {
    value: number;
    label?: string;
    type: 'winRate' | 'avgPosition' | 'games' | 'percentage';
    format?: 'number' | 'percentage' | 'decimal';
    className?: string;
}

export const StatBadge: React.FC<StatBadgeProps> = ({
    value,
    label,
    type,
    format = 'number',
    className
}) => {
    const getVariant = (): UnifiedBadgeVariant => {
        switch (type) {
            case 'winRate':
                if (value >= 25) return 'success';
                if (value >= 20) return 'warning';
                return 'danger';
            case 'avgPosition':
                if (value < 2.5) return 'success';
                if (value <= 2.6) return 'warning';
                return 'danger';
            default:
                return 'info';
        }
    };

    const formatValue = () => {
        switch (format) {
            case 'percentage':
                return `${value.toFixed(1)}%`;
            case 'decimal':
                return value.toFixed(2);
            default:
                return value.toString();
        }
    };

    return (
        <UnifiedBadge variant={getVariant()} size="sm" className={className}>
            {label && `${label}: `}{formatValue()}
        </UnifiedBadge>
    );
};
