"use client";

import { AbmService } from '@/lib/services/abm-service';
import { ApiService } from '@/lib/services/api-service';
import { GameService } from '@/lib/services/game-service';
import { PlayerService } from '@/lib/services/player-service';
import { PublicService } from '@/lib/services/public-service';
import { createContext, ReactNode, useContext } from 'react';

// Definir la interfaz de servicios
interface Services {
    api: ApiService;
    abm: AbmService;
    game: GameService;
    player: PlayerService;
    public: PublicService;
}

// Crear el contexto
const ServicesContext = createContext<Services | null>(null);

// Props del provider
interface ServicesProviderProps {
    children: ReactNode;
    services?: Partial<Services>; // Para testing/mocking
}

// Provider component
export function ServicesProvider({ children, services }: ServicesProviderProps) {
    // Instancias por defecto
    const defaultServices: Services = {
        api: new ApiService(),
        abm: new AbmService(),
        game: new GameService(),
        player: new PlayerService(),
        public: new PublicService(),
        ...services, // Override para testing
    };

    return (
        <ServicesContext.Provider value={defaultServices}>
            {children}
        </ServicesContext.Provider>
    );
}

// Hook para usar los servicios
export function useServices(): Services {
    const services = useContext(ServicesContext);
    if (!services) {
        throw new Error('useServices must be used within a ServicesProvider');
    }
    return services;
}

// Hooks específicos para cada servicio
export function useApiService(): ApiService {
    return useServices().api;
}

export function useAbmService(): AbmService {
    return useServices().abm;
}

export function useGameService(): GameService {
    return useServices().game;
}

export function usePlayerService(): PlayerService {
    return useServices().player;
}

export function usePublicService(): PublicService {
    return useServices().public;
}
