/**
 * Formatea un número usando el locale automático del navegador del usuario
 * @param num - Número a formatear
 * @param options - Opciones de formateo
 * @returns Número formateado según las preferencias del navegador
 */
// Factory que recibe locale (inyectado desde contexto por request)
export const makeFormatters = (locale: string) => ({
    formatNumber: (num: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, options).format(num),
    formatInteger: (num: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num),
    formatDecimal: (num: number, decimals: number = 2) => new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num),
    formatPercentage: (num: number, decimals: number = 1) => new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num) + '%',
    formatPercentageRaw: (num: number, decimals: number = 1) => new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num) + '%',
});

/**
 * Formatea un número como entero usando el locale automático del navegador
 * @param num - Número a formatear
 * @returns Número formateado como entero
 */
// Backwards-compat helper defaulting to es-AR si no se provee contexto
const defaultFmt = makeFormatters('es-AR');
export const formatNumber = defaultFmt.formatNumber;
export const formatInteger = defaultFmt.formatInteger;
export const formatDecimal = defaultFmt.formatDecimal;
export const formatPercentage = defaultFmt.formatPercentage;
export const formatPercentageRaw = defaultFmt.formatPercentageRaw;

/**
 * Formatea un número con decimales usando el locale automático del navegador
 * @param num - Número a formatear
 * @param decimals - Número de decimales
 * @returns Número formateado con decimales
 */
// (las funciones arriba ya cubren decimal/percentage)

/**
 * Formatea un porcentaje usando el locale automático del navegador
 * @param num - Número a formatear (0-100)
 * @param decimals - Número de decimales
 * @returns Porcentaje formateado
 */

// Funciones de compatibilidad con el código existente
export const fmtInt = formatInteger;
export const fmtPct1 = (num: number) => formatPercentage(num, 1);

/**
 * Formatea un porcentaje que ya está en escala 0-100 (no divide por 100)
 * @param num - Número a formatear (0-100)
 * @param decimals - Número de decimales
 * @returns Porcentaje formateado con símbolo % pero sin dividir por 100
 */
// (cubrimos con makeFormatters)

// Función de compatibilidad para porcentajes ya calculados
export const fmtPct1Raw = (num: number) => formatPercentageRaw(num, 1);

// Colores para posiciones (mantenido para compatibilidad)
export const POSITION_COLORS = {
    1: '#FFD700', // Oro
    2: '#C0C0C0', // Plata
    3: '#CD7F32', // Bronce
    4: '#8B4513', // Marrón
    '1°': '#FFD700', // Oro con símbolo
    '2°': '#C0C0C0', // Plata con símbolo
    '3°': '#CD7F32', // Bronce con símbolo
    '4°': '#8B4513'  // Marrón con símbolo
};
