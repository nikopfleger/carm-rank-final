'use client';

import { ReactNode } from 'react';

// Componente para mejorar el contraste de colores
interface HighContrastProps {
    children: ReactNode;
    className?: string;
}

export function HighContrast({ children, className }: HighContrastProps) {
    return (
        <div className={`high-contrast ${className}`}>
            {children}
        </div>
    );
}

// Componente para patrones de daltónicos
interface ColorBlindFriendlyProps {
    children: ReactNode;
    pattern?: 'dots' | 'stripes' | 'diagonal' | 'solid';
    className?: string;
}

export function ColorBlindFriendly({
    children,
    pattern = 'dots',
    className
}: ColorBlindFriendlyProps) {
    const patternClasses = {
        dots: 'bg-dot-pattern',
        stripes: 'bg-stripe-pattern',
        diagonal: 'bg-diagonal-pattern',
        solid: 'bg-solid-pattern'
    };

    return (
        <div className={`${patternClasses[pattern]} ${className}`}>
            {children}
        </div>
    );
}

// Componente para skip links
interface SkipLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
    return (
        <a
            href={href}
            className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg ${className}`}
        >
            {children}
        </a>
    );
}

// Componente para anuncios de estado
interface StatusAnnouncementProps {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    className?: string;
}

export function StatusAnnouncement({
    message,
    type = 'info',
    className
}: StatusAnnouncementProps) {
    const typeClasses = {
        success: 'text-green-600 dark:text-green-400',
        error: 'text-red-600 dark:text-red-400',
        warning: 'text-amber-600 dark:text-amber-400',
        info: 'text-blue-600 dark:text-blue-400'
    };

    return (
        <div
            className={`sr-only ${typeClasses[type]} ${className}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
        >
            {message}
        </div>
    );
}

// Componente para mejoras de foco
interface FocusEnhancementProps {
    children: ReactNode;
    className?: string;
}

export function FocusEnhancement({ children, className }: FocusEnhancementProps) {
    return (
        <div className={`focus-enhanced ${className}`}>
            {children}
        </div>
    );
}
