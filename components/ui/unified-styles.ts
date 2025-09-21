// Sistema de estilos unificado para toda la aplicación
// Basado en el diseño de la nueva rank table

export const unifiedStyles = {
    // Botones principales
    primaryButton: "h-10 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium",

    // Botones secundarios
    secondaryButton: "h-10 px-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 font-medium",

    // Botones pequeños
    smallButton: "h-8 px-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium",

    // Toggle groups (sliders)
    toggleGroup: "bg-white dark:bg-gray-800 p-1 rounded-xl border-2 border-gray-200 dark:border-gray-700",

    toggleGroupItem: "h-8 px-4 rounded-lg data-[state=on]:bg-gradient-to-r data-[state=on]:from-blue-500 data-[state=on]:to-purple-600 data-[state=on]:text-white data-[state=on]:shadow-lg transition-all duration-200 text-sm font-medium",

    // Selects
    selectTrigger: "h-10 px-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors",

    // Inputs
    input: "h-10 px-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-600 transition-colors",

    // Cards
    card: "bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700",

    // Info chips
    infoChip: "flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-800",

    // Badges de posición
    positionBadge: (position: number) => {
        const gradients = {
            1: "from-yellow-400 via-yellow-500 to-yellow-600",
            2: "from-gray-300 via-gray-400 to-gray-500",
            3: "from-orange-400 via-orange-500 to-orange-600",
            default: "from-blue-400 via-blue-500 to-blue-600"
        };

        const gradient = position <= 3 ? gradients[position as keyof typeof gradients] : gradients.default;
        return `relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} text-white font-bold text-lg shadow-lg flex-shrink-0`;
    },

    // Avatar de jugador
    playerAvatar: "w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0",

    // Stats containers
    statContainer: "text-center min-w-[60px]",
    statLabel: "text-xs text-gray-500 dark:text-gray-400 mb-1",
    statValue: "text-lg font-bold",

    // Colores semánticos
    colors: {
        success: "text-green-500",
        warning: "text-yellow-500",
        danger: "text-red-500",
        primary: "text-blue-600 dark:text-blue-400",
        secondary: "text-purple-600 dark:text-purple-400"
    },

    // Transiciones
    transition: "transition-all duration-200",
    transitionSlow: "transition-all duration-300"
} as const;

// Helper para aplicar colores semánticos a stats
export const getSemanticColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return unifiedStyles.colors.success;
    if (value >= thresholds.warning) return unifiedStyles.colors.warning;
    return unifiedStyles.colors.danger;
};

// Helper para stats de posición promedio
export const getPositionColor = (avgPos: number) => {
    // Para posición promedio: menor es mejor
    // < 2.5 = excelente (verde), 2.5-2.6 = bueno (amarillo), > 2.6 = regular (rojo)
    if (avgPos < 2.5) return unifiedStyles.colors.success;
    if (avgPos <= 2.6) return unifiedStyles.colors.warning;
    return unifiedStyles.colors.danger;
};

// Helper para stats de win rate
export const getWinRateColor = (winRate: number) => {
    return getSemanticColor(winRate, { good: 25, warning: 20 });
};
