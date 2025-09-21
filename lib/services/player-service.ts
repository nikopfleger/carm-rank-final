import { apiService } from './api-service';

// Servicio para operaciones de jugadores
export class PlayerService {
    // Perfil de jugador
    async getPlayerProfile(legajo: string) {
        return apiService.get(`/players/${legajo}/profile`);
    }

    async getPlayerRanking(params?: {
        playerCount?: '3' | '4';
        limit?: number;
        offset?: number;
    }) {
        const query = new URLSearchParams();
        if (params?.playerCount) query.set('playerCount', params.playerCount);
        if (params?.limit) query.set('limit', params.limit.toString());
        if (params?.offset) query.set('offset', params.offset.toString());

        return apiService.get(`/players/ranking?${query.toString()}`);
    }

    // Link requests
    async getLinkStatus(playerId: number) {
        return apiService.get(`/players/${playerId}/link-status`);
    }

    async createLinkRequest(playerId: number) {
        return apiService.post('/link-requests', { playerId });
    }

    // Búsqueda de jugadores
    async searchPlayers(query: string) {
        return apiService.get(`/players/search?q=${encodeURIComponent(query)}`);
    }
}

// Singleton instance
export const playerService = new PlayerService();
