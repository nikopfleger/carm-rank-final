'use client';

import { Info } from 'lucide-react';
import { ReactNode } from 'react';
import { InfoTooltip } from './info-tooltip';

interface ContextualInfoProps {
    title: string;
    description: string;
    children?: ReactNode;
    className?: string;
}

export function ContextualInfo({ title, description, children, className }: ContextualInfoProps) {
    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                </h3>
                <InfoTooltip content={description}>
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </InfoTooltip>
            </div>
            {children}
        </div>
    );
}

// Componente para microcopys contextuales
interface MicrocopyProps {
    text: string;
    variant?: 'info' | 'warning' | 'success' | 'error';
    className?: string;
}

export function Microcopy({ text, variant = 'info', className }: MicrocopyProps) {
    const variants = {
        info: 'text-gray-600 dark:text-gray-400',
        warning: 'text-amber-600 dark:text-amber-400',
        success: 'text-green-600 dark:text-green-400',
        error: 'text-red-600 dark:text-red-400'
    };

    return (
        <p className={`text-sm ${variants[variant]} ${className}`}>
            {text}
        </p>
    );
}

// Componente para secciones con contexto
interface SectionWithContextProps {
    title: string;
    description?: string;
    microcopy?: string;
    children: ReactNode;
    className?: string;
}

export function SectionWithContext({
    title,
    description,
    microcopy,
    children,
    className
}: SectionWithContextProps) {
    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                </h3>
                {description && (
                    <InfoTooltip content={description}>
                        <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    </InfoTooltip>
                )}
            </div>
            {microcopy && <Microcopy text={microcopy} />}
            {children}
        </div>
    );
}
