"use client";

import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    className?: string;
    variant?: 'default' | 'tournaments' | 'ranking' | 'players';
}

export function PageHeader({ icon: Icon, title, subtitle, className = "", variant = 'default' }: PageHeaderProps) {
    const getVariantStyles = () => {
        switch (variant) {
            case 'tournaments':
                return {
                    background: 'bg-gradient-to-br from-yellow-400/20 via-orange-500/20 to-red-500/20',
                    iconBg: 'bg-gradient-to-br from-yellow-400 to-orange-500',
                    titleGradient: 'from-yellow-500 via-orange-600 to-red-600',
                    iconColor: 'text-yellow-500',
                    accent: 'from-yellow-500/30 to-orange-500/30'
                };
            case 'ranking':
                return {
                    background: 'bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-pink-500/20',
                    iconBg: 'bg-gradient-to-br from-blue-500 to-purple-600',
                    titleGradient: 'from-blue-600 via-purple-600 to-pink-600',
                    iconColor: 'text-blue-500',
                    accent: 'from-blue-500/30 to-purple-500/30'
                };
            case 'players':
                return {
                    background: 'bg-gradient-to-br from-green-400/20 via-emerald-500/20 to-teal-500/20',
                    iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
                    titleGradient: 'from-green-600 via-emerald-600 to-teal-600',
                    iconColor: 'text-green-500',
                    accent: 'from-green-500/30 to-emerald-500/30'
                };
            default:
                return {
                    background: 'bg-gradient-to-br from-purple-400/20 via-blue-500/20 to-indigo-500/20',
                    iconBg: 'bg-gradient-to-br from-purple-500 to-blue-600',
                    titleGradient: 'from-purple-600 via-blue-600 to-indigo-600',
                    iconColor: 'text-purple-500',
                    accent: 'from-purple-500/30 to-blue-500/30'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className={`relative overflow-hidden rounded-3xl p-8 md:p-12 mb-12 ${styles.background} ${className}`}>
            {/* Efectos de fondo decorativos */}
            <div className="absolute inset-0 overflow-hidden">
                <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${styles.accent} opacity-60 blur-3xl`} />
                <div className={`absolute -bottom-20 -left-20 w-32 h-32 rounded-full bg-gradient-to-br ${styles.accent} opacity-40 blur-2xl`} />
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br ${styles.accent} opacity-30 blur-xl`} />
            </div>

            {/* Contenido */}
            <div className="relative z-10 text-center">
                {/* Icono con animación */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-2xl mb-6 transform hover:scale-110 transition-all duration-300">
                    <div className={`w-full h-full rounded-2xl ${styles.iconBg} flex items-center justify-center`}>
                        <Icon className="h-10 w-10 text-white" />
                    </div>
                </div>

                {/* Título principal */}
                <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r bg-clip-text text-transparent mb-4 tracking-tight">
                    <span className={`bg-gradient-to-r ${styles.titleGradient} bg-clip-text text-transparent`}>
                        {title}
                    </span>
                </h1>

                {/* Subtítulo */}
                <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 max-w-2xl mx-auto leading-relaxed font-medium">
                    {subtitle}
                </p>

                {/* Línea decorativa */}
                <div className={`w-24 h-1 mx-auto mt-6 rounded-full bg-gradient-to-r ${styles.titleGradient}`} />
            </div>
        </div>
    );
}
