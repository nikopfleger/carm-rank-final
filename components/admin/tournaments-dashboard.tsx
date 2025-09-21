"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import {
    TournamentStatusBadge,
    getActiveTournaments,
    getNextTournament,
    getTournamentStatus,
    getTournamentsRequiringAction,
    useTournamentStatusStats
} from "@/components/tournaments/tournament-status-badge";
import {
    InfoChip,
    UnifiedCard,
    UnifiedCardContent,
    UnifiedCardHeader,
    UnifiedCardTitle
} from "@/components/ui/unified";
import {
    AlertTriangle,
    BarChart3,
    Calendar,
    Clock,
    Trophy,
    Users
} from "lucide-react";

interface TournamentDashboard {
    id: number;
    name: string;
    startDate: Date;
    endDate?: Date;
    isCompleted: boolean;
    tournamentResults?: any[];
    participantsCount?: number;
    gamesCount?: number;
}

interface TournamentsDashboardProps {
    tournaments: TournamentDashboard[];
    loading?: boolean;
    onFinalizeTournament?: (tournament: TournamentDashboard) => void;
}

export function TournamentsDashboard({
    tournaments,
    loading = false,
    onFinalizeTournament
}: TournamentsDashboardProps) {
    const { t } = useI18nContext();
    const stats = useTournamentStatusStats(tournaments);
    const tournamentsRequiringAction = getTournamentsRequiringAction(tournaments);
    const nextTournament = getNextTournament(tournaments);
    const activeTournaments = getActiveTournaments(tournaments);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getDaysUntil = (date: Date) => {
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Mañana';
        if (diffDays > 0) return `En ${diffDays} días`;
        if (diffDays === -1) return 'Ayer';
        return `Hace ${Math.abs(diffDays)} días`;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <UnifiedCard key={i} className="animate-pulse">
                            <UnifiedCardContent className="pt-6">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                            </UnifiedCardContent>
                        </UnifiedCard>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Estadísticas generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <UnifiedCard variant="bordered">
                    <UnifiedCardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Torneos
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {stats.total}
                                </p>
                            </div>
                            <Trophy className="w-8 h-8 text-blue-600" />
                        </div>
                    </UnifiedCardContent>
                </UnifiedCard>

                <UnifiedCard variant="bordered">
                    <UnifiedCardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    En Curso
                                </p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {stats.ongoing + stats.no_end_date}
                                </p>
                            </div>
                            <Clock className="w-8 h-8 text-orange-600" />
                        </div>
                    </UnifiedCardContent>
                </UnifiedCard>

                <UnifiedCard variant="bordered">
                    <UnifiedCardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Completados
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    {stats.completed}
                                </p>
                            </div>
                            <Trophy className="w-8 h-8 text-green-600" />
                        </div>
                    </UnifiedCardContent>
                </UnifiedCard>

                <UnifiedCard variant="bordered">
                    <UnifiedCardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Requieren Atención
                                </p>
                                <p className="text-2xl font-bold text-red-600">
                                    {tournamentsRequiringAction.length}
                                </p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                    </UnifiedCardContent>
                </UnifiedCard>
            </div>

            {/* Alertas y acciones requeridas */}
            {tournamentsRequiringAction.length > 0 && (
                <UnifiedCard variant="bordered" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <UnifiedCardHeader icon={AlertTriangle} iconColor="bg-red-100 dark:bg-red-900/20">
                        <UnifiedCardTitle className="text-red-800 dark:text-red-200">
                            Torneos que Requieren Atención
                        </UnifiedCardTitle>
                    </UnifiedCardHeader>
                    <UnifiedCardContent>
                        <div className="space-y-3">
                            {tournamentsRequiringAction.map(tournament => {
                                const status = getTournamentStatus(tournament);
                                return (
                                    <div key={tournament.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                    {tournament.name}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {tournament.endDate ? (
                                                        <>Finalizó: {formatDate(tournament.endDate)} ({getDaysUntil(tournament.endDate)})</>
                                                    ) : (
                                                        <>Iniciado: {formatDate(tournament.startDate)} (Sin fecha de fin)</>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TournamentStatusBadge tournament={tournament} />
                                            {status === 'pending' && onFinalizeTournament && (
                                                <button
                                                    onClick={() => onFinalizeTournament(tournament)}
                                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                                >
                                                    Finalizar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </UnifiedCardContent>
                </UnifiedCard>
            )}

            {/* Próximo torneo */}
            {nextTournament && (
                <UnifiedCard variant="gradient">
                    <UnifiedCardHeader icon={Calendar} iconColor="bg-blue-100 dark:bg-blue-900/20">
                        <UnifiedCardTitle>Próximo Torneo</UnifiedCardTitle>
                    </UnifiedCardHeader>
                    <UnifiedCardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                    {nextTournament.name}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span>Inicio: {formatDate(nextTournament.startDate)}</span>
                                    <InfoChip icon={Clock}>
                                        {getDaysUntil(nextTournament.startDate)}
                                    </InfoChip>
                                </div>
                            </div>
                            <TournamentStatusBadge tournament={nextTournament} />
                        </div>
                    </UnifiedCardContent>
                </UnifiedCard>
            )}

            {/* Torneos activos */}
            {activeTournaments.length > 0 && (
                <UnifiedCard variant="elevated">
                    <UnifiedCardHeader icon={Clock} iconColor="bg-orange-100 dark:bg-orange-900/20">
                        <UnifiedCardTitle>Torneos Activos</UnifiedCardTitle>
                    </UnifiedCardHeader>
                    <UnifiedCardContent>
                        <div className="space-y-3">
                            {activeTournaments.map(tournament => (
                                <div key={tournament.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                {tournament.name}
                                            </h4>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                <span>Inicio: {formatDate(tournament.startDate)}</span>
                                                {tournament.endDate && (
                                                    <span>Fin: {formatDate(tournament.endDate)}</span>
                                                )}
                                                {(tournament as any).participantsCount != null && (
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        <span>{(tournament as any).participantsCount} participantes</span>
                                                    </div>
                                                )}
                                                {(tournament as any).gamesCount && (
                                                    <div className="flex items-center gap-1">
                                                        <BarChart3 className="w-4 h-4" />
                                                        <span>{(tournament as any).gamesCount} juegos</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <TournamentStatusBadge tournament={tournament} />
                                </div>
                            ))}
                        </div>
                    </UnifiedCardContent>
                </UnifiedCard>
            )}

            {/* Estado vacío */}
            {tournaments.length === 0 && (
                <UnifiedCard variant="flat">
                    <UnifiedCardContent className="pt-12 pb-12 text-center">
                        <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No hay torneos
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Aún no se han creado torneos en el sistema.
                        </p>
                    </UnifiedCardContent>
                </UnifiedCard>
            )}
        </div>
    );
}
