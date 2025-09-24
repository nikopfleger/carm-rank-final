"use client";

import { AbmService } from '@/lib/services/abm-service';
import { ApiService } from '@/lib/services/api-service';
import { GameService } from '@/lib/services/game-service';
import { PlayerService } from '@/lib/services/player-service';
import { PublicService } from '@/lib/services/public-service';
import { createContext, ReactNode, useContext, useMemo } from 'react';

interface Services {
    api: ApiService;
    abm: AbmService;
    game: GameService;
    player: PlayerService;
    public: PublicService;
}

const ServicesContext = createContext<Services | null>(null);

interface ServicesProviderProps {
    children: ReactNode;
    services?: Partial<Services>; // para tests/mocks
}

export function ServicesProvider({ children, services }: ServicesProviderProps) {
    // Instancias: si viene override lo usamos, si no creamos UNA sola vez (useMemo deps por override)
    const api = useMemo(() => services?.api ?? new ApiService(), [services?.api]);
    const abm = useMemo(() => services?.abm ?? new AbmService(), [services?.abm]);
    const game = useMemo(() => services?.game ?? new GameService(), [services?.game]);
    const player = useMemo(() => services?.player ?? new PlayerService(), [services?.player]);
    const pub = useMemo(() => services?.public ?? new PublicService(), [services?.public]);

    // Objeto de contexto con identidad estable
    const value = useMemo<Services>(() => ({
        api, abm, game, player, public: pub
    }), [api, abm, game, player, pub]);

    return (
        <ServicesContext.Provider value={value}>
            {children}
        </ServicesContext.Provider>
    );
}

export function useServices(): Services {
    const ctx = useContext(ServicesContext);
    if (!ctx) throw new Error('useServices must be used within a ServicesProvider');
    return ctx;
}

export const useApiService = () => useServices().api;
export const useAbmService = () => useServices().abm;
export const useGameService = () => useServices().game;
export const usePlayerService = () => useServices().player;
export const usePublicService = () => useServices().public;
