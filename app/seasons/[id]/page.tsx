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
import Link from "next/link";
import { Suspense, use, useEffect, useState } from "react";
import styles from "./page.module.css";

interface Season {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

interface SeasonResult {
    id: number;
    seasonId: number;
    playerId: number;
    isSanma: boolean;
    seasonTotalGames: number;
    seasonAveragePosition: number;
    seasonPoints: number;
    player: {
        id: number;
        nickname: string;
        fullname: string | null;
    };
    season: {
        id: number;
        name: string;
    };
}

export default function SeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { handleError } = useErrorHandler();
    const publicService = usePublicService();
    const [season, setSeason] = useState<Season | null>(null);
    const [results, setResults] = useState<SeasonResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSeasonData = async () => {
            try {
                setLoading(true);
                const seasonId = parseInt(id);

                // Cargar datos de la temporada
                const seasonsResponse = await publicService.getSeasons();
                const seasonsData = (seasonsResponse as any)?.data || seasonsResponse;
                const seasonData = seasonsData.find((s: any) => s.id === seasonId);

                if (!seasonData) {
                    throw new Error('Temporada no encontrada');
                }

                setSeason({
                    id: seasonData.id,
                    name: seasonData.name,
                    startDate: seasonData.startDate,
                    endDate: seasonData.endDate,
                    isActive: seasonData.isActive
                });

                // Cargar resultados de la temporada
                const resultsResponse = await fetch(`/api/abm/season-results?seasonId=${seasonId}`);
                if (resultsResponse.ok) {
                    const resultsData = await resultsResponse.json();
                    // Mapear los datos para que coincidan con la interfaz
                    const mappedResults = resultsData.map((result: any) => ({
                        id: result.id,
                        seasonId: result.seasonId,
                        playerId: result.playerId,
                        isSanma: result.isSanma,
                        seasonTotalGames: result.seasonTotalGames,
                        seasonAveragePosition: parseFloat(result.seasonAveragePosition),
                        seasonPoints: parseFloat(result.seasonPoints),
                        player: {
                            id: result.playerId,
                            nickname: result.player?.nickname || 'Unknown',
                            fullname: result.player?.fullname || null
                        },
                        season: {
                            id: result.seasonId,
                            name: result.season?.name || 'Unknown'
                        }
                    }));

                    // Ordenar por puntos de temporada (descendente)
                    const sortedResults = mappedResults.sort((a: SeasonResult, b: SeasonResult) =>
                        b.seasonPoints - a.seasonPoints
                    );

                    // Asignar posiciones
                    sortedResults.forEach((result: SeasonResult, index: number) => {
                        (result as any).position = index + 1;
                    });

                    setResults(sortedResults);
                }
            } catch (error) {
                handleError(error, 'Cargar datos de la temporada');
            } finally {
                setLoading(false);
            }
        };

        loadSeasonData();
    }, [id, publicService, handleError]);

    if (loading) {
        return (
            <div className={styles.seasonDetailPage}>
                <PageSkeleton />
            </div>
        );
    }

    if (!season) {
        return (
            <div className={styles.seasonDetailPage}>
                <div className="text-center py-8">
                    <p>Temporada no encontrada</p>
                    <Link
                        href="/seasons"
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        ← Volver a Temporadas
                    </Link>
                </div>
            </div>
        );
    }


    return (
        <div className={styles.seasonDetailPage}>
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/seasons"
                    className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Temporadas
                </Link>

                <PageHeader
                    icon={Calendar}
                    title={season.name}
                    subtitle={`${formatYmdForDisplay(toYmd(season.startDate), 'es-AR')} - ${formatYmdForDisplay(toYmd(season.endDate), 'es-AR')}`}
                />
            </div>

            {/* Season Info */}
            <Card className={`mb-6 ${unifiedStyles.card}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Información de la Temporada
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-500">Fecha de Inicio</p>
                                <p className="font-medium">{formatYmdForDisplay(toYmd(season.startDate), 'es-AR')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-500">Fecha de Fin</p>
                                <p className="font-medium">{formatYmdForDisplay(toYmd(season.endDate), 'es-AR')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-500">Estado</p>
                                <p className="font-medium">{season.isActive ? 'Activa' : 'Completada'}</p>
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
                        Resultados de la Temporada
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {results.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No hay resultados disponibles para esta temporada</p>
                        </div>
                    ) : (
                        <Suspense fallback={<PageSkeleton />}>
                            <div className="space-y-3">
                                {results.map((result) => (
                                    <PlayerResultCard
                                        key={result.id}
                                        position={(result as any).position}
                                        player={{
                                            id: result.player.id,
                                            nickname: result.player.nickname,
                                            fullname: result.player.fullname
                                        }}
                                        stats={{
                                            positionAverage: result.seasonAveragePosition,
                                            seasonPoints: result.seasonPoints,
                                            totalGames: result.seasonTotalGames
                                        }}
                                        variant="season"
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
