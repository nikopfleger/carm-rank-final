"use client";

import { usePublicService } from "@/components/providers/services-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Award, Calendar, Trophy, Users } from "@/components/ui/icons";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { PlayerResultCard } from "@/components/ui/player-result-card";
import { unifiedStyles } from "@/components/ui/unified-styles";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { formatYmdForDisplay, toYmd } from '@/lib/format-utils';
import { useRouter } from "next/navigation";
import { Suspense, use, useEffect, useState } from "react";
import styles from "./page.module.css";

interface Tournament {
    id: number;
    name: string;
    type: string;
    startDate: string;
    endDate: string;
    isCompleted: boolean;
    location?: {
        id: number;
        name: string;
    };
    season?: {
        id: number;
        name: string;
    };
}

interface TournamentResult {
    id: number;
    position: number;
    points: number;
    player: {
        id: number;
        nickname: string;
        fullname: string | null;
    };
}

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { handleError } = useErrorHandler();
    const publicService = usePublicService();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [results, setResults] = useState<TournamentResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTournamentData = async () => {
            try {
                setLoading(true);
                const tournamentId = parseInt(id);

                // Cargar datos del torneo
                const tournamentResponse = await publicService.getTournament(tournamentId);
                const tournamentData = (tournamentResponse as any)?.data || tournamentResponse;
                setTournament(tournamentData);

                // Cargar resultados del torneo
                const resultsResponse = await fetch(`/api/abm/tournament-results?tournamentId=${tournamentId}`);
                if (resultsResponse.ok) {
                    const resultsData = await resultsResponse.json();
                    // Mapear los datos para que coincidan con la interfaz
                    const mappedResults = resultsData.map((result: any) => ({
                        id: result.id,
                        position: result.position,
                        points: result.pointsWon,
                        player: {
                            id: result.playerId,
                            nickname: result.player?.nickname || 'Unknown',
                            fullname: result.player?.fullname || null
                        }
                    }));
                    setResults(mappedResults);
                }
            } catch (error) {
                handleError(error, 'Cargar datos del torneo');
            } finally {
                setLoading(false);
            }
        };

        loadTournamentData();
    }, [id, publicService, handleError]);

    if (loading) {
        return (
            <div className={styles.tournamentDetailPage}>
                <PageSkeleton />
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className={styles.tournamentDetailPage}>
                <div className="text-center py-8">
                    <p>Torneo no encontrado</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        ← Volver
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className={styles.tournamentDetailPage}>
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Torneos
                </button>

                <PageHeader
                    icon={Trophy}
                    title={tournament.name}
                    subtitle={`${tournament.type} • ${tournament.season?.name || 'Sin temporada'}`}
                />
            </div>

            {/* Tournament Info */}
            <Card className={`mb-6 ${unifiedStyles.card}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Información del Torneo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-500">Fecha de Inicio</p>
                                <p className="font-medium">{formatYmdForDisplay(toYmd(tournament.startDate), 'es-AR')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-500">Fecha de Fin</p>
                                <p className="font-medium">{formatYmdForDisplay(toYmd(tournament.endDate), 'es-AR')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-500">Tipo</p>
                                <p className="font-medium">{tournament.type}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-500">Participantes</p>
                                <p className="font-medium">{results.length} jugadores</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            <Card className={unifiedStyles.card}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Resultados del Torneo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {results.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No hay resultados disponibles para este torneo</p>
                        </div>
                    ) : (
                        <Suspense fallback={<PageSkeleton />}>
                            <div className="space-y-3">
                                {results
                                    .sort((a, b) => a.position - b.position)
                                    .map((result) => (
                                        <PlayerResultCard
                                            key={result.id}
                                            position={result.position}
                                            player={{
                                                id: result.player.id,
                                                nickname: result.player.nickname,
                                                fullname: result.player.fullname
                                            }}
                                            stats={{
                                                seasonPoints: result.points
                                            }}
                                            variant="tournament"
                                            showTrend={false}
                                            showRank={false}
                                            showCountry={false}
                                        />
                                    ))}
                            </div>
                        </Suspense>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
