import { apiService } from './api-service';

// Servicio para operaciones de juegos
export class GameService {
    // Juegos pendientes
    async getPendingGames() {
        return apiService.get('/games/pending');
    }

    // Solo los contadores de status para validación
    async getValidationStats() {
        return apiService.get('/games/validation-stats');
    }

    async approveGame(id: number) {
        return apiService.post(`/games/pending/${id}/approve`, {});
    }

    async rejectGame(id: number, reason?: string) {
        return apiService.post(`/games/pending/${id}/reject`, { reason });
    }

    // Envío de juegos
    async submitGame(data: FormData) {
        return apiService.postFormData('/games/submit-pending', data);
    }

    async computeGame(data: any) {
        return apiService.post('/games', data);
    }

    // Estadísticas
    async getGameStatistics() {
        return apiService.get('/admin/statistics');
    }

    async exportData(format: 'csv' | 'json' = 'csv') {
        return apiService.get(`/admin/statistics/export?format=${format}`);
    }
}

// Singleton instance
export const gameService = new GameService();
