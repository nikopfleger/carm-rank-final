import { apiService } from './api-service';

// Servicio específico para ABM (similar a Angular services)
export class AbmService {
    // ===== Generic helpers used by unified ABM =====
    async list(resource: string, options?: { includeDeleted?: boolean; deleted?: boolean; onlyDeleted?: boolean; search?: string }) {
        const params = new URLSearchParams();
        if (options?.includeDeleted) params.set('includeDeleted', 'true');
        if (options?.deleted) params.set('deleted', 'true');
        if (options?.onlyDeleted) params.set('onlyDeleted', 'true');
        if (options?.search) params.set('search', options.search);
        const qs = params.toString();
        return apiService.get(`/abm/${resource}${qs ? `?${qs}` : ''}`);
    }

    async getOne(resource: string, id: number | string) {
        return apiService.get(`/abm/${resource}/${id}`);
    }

    async create(resource: string, data: any) {
        return apiService.post(`/abm/${resource}`, data);
    }

    async update(resource: string, id: number | string, data: any) {
        return apiService.put(`/abm/${resource}/${id}`, data);
    }

    async remove(resource: string, id: number | string) {
        return apiService.delete(`/abm/${resource}/${id}`);
    }

    async restore(resource: string, id: number | string) {
        return apiService.post(`/abm/${resource}/${id}/restore`, {});
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

    // Seasons (usar genéricos list/create/update/remove/restore)

    // Tournaments (usar genéricos)

    // Rulesets (usar genéricos)

    // Online Users (usar genéricos)

    // Tournament Results (usar genéricos)

    // Rate Configs (usar genéricos)

    // Dan Configs (usar genéricos)

    // Season Configs (usar genéricos)
}

// Singleton instance
export const abmService = new AbmService();
