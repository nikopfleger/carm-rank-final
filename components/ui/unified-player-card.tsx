'use client';

import { Card } from '@/components/ui/card';
import { SkipLink } from './accessibility-enhancements';
import { PlayerProfileHeader } from './player-profile-header';
import { PlayerStatsSection } from './player-stats-section';

export interface UnifiedPlayerCardProps {
    // Header props
    playerData: {
        nickname: string;
        playerId: number;
        fullname?: string;
        country?: string;
        isActive: boolean;
        birthday?: string;
        onlineUsers?: Array<{
            platform: string;
            username?: string;
        }>;
    };
    onEditProfile?: () => void;
    submitting?: boolean;

    // Stats props
    currentDan: number;
    currentRank: any;
    nextRank: any;
    dbRankColor?: string;
    stats: any;
    generalStats: any;
    currentStats: any;
    seasonStats?: any;
    isSanma?: boolean;
    filteredChartData: any;

    // Props de vinculación
    isLinked?: boolean;
    isLinkedToCurrentUser?: boolean;
    onLinkRequest?: () => void;
    onUnlinkRequest?: () => void;
    isLinkRequestPending?: boolean;

    // Children (para contenido adicional como gráfico histórico)
    children?: React.ReactNode;
}

export function UnifiedPlayerCard({
    playerData,
    onEditProfile,
    submitting,
    currentDan,
    currentRank,
    nextRank,
    dbRankColor,
    stats,
    generalStats,
    currentStats,
    seasonStats,
    isSanma,
    filteredChartData,
    isLinked,
    isLinkedToCurrentUser,
    onLinkRequest,
    onUnlinkRequest,
    isLinkRequestPending,
    children
}: UnifiedPlayerCardProps) {
    return (
        <Card className="overflow-hidden">
            {/* Skip links para navegación rápida */}
            <SkipLink href="#player-stats">Saltar a estadísticas</SkipLink>
            <SkipLink href="#position-distribution">Saltar a distribución de posiciones</SkipLink>
            <SkipLink href="#historical-chart">Saltar a gráfico histórico</SkipLink>

            {/* Header sticky con perfil y filtros */}
            <PlayerProfileHeader
                playerData={playerData}
                onEditProfile={onEditProfile}
                submitting={submitting}
                isLinked={isLinked}
                isLinkedToCurrentUser={isLinkedToCurrentUser}
                onLinkRequest={onLinkRequest}
                onUnlinkRequest={onUnlinkRequest}
                isLinkRequestPending={isLinkRequestPending}
            />

            {/* Contenido principal */}
            <div className="p-6">
                <div id="player-stats">
                    <PlayerStatsSection
                        currentDan={currentDan}
                        currentRank={currentRank}
                        nextRank={nextRank}
                        dbRankColor={dbRankColor}
                        stats={stats}
                        generalStats={generalStats}
                        currentStats={currentStats}
                        seasonStats={seasonStats}
                        isSanma={isSanma}
                        filteredChartData={filteredChartData}
                    />
                </div>

                {/* Contenido adicional (gráfico histórico, etc.) */}
                <div id="historical-chart">
                    {children}
                </div>

                {/* Microcopy de contexto */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        <span aria-hidden="true">💡</span>
                        <span className="sr-only">Información:</span>
                        Los datos se actualizan en tiempo real. Los colores reflejan tu rendimiento promedio.
                    </p>
                </div>
            </div>
        </Card>
    );
}
