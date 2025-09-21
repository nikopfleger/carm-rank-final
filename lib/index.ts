/**
 * Exportaciones centralizadas de todos los helpers del sistema CAMR
 */

// Cálculos de puntuación (servidor) - solo para API routes
export * from './game-calculations';

// API de cálculos para cliente
export * from './game-calculations-api';

// Operaciones de alto nivel (CRUD)
export * from './game-operations';

// Helpers de utilidad y validación
export * from './game-helpers';

// Re-exportaciones organizadas por categoría
export {
  // === CÁLCULOS DE JUEGO ===
  calculateDanPoints, calculateFinalPositions, calculateGameResults, calculateRatePoints, isValidPosition, parseGameType
} from './game-calculations';

export {
  // === OPERACIONES DE JUEGOS ===
  createGame,
  createPlayer, type GameCreationResult, type GamePlayerInput, type NewGameData,
  type NewPlayerData, type PlayerCreationResult
} from './game-operations';

export {
  calculateAveragePosition, calculateOkaDistributionPerPlayer as calculateOkaDistribution,
  // === HELPERS DE UMA/OKA ===
  calculateUmaForPosition,
  // === UTILIDADES DE RANKING ===
  calculateWinRate, formatDate,
  formatDateTime, formatPoints, formatScore,
  // === IMPORT/EXPORT ===
  gameToCSVFormat, getDanRank,
  getDanRankColor,
  isPlayerActive, normalizeNickname,
  // === TRANSFORMACIONES ===
  parseGameDate, validateCSVGameData,
  // === VALIDACIONES ===
  validateGameScores, validateNickname, validateUniquePlayerIds
} from './game-helpers';

