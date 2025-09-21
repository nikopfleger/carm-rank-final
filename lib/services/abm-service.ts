import { apiService } from './api-service';

// Servicio específico para ABM (similar a Angular services)
export class AbmService {
    // Países
    async getCountries(deleted = false) {
        return apiService.get(`/abm/countries?deleted=${deleted}`);
    }

    async createCountry(data: any) {
        return apiService.post('/abm/countries', data);
    }

    async updateCountry(id: number, data: any) {
        return apiService.put(`/abm/countries/${id}`, data);
    }

    async deleteCountry(id: number) {
        return apiService.delete(`/abm/countries/${id}`);
    }

    async restoreCountry(id: number) {
        return apiService.post(`/abm/countries/${id}/restore`, {});
    }

    // UMA
    async getUmas() {
        return apiService.get('/abm/uma');
    }

    async createUma(data: any) {
        return apiService.post('/abm/uma', data);
    }

    async updateUma(id: number, data: any) {
        return apiService.put(`/abm/uma/${id}`, data);
    }

    async deleteUma(id: number) {
        return apiService.delete(`/abm/uma/${id}`);
    }

    async restoreUma(id: number) {
        return apiService.post(`/abm/uma/${id}/restore`, {});
    }

    // Jugadores
    async getPlayers() {
        return apiService.get('/abm/players');
    }

    async createPlayer(data: any) {
        return apiService.post('/abm/players', data);
    }

    async updatePlayer(id: number, data: any) {
        return apiService.put(`/abm/players/${id}`, data);
    }

    async deletePlayer(id: number) {
        return apiService.delete(`/abm/players/${id}`);
    }

    async restorePlayer(id: number) {
        return apiService.patch(`/abm/players/${id}`, { action: 'restore' });
    }

    // Link Requests
    async getLinkRequests(params?: { status?: string; playerId?: number }) {
        const query = new URLSearchParams();
        if (params?.status) query.set('status', params.status);
        if (params?.playerId) query.set('playerId', params.playerId.toString());

        return apiService.get(`/admin/link-requests?${query.toString()}`);
    }

    async approveLinkRequest(id: number) {
        return apiService.post(`/admin/link-requests/${id}/approve`, {});
    }

    async rejectLinkRequest(id: number, reason?: string) {
        return apiService.post(`/admin/link-requests/${id}/reject`, { reason });
    }

    async updateLinkRequest(id: number, data: any) {
        return apiService.patch(`/admin/link-requests/${id}`, data);
    }

    async deleteLinkRequest(id: number) {
        return apiService.delete(`/admin/link-requests/${id}`);
    }

    // Email Accounts
    async getEmailAccounts() {
        return apiService.get('/admin/email-accounts');
    }

    async createEmailAccount(data: any) {
        return apiService.post('/admin/email-accounts', data);
    }

    async updateEmailAccount(id: number, data: any) {
        return apiService.put(`/admin/email-accounts/${id}`, data);
    }

    async deleteEmailAccount(id: number) {
        return apiService.delete(`/admin/email-accounts/${id}`);
    }

    async restoreEmailAccount(id: number) {
        return apiService.post(`/admin/email-accounts/${id}/restore`, {});
    }

    // Seasons
    async getSeasons() {
        return apiService.get('/abm/seasons');
    }

    async createSeason(data: any) {
        return apiService.post('/abm/seasons', data);
    }

    async updateSeason(id: number, data: any) {
        return apiService.put(`/abm/seasons/${id}`, data);
    }

    async deleteSeason(id: number) {
        return apiService.delete(`/abm/seasons/${id}`);
    }

    async restoreSeason(id: number) {
        return apiService.post(`/abm/seasons/${id}/restore`, {});
    }

    // Tournaments
    async getTournaments() {
        return apiService.get('/abm/tournaments');
    }

    async createTournament(data: any) {
        return apiService.post('/abm/tournaments', data);
    }

    async updateTournament(id: number, data: any) {
        return apiService.put(`/abm/tournaments/${id}`, data);
    }

    async deleteTournament(id: number) {
        return apiService.delete(`/abm/tournaments/${id}`);
    }

    async restoreTournament(id: number) {
        return apiService.post(`/abm/tournaments/${id}/restore`, {});
    }

    // Rulesets
    async getRulesets() {
        return apiService.get('/abm/rulesets');
    }

    async createRuleset(data: any) {
        return apiService.post('/abm/rulesets', data);
    }

    async updateRuleset(id: number, data: any) {
        return apiService.put(`/abm/rulesets/${id}`, data);
    }

    async deleteRuleset(id: number) {
        return apiService.delete(`/abm/rulesets/${id}`);
    }

    async restoreRuleset(id: number) {
        return apiService.post(`/abm/rulesets/${id}/restore`, {});
    }

    // Online Users
    async getOnlineUsers() {
        return apiService.get('/abm/online-users');
    }

    async createOnlineUser(data: any) {
        return apiService.post('/abm/online-users', data);
    }

    async updateOnlineUser(id: number, data: any) {
        return apiService.put(`/abm/online-users/${id}`, data);
    }

    async deleteOnlineUser(id: number) {
        return apiService.delete(`/abm/online-users/${id}`);
    }

    async restoreOnlineUser(id: number) {
        return apiService.post(`/abm/online-users/${id}/restore`, {});
    }

    // Tournament Results
    async getTournamentResults() {
        return apiService.get('/abm/tournament-results');
    }

    async createTournamentResult(data: any) {
        return apiService.post('/abm/tournament-results', data);
    }

    async updateTournamentResult(id: number, data: any) {
        return apiService.put(`/abm/tournament-results/${id}`, data);
    }

    async deleteTournamentResult(id: number) {
        return apiService.delete(`/abm/tournament-results/${id}`);
    }

    async restoreTournamentResult(id: number) {
        return apiService.post(`/abm/tournament-results/${id}/restore`, {});
    }

    // Rate Configs
    async getRateConfigs() {
        return apiService.get('/abm/rate-configs');
    }

    async createRateConfig(data: any) {
        return apiService.post('/abm/rate-configs', data);
    }

    async updateRateConfig(id: number, data: any) {
        return apiService.put(`/abm/rate-configs/${id}`, data);
    }

    async deleteRateConfig(id: number) {
        return apiService.delete(`/abm/rate-configs/${id}`);
    }

    async restoreRateConfig(id: number) {
        return apiService.post(`/abm/rate-configs/${id}/restore`, {});
    }

    // Dan Configs
    async getDanConfigs() {
        return apiService.get('/abm/dan-configs');
    }

    async createDanConfig(data: any) {
        return apiService.post('/abm/dan-configs', data);
    }

    async updateDanConfig(id: number, data: any) {
        return apiService.put(`/abm/dan-configs/${id}`, data);
    }

    async deleteDanConfig(id: number) {
        return apiService.delete(`/abm/dan-configs/${id}`);
    }

    async restoreDanConfig(id: number) {
        return apiService.post(`/abm/dan-configs/${id}/restore`, {});
    }

    // Season Configs
    async getSeasonConfigs() {
        return apiService.get('/abm/season-configs');
    }

    async createSeasonConfig(data: any) {
        return apiService.post('/abm/season-configs', data);
    }

    async updateSeasonConfig(id: number, data: any) {
        return apiService.put(`/abm/season-configs/${id}`, data);
    }

    async deleteSeasonConfig(id: number) {
        return apiService.delete(`/abm/season-configs/${id}`);
    }

    async restoreSeasonConfig(id: number) {
        return apiService.post(`/abm/season-configs/${id}/restore`, {});
    }
}

// Singleton instance
export const abmService = new AbmService();
