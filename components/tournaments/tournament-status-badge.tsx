"use client";

import { UnifiedBadge } from "@/components/ui/unified";
import { AlertCircle, Calendar, Clock, Trophy } from "lucide-react";
import React from "react";

export type TournamentStatus =
    | 'upcoming'    // startDate > hoy
    | 'ongoing'     // startDate <= hoy <= endDate
    | 'completed'   // endDate < hoy && tiene TournamentResults
    | 'pending'     // endDate < hoy pero sin TournamentResults
    | 'no_end_date' // sin endDate definido

interface Tournament {
    id: number;
    name: string;
    startDate: Date;
    endDate?: Date;
    isCompleted: boolean;
    tournamentResults?: any[];
}

interface TournamentStatusBadgeProps {
    tournament: Tournament;
    className?: string;
}

export function getTournamentStatus(tournament: Tournament): TournamentStatus {
    const now = new Date();
    const start = new Date(tournament.startDate);
    const end = tournament.endDate ? new Date(tournament.endDate) : null;

    // Si no tiene fecha de fin, está en curso indefinidamente
    if (!end) {
        return start > now ? 'upcoming' : 'no_end_date';
    }

    // Si aún no ha empezado
    if (start > now) {
        return 'upcoming';
    }

    // Si está en el rango de fechas
    if (end >= now) {
        return 'ongoing';
    }

    // Si ya pasó la fecha de fin, verificar si tiene resultados
    const hasResults = tournament.isCompleted || (tournament.tournamentResults && tournament.tournamentResults.length > 0);
    return hasResults ? 'completed' : 'pending';
}

export function getTournamentStatusConfig(status: TournamentStatus) {
    switch (status) {
        case 'upcoming':
            return {
                variant: 'info' as const,
                icon: Calendar,
                label: 'Próximo',
                description: 'Aún no ha comenzado'
            };
        case 'ongoing':
            return {
                variant: 'warning' as const,
                icon: Clock,
                label: 'En Curso',
                description: 'Torneo activo'
            };
        case 'completed':
            return {
                variant: 'success' as const,
                icon: Trophy,
                label: 'Completado',
                description: 'Finalizado con resultados'
            };
        case 'pending':
            return {
                variant: 'danger' as const,
                icon: AlertCircle,
                label: 'Pendiente',
                description: 'Requiere finalización'
            };
        case 'no_end_date':
            return {
                variant: 'outline' as const,
                icon: Clock,
                label: 'Sin Fin',
                description: 'Sin fecha de finalización'
            };
        default:
            return {
                variant: 'default' as const,
                icon: AlertCircle,
                label: 'Desconocido',
                description: 'Estado no determinado'
            };
    }
}

export function TournamentStatusBadge({ tournament, className }: TournamentStatusBadgeProps) {
    const status = getTournamentStatus(tournament);
    const config = getTournamentStatusConfig(status);

    return (
        <UnifiedBadge
            variant={config.variant}
            icon={config.icon}
            className={className}
            title={config.description}
        >
            {config.label}
        </UnifiedBadge>
    );
}

// Hook para obtener estadísticas de estados de torneos
export function useTournamentStatusStats(tournaments: Tournament[]) {
    return React.useMemo(() => {
        const stats = {
            upcoming: 0,
            ongoing: 0,
            completed: 0,
            pending: 0,
            no_end_date: 0,
            total: tournaments.length
        };

        tournaments.forEach(tournament => {
            const status = getTournamentStatus(tournament);
            stats[status]++;
        });

        return stats;
    }, [tournaments]);
}

// Función para obtener torneos que requieren atención
export function getTournamentsRequiringAction(tournaments: Tournament[]) {
    return tournaments.filter(tournament => {
        const status = getTournamentStatus(tournament);
        return status === 'pending' || status === 'no_end_date';
    });
}

// Función para obtener el próximo torneo
export function getNextTournament(tournaments: Tournament[]) {
    const upcomingTournaments = tournaments
        .filter(tournament => getTournamentStatus(tournament) === 'upcoming')
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return upcomingTournaments[0] || null;
}

// Función para obtener torneos activos
export function getActiveTournaments(tournaments: Tournament[]) {
    return tournaments.filter(tournament => {
        const status = getTournamentStatus(tournament);
        return status === 'ongoing' || status === 'no_end_date';
    });
}
