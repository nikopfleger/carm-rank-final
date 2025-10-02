// Servicio centralizado para llamadas API (similar a Angular services)
export class ApiService {
    private baseUrl = '/api';

    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error en la petición');
        }
        return response.json();
    }

    async post<T>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            let errorMessage = 'Error en la petición';
            try {
                const error = await response.json();
                errorMessage = error.message || error.error || `HTTP ${response.status}: ${response.statusText}`;
                console.error(`API Error ${response.status} en ${endpoint}:`, error);
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                console.error(`Error parseando respuesta de ${endpoint}:`, parseError);
            }
            throw new Error(errorMessage);
        }
        return response.json();
    }

    async put<T>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error en la petición');
        }
        return response.json();
    }

    async delete<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error en la petición');
        }
        return response.json();
    }

    async patch<T>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error en la petición');
        }
        return response.json();
    }

    async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            body: formData, // No establecer Content-Type, el navegador lo hace automáticamente
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error en la petición');
        }
        return response.json();
    }
}

// Singleton instance
export const apiService = new ApiService();
