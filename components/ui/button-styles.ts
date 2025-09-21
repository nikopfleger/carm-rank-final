// Estilos unificados para botones en toda la aplicación
export const buttonStyles = {
    // Botones principales
    primary: "bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",

    // Botones secundarios
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100",

    // Botones outline
    outline: "border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-300",

    // Botones de acción específicos
    approve: "bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
    reject: "bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
    cancel: "bg-gray-500 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
    save: "bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    edit: "bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2",
    delete: "bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",

    // Tamaños
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",

    // Estados
    disabled: "opacity-50 cursor-not-allowed",
    loading: "opacity-75 cursor-wait",

    // Botones de paginación
    pagination: "px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700",
    paginationActive: "px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md",
    paginationDisabled: "px-3 py-2 text-sm font-medium text-gray-300 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500",
} as const;

// Función helper para combinar estilos
export function getButtonClass(variant: keyof typeof buttonStyles, size?: keyof typeof buttonStyles, additionalClasses?: string) {
    const baseClass = buttonStyles[variant];
    const sizeClass = size ? buttonStyles[size] : '';
    return `${baseClass} ${sizeClass} ${additionalClasses || ''}`.trim();
}
