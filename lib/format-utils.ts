// Utilidades de formato para números y porcentajes
export const nf = new Intl.NumberFormat('es-AR');
export const fmtInt = (n: number) => nf.format(n);
export const fmtPct1 = (v: number) => `${v.toFixed(1).replace('.', ',')} %`;

// Colores semánticos para posiciones
export const POSITION_COLORS = {
    '1°': '#D4AF37', // Oro más contrastado
    '2°': '#A8A8A8', // Plata más contrastada
    '3°': '#B8860B', // Bronce más contrastado
    '4°': '#DC2626'  // Rojo más contrastado
} as const;

export const fmtPct = (v: number): string => {
    return v.toLocaleString('es-AR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }) + ' %';
};