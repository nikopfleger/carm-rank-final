/**
 * Formatea un número usando el locale automático del navegador del usuario
 * @param num - Número a formatear
 * @param options - Opciones de formateo
 * @returns Número formateado según las preferencias del navegador
 */
export function formatNumber(
    num: number,
    options?: Intl.NumberFormatOptions
): string {
    // Usar siempre el locale automático del navegador
    // Esto evita problemas de hidratación porque el resultado es consistente
    return num.toLocaleString(undefined, options);
}

/**
 * Formatea un número como entero usando el locale automático del navegador
 * @param num - Número a formatear
 * @returns Número formateado como entero
 */
export function formatInteger(
    num: number
): string {
    return formatNumber(num, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

/**
 * Formatea un número con decimales usando el locale automático del navegador
 * @param num - Número a formatear
 * @param decimals - Número de decimales
 * @returns Número formateado con decimales
 */
export function formatDecimal(
    num: number,
    decimals: number = 2
): string {
    return formatNumber(num, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Formatea un porcentaje usando el locale automático del navegador
 * @param num - Número a formatear (0-100)
 * @param decimals - Número de decimales
 * @returns Porcentaje formateado
 */
export function formatPercentage(
    num: number,
    decimals: number = 1
): string {
    return formatNumber(num, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        style: 'percent'
    });
}

// Funciones de compatibilidad con el código existente
export const fmtInt = formatInteger;
export const fmtPct1 = (num: number) => formatPercentage(num, 1);

/**
 * Formatea un porcentaje que ya está en escala 0-100 (no divide por 100)
 * @param num - Número a formatear (0-100)
 * @param decimals - Número de decimales
 * @returns Porcentaje formateado con símbolo % pero sin dividir por 100
 */
export function formatPercentageRaw(
    num: number,
    decimals: number = 1
): string {
    return formatNumber(num, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }) + '%';
}

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
