import { apiService } from './api-service';

// Servicio para páginas públicas
export class PublicService {
    // Temporadas
    async getSeasons() {
        const response = await apiService.get('/seasons');
        return (response as any)?.data || response;
    }

    async getSeason(id: number) {
        return apiService.get(`/seasons/${id}`);
    }

    // Torneos
    async getTournaments() {
        const response = await apiService.get('/tournaments');
        return (response as any)?.data || response;
    }

    async getTournament(id: number) {
        return apiService.get(`/tournaments/${id}`);
    }

    // Historial
    async getGameHistory(params?: {
        page?: number;
        limit?: number;
        dateFrom?: string;
        dateTo?: string;
        seasonId?: string;
        gameType?: string;
        locationId?: string;
        playerIds?: string;
        onlyValidated?: string;
    }) {
        const query = new URLSearchParams();
        if (params?.page) query.set('page', params.page.toString());
        if (params?.limit) query.set('limit', params.limit.toString());
        if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
        if (params?.dateTo) query.set('dateTo', params.dateTo);
        if (params?.seasonId) query.set('seasonId', params.seasonId);
        if (params?.gameType) query.set('gameType', params.gameType);
        if (params?.locationId) query.set('locationId', params.locationId);
        if (params?.playerIds) query.set('playerIds', params.playerIds);
        if (params?.onlyValidated) query.set('onlyValidated', params.onlyValidated);

        return apiService.get(`/games/history?${query.toString()}`);
    }

    // Ubicaciones
    async getLocations() {
        const response = await apiService.get('/abm/locations');
        return (response as any)?.data || response;
    }

    // Reglas
    async getRulesets() {
        return apiService.get('/rulesets');
    }
}

// Singleton instance
export const publicService = new PublicService();
