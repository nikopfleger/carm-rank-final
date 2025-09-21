// Utilidades para formatear tipos de juego
export type GameType = "HANCHAN" | "TONPUUSEN";

/**
 * Convierte el tipo de juego de la base de datos (mayúsculas) 
 * al formato de visualización (capitalizado)
 */
export const formatGameType = (gameType: GameType): string => {
    return gameType === "HANCHAN" ? "Hanchan" : "Tonpuusen";
};

/**
 * Convierte el tipo de juego capitalizado de vuelta al formato de la base de datos
 */
export const parseGameType = (gameType: string): GameType | null => {
    switch (gameType.toLowerCase()) {
        case "hanchan":
            return "HANCHAN";
        case "tonpuusen":
            return "TONPUUSEN";
        default:
            return null;
    }
};

/**
 * Opciones para selects de tipo de juego
 */
export const GAME_TYPE_OPTIONS = [
    { value: "", label: "Todos los tipos" },
    { value: "HANCHAN", label: "Hanchan" },
    { value: "TONPUUSEN", label: "Tonpuusen" },
] as const;
