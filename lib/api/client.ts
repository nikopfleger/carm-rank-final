// API client utilities for frontend components

const API_BASE_URL = '/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  totalUniqueGames?: number;
}

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'API call failed');
    }

    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

// Players API
export const playersApi = {
  getAll: (options?: { seasonId?: number; includeInactive?: boolean; type?: 'GENERAL' | 'TEMPORADA'; sanma?: boolean }) => {
    const params = new URLSearchParams();
    if (options?.seasonId) params.append('season_id', options.seasonId.toString());
    if (options?.includeInactive !== undefined) params.append('includeInactive', options.includeInactive.toString());
    if (options?.type) params.append('type', options.type);
    if (options?.sanma !== undefined) params.append('sanma', options.sanma.toString());

    return apiCall<any>(`/players${params.toString() ? `?${params.toString()}` : ''}`);
  },

  countGames: (options?: { includeInactive?: boolean; type?: 'GENERAL' | 'TEMPORADA'; sanma?: boolean }) => {
    const params = new URLSearchParams();
    if (options?.includeInactive !== undefined) params.append('includeInactive', options.includeInactive.toString());
    if (options?.type) params.append('type', options.type);
    if (options?.sanma !== undefined) params.append('sanma', options.sanma.toString());

    return apiCall<{ totalUniqueGames: number }>(`/players/count-games${params.toString() ? `?${params.toString()}` : ''}`);
  },

  getByLegajo: (legajo: number) =>
    apiCall<any>(`/players/${legajo}`),

  create: (playerData: {
    nickname: string;
    fullname?: string;
    country_id: number;
    player_id: number;
    birthday?: string;
  }) =>
    apiCall<any>('/players', {
      method: 'POST',
      body: JSON.stringify(playerData),
    }),
};

// Games API
export const gamesApi = {
  getPending: () =>
    apiCall<any[]>('/games?status=pending'),

  submit: (gameData: {
    game_length: 'HANCHAN' | 'TONPUUSEN';
    date_played: string;
    location_id: number;
    ruleset_id: number;
    season_id?: number;
    tournament_id?: number;
    players: Array<{
      player_id: number;
      score: number;
      chonbo: number;
    }>;
    image_url?: string;
  }) =>
    apiCall<{ game_id: number }>('/games', {
      method: 'POST',
      body: JSON.stringify(gameData),
    }),

  validate: (gameId: number, validatedBy: number) =>
    apiCall<void>(`/games/${gameId}/validate`, {
      method: 'POST',
      body: JSON.stringify({ validated_by: validatedBy }),
    }),

  reject: (gameId: number, reason: string) =>
    apiCall<void>(`/games/${gameId}/validate`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }),
};

// Seasons API
export const seasonsApi = {
  getAll: () =>
    apiCall<any[]>('/seasons'),

  getActive: () =>
    apiCall<any>('/seasons?active=true'),

  create: (seasonData: {
    name: string;
    start_date: string;
    end_date?: string;
    ruleset_id?: number;
    ranked_games_count?: boolean;
  }) =>
    apiCall<any>('/seasons', {
      method: 'POST',
      body: JSON.stringify(seasonData),
    }),

  update: (seasonId: number, updates: any) =>
    apiCall<any>(`/seasons/${seasonId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  archive: (seasonId: number) =>
    apiCall<void>(`/seasons/${seasonId}/archive`, {
      method: 'POST',
    }),

  getStatistics: (seasonId: number) =>
    apiCall<any>(`/seasons/${seasonId}/statistics`),
};

// Common data API
export const commonApi = {
  getCountries: () =>
    apiCall<any[]>('/common?type=countries'),

  getLocations: () =>
    apiCall<any[]>('/common?type=locations'),

  getRulesets: () =>
    apiCall<any[]>('/common?type=rulesets'),

  getUmaConfigurations: () =>
    apiCall<any[]>('/common?type=uma'),

  getOnlineApps: () =>
    apiCall<any[]>('/common?type=online_apps'),

  checkHealth: () =>
    apiCall<any>('/common?type=health'),

  initializeDatabase: () =>
    apiCall<void>('/common?action=initialize', {
      method: 'POST',
    }),
};

// Hook for easier data fetching in components
export function useApi() {
  return {
    players: playersApi,
    games: gamesApi,
    seasons: seasonsApi,
    common: commonApi,
  };
}
