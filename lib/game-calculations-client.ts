/**
 * Funciones de cálculo seguras para el cliente (sin dependencias de Node.js)
 * Estas funciones pueden ser importadas directamente en componentes cliente
 */

export type GameType = 'H' | 'T'; // Hanchan | Tonpuusen
export type Position = 1 | 2 | 3 | 4;

export interface PlayerScore {
    id: number;
    finalScore: number; // Puntaje final del jugador (puede ser negativo)
}

export interface PlayerPosition {
    id: number;
    finalPosition: Position;
    finalScore: number;
}

// ===============================
// FUNCIONES AUXILIARES SEGURAS PARA CLIENTE
// ===============================

/**
 * Calcula posiciones finales considerando empates
 * @param players Array de jugadores con puntajes finales
 * @returns Array de jugadores con posiciones asignadas
 */
export function calculateFinalPositions(players: PlayerScore[]): PlayerPosition[] {
    const SCALE = 10; // 1 decimal

    // index para desempate estable en empates
    const indexed = players.map((player, index) => ({
        id: player.id,
        score: player.finalScore,
        norm: Math.round(player.finalScore * SCALE) / SCALE, // normaliza a 1 decimal
        index
    }));

    // Orden: puntaje desc; si empatan, por índice de entrada (estable)
    indexed.sort((a, b) => (b.norm - a.norm) || (a.index - b.index));

    const positions: PlayerPosition[] = [];
    let currentPosition = 1;
    for (let i = 0; i < indexed.length; i++) {
        if (i > 0 && indexed[i].norm !== indexed[i - 1].norm) {
            currentPosition = i + 1;
        }
        positions.push({
            id: indexed[i].id,
            finalPosition: currentPosition as Position,
            finalScore: indexed[i].score // guardamos el original tal cual
        });
    }

    return positions;
}

/**
 * Convierte string de tipo de juego a enum
 */
export function parseGameType(gameTypeString: string): GameType {
    return gameTypeString.toUpperCase() === 'H' ? 'H' : 'T';
}

/**
 * Valida que una posición sea válida
 */
export function isValidPosition(position: number): position is Position {
    return position >= 1 && position <= 4 && Number.isInteger(position);
}

// ============================================================================
// FUNCIÓN GENÉRICA PARA CALCULAR EMPATES
// ============================================================================

function calcularConEmpates<T>(
    posiciones_finales: number[],
    posicion_jugador: number,
    valores_por_posicion: T[],
    promediar: (valores: T[]) => T
): T {
    const N = Math.min(valores_por_posicion.length, posiciones_finales.length);

    // si es inválido o fuera de rango, devolvemos pos1 como fallback
    if (!Array.isArray(posiciones_finales) || posicion_jugador < 1 || posicion_jugador > N) {
        return valores_por_posicion[0];
    }

    const tieCount = posiciones_finales.filter(p => p === posicion_jugador).length;

    // sin empate → valor directo
    if (tieCount <= 1) {
        return valores_por_posicion[posicion_jugador - 1];
    }

    // con empate → promedio del rango cubierto por el empate
    const start = posicion_jugador;
    const end = Math.min(N, start + tieCount - 1);

    const valores: T[] = [];
    for (let pos = start; pos <= end; pos++) {
        valores.push(valores_por_posicion[pos - 1]);
    }
    return promediar(valores);
}

// ============================================================================
// FUNCIONES REUTILIZABLES PARA UMA Y OKA USANDO calcularConEmpates
// ============================================================================

// Calcular Uma con empates
export function calcularUmaConEmpates(
    posiciones_finales: number[],
    posicion_jugador: number,
    valoresUma: number[]
): number {
    return calcularConEmpates(
        posiciones_finales,
        posicion_jugador,
        valoresUma,
        (valores) => valores.reduce((sum, val) => sum + val, 0) / valores.length
    );
}

// Calcular Oka con empates
export function calcularOkaConEmpates(
    posiciones_finales: number[],
    posicion_jugador: number,
    okaRuleset: number
): number {
    // Crear array de valores: [oka, 0, 0, 0] para posiciones [1, 2, 3, 4]
    const valoresOka = [okaRuleset, 0, 0, 0];

    return calcularConEmpates(
        posiciones_finales,
        posicion_jugador,
        valoresOka,
        (valores) => valores.reduce((sum, val) => sum + val, 0) / valores.length
    );
}

// Función para calcular posiciones finales a partir de puntajes
export function calcularPosiciones(puntajes: number[]): {
    posiciones_calculo: number[], // p.ej. 2.5, 3.5 en empates
    posiciones_display: number[]  // p.ej. 1,1,3,4 (la menor del bloque)
} {
    const n = puntajes.length;
    if (n < 3 || n > 4) {
        throw new Error('Se requieren 3 o 4 puntajes');
    }

    // index + puntaje
    const jugadores = puntajes.map((puntaje, index) => ({ index, puntaje }));
    jugadores.sort((a, b) => b.puntaje - a.puntaje);

    const posiciones_calculo = new Array<number>(n);
    const posiciones_display = new Array<number>(n);

    let posicion_actual = 1;

    for (let i = 0; i < n; i++) {
        const jActual = jugadores[i];

        // contar empate
        let tie = 1;
        for (let j = i + 1; j < n; j++) {
            if (jugadores[j].puntaje === jActual.puntaje) tie++;
            else break;
        }

        if (tie === 1) {
            posiciones_calculo[jActual.index] = posicion_actual;
            posiciones_display[jActual.index] = posicion_actual;
        } else {
            // promedio aritmético del rango (posicion_actual..posicion_actual+tie-1)
            const sumaPos = (tie * (2 * posicion_actual + tie - 1)) / 2;
            const posProm = sumaPos / tie;

            for (let k = 0; k < tie; k++) {
                const je = jugadores[i + k];
                posiciones_calculo[je.index] = posProm;
                posiciones_display[je.index] = posicion_actual;
            }
            i += tie - 1; // saltamos el bloque empatado
        }

        posicion_actual += tie;
    }

    return { posiciones_calculo, posiciones_display };
}
