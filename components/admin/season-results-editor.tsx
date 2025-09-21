"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// Tabs component not available, using simple state-based tabs
import { useErrorHandler } from "@/hooks/use-error-handler";
import { Calendar, Edit, Save, Trophy, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
// Simple number formatting function
const formatNumber = (num: number, decimals: number = 0) => {
    return num.toLocaleString('es-AR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

interface Season {
    id: number;
    name: string;
    startDate: string;
    endDate?: string;
    isActive: boolean;
    isClosed: boolean;
    seasonResults?: SeasonResultData[];
}

interface SeasonResultData {
    id?: number;
    seasonId: number;
    playerId: number;
    isSanma: boolean;
    seasonTotalGames: number;
    seasonAveragePosition: number;
    seasonFirstPlaceH: number;
    seasonSecondPlaceH: number;
    seasonThirdPlaceH: number;
    seasonFourthPlaceH: number;
    seasonFirstPlaceT: number;
    seasonSecondPlaceT: number;
    seasonThirdPlaceT: number;
    seasonFourthPlaceT: number;
    seasonPoints: number;
    player: {
        id: number;
        nickname: string;
        fullname?: string;
        playerNumber: number;
    };
}

interface Player {
    id: number;
    nickname: string;
    fullname?: string;
    playerNumber: number;
}

interface SeasonResultsEditorProps {
    season: Season;
    onSave: (results: SeasonResultData[]) => Promise<void>;
    onCancel: () => void;
}

export function SeasonResultsEditor({
    season,
    onSave,
    onCancel
}: SeasonResultsEditorProps) {
    const { handleError } = useErrorHandler();
    const [results4p, setResults4p] = useState<SeasonResultData[]>([]);
    const [results3p, setResults3p] = useState<SeasonResultData[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'4p' | '3p'>('4p');
    const [editingMode, setEditingMode] = useState(false);
    const [editingResultId, setEditingResultId] = useState<string | number | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Cargar jugadores disponibles
    useEffect(() => {
        const loadPlayers = async () => {
            try {
                const response = await fetch('/api/abm/players');
                if (response.ok) {
                    const data = await response.json();
                    setPlayers(data);
                }
            } catch (error) {
                handleError(error, 'Cargar jugadores');
            }
        };

        loadPlayers();
    }, []);

    // Separar resultados por modo de juego
    useEffect(() => {
        if (season.seasonResults) {
            const results4pFiltered = season.seasonResults.filter(r => !r.isSanma);
            const results3pFiltered = season.seasonResults.filter(r => r.isSanma);

            // Ordenar por puntos de temporada (descendente)
            setResults4p(results4pFiltered.sort((a, b) => b.seasonPoints - a.seasonPoints));
            setResults3p(results3pFiltered.sort((a, b) => b.seasonPoints - a.seasonPoints));
        }
    }, [season]);

    // Funciones para manejar edición
    const updateResult = (resultId: string | number, field: keyof SeasonResultData, value: any, isSanma: boolean) => {
        const setter = isSanma ? setResults3p : setResults4p;

        setter(prevResults =>
            prevResults.map(result =>
                (result.id || `${result.playerId}-${result.isSanma}`) === resultId
                    ? { ...result, [field]: value }
                    : result
            )
        );
        setHasChanges(true);
    };

    const startEditing = (resultId: string | number) => {
        setEditingResultId(resultId);
        setEditingMode(true);
    };

    const stopEditing = () => {
        setEditingResultId(null);
        setEditingMode(false);
    };

    // Calcular estadísticas de la temporada
    const calculateSeasonStats = (results: SeasonResultData[]) => {
        if (results.length === 0) return null;

        const totalGames = results.reduce((sum, r) => sum + r.seasonTotalGames, 0);
        const totalPlayers = results.length;
        const avgGamesPerPlayer = totalGames / totalPlayers;

        return {
            totalPlayers,
            totalGames,
            avgGamesPerPlayer: Math.round(avgGamesPerPlayer * 10) / 10
        };
    };

    // Renderizar tabla de resultados
    const renderResultsTable = (results: SeasonResultData[], isSanma: boolean) => {
        const stats = calculateSeasonStats(results);

        if (results.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    No hay resultados para {isSanma ? '3 jugadores (Sanma)' : '4 jugadores'}
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {/* Estadísticas generales */}
                {stats && (
                    <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-blue-900 dark:text-blue-100">Jugadores:</span>
                                <div className="text-blue-700 dark:text-blue-200">{stats.totalPlayers}</div>
                            </div>
                            <div>
                                <span className="font-medium text-blue-900 dark:text-blue-100">Juegos Totales:</span>
                                <div className="text-blue-700 dark:text-blue-200">{stats.totalGames}</div>
                            </div>
                            <div>
                                <span className="font-medium text-blue-900 dark:text-blue-100">Promedio por Jugador:</span>
                                <div className="text-blue-700 dark:text-blue-200">{stats.avgGamesPerPlayer}</div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Tabla de resultados */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800">
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">#</th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Jugador</th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center">Juegos</th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center">Promedio</th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center">1º H</th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center">2º H</th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center">3º H</th>
                                {!isSanma && <th className="border border-gray-300 dark:border-gray-600 p-2 text-center">4º H</th>}
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center">1º T</th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center">2º T</th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center">3º T</th>
                                {!isSanma && <th className="border border-gray-300 dark:border-gray-600 p-2 text-center">4º T</th>}
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center font-bold">Puntos</th>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((result, index) => {
                                const isEditing = editingResultId === (result.id || `${result.playerId}-${result.isSanma}`);

                                return (
                                    <tr key={result.id || `${result.playerId}-${result.isSanma}`}
                                        className={index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-center font-bold">
                                            {index + 1}
                                            {index === 0 && <span className="ml-1">🥇</span>}
                                            {index === 1 && <span className="ml-1">🥈</span>}
                                            {index === 2 && <span className="ml-1">🥉</span>}
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 p-2">
                                            <div>
                                                <div className="font-medium">{result.player.nickname}</div>
                                                <div className="text-xs text-gray-500">#{result.player.playerNumber}</div>
                                            </div>
                                        </td>
                                        {/* Juegos Totales */}
                                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={result.seasonTotalGames}
                                                    onChange={(e) => updateResult(
                                                        result.id || `${result.playerId}-${result.isSanma}`,
                                                        'seasonTotalGames',
                                                        parseInt(e.target.value) || 0,
                                                        isSanma
                                                    )}
                                                    className="w-20 h-8 text-center"
                                                    min="0"
                                                />
                                            ) : (
                                                result.seasonTotalGames
                                            )}
                                        </td>
                                        {/* Promedio */}
                                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={result.seasonAveragePosition}
                                                    onChange={(e) => updateResult(
                                                        result.id || `${result.playerId}-${result.isSanma}`,
                                                        'seasonAveragePosition',
                                                        parseFloat(e.target.value) || 0,
                                                        isSanma
                                                    )}
                                                    className="w-20 h-8 text-center"
                                                    min="1"
                                                    max={isSanma ? "3" : "4"}
                                                />
                                            ) : (
                                                formatNumber(result.seasonAveragePosition, 2)
                                            )}
                                        </td>
                                        {/* 1º H */}
                                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={result.seasonFirstPlaceH}
                                                    onChange={(e) => updateResult(
                                                        result.id || `${result.playerId}-${result.isSanma}`,
                                                        'seasonFirstPlaceH',
                                                        parseInt(e.target.value) || 0,
                                                        isSanma
                                                    )}
                                                    className="w-16 h-8 text-center"
                                                    min="0"
                                                />
                                            ) : (
                                                result.seasonFirstPlaceH
                                            )}
                                        </td>
                                        {/* 2º H */}
                                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={result.seasonSecondPlaceH}
                                                    onChange={(e) => updateResult(
                                                        result.id || `${result.playerId}-${result.isSanma}`,
                                                        'seasonSecondPlaceH',
                                                        parseInt(e.target.value) || 0,
                                                        isSanma
                                                    )}
                                                    className="w-16 h-8 text-center"
                                                    min="0"
                                                />
                                            ) : (
                                                result.seasonSecondPlaceH
                                            )}
                                        </td>
                                        {/* 3º H */}
                                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={result.seasonThirdPlaceH}
                                                    onChange={(e) => updateResult(
                                                        result.id || `${result.playerId}-${result.isSanma}`,
                                                        'seasonThirdPlaceH',
                                                        parseInt(e.target.value) || 0,
                                                        isSanma
                                                    )}
                                                    className="w-16 h-8 text-center"
                                                    min="0"
                                                />
                                            ) : (
                                                result.seasonThirdPlaceH
                                            )}
                                        </td>
                                        {/* 4º H - solo para 4 jugadores */}
                                        {!isSanma && (
                                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                                {isEditing ? (
                                                    <Input
                                                        type="number"
                                                        value={result.seasonFourthPlaceH}
                                                        onChange={(e) => updateResult(
                                                            result.id || `${result.playerId}-${result.isSanma}`,
                                                            'seasonFourthPlaceH',
                                                            parseInt(e.target.value) || 0,
                                                            isSanma
                                                        )}
                                                        className="w-16 h-8 text-center"
                                                        min="0"
                                                    />
                                                ) : (
                                                    result.seasonFourthPlaceH
                                                )}
                                            </td>
                                        )}
                                        {/* 1º T */}
                                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={result.seasonFirstPlaceT}
                                                    onChange={(e) => updateResult(
                                                        result.id || `${result.playerId}-${result.isSanma}`,
                                                        'seasonFirstPlaceT',
                                                        parseInt(e.target.value) || 0,
                                                        isSanma
                                                    )}
                                                    className="w-16 h-8 text-center"
                                                    min="0"
                                                />
                                            ) : (
                                                result.seasonFirstPlaceT
                                            )}
                                        </td>
                                        {/* 2º T */}
                                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={result.seasonSecondPlaceT}
                                                    onChange={(e) => updateResult(
                                                        result.id || `${result.playerId}-${result.isSanma}`,
                                                        'seasonSecondPlaceT',
                                                        parseInt(e.target.value) || 0,
                                                        isSanma
                                                    )}
                                                    className="w-16 h-8 text-center"
                                                    min="0"
                                                />
                                            ) : (
                                                result.seasonSecondPlaceT
                                            )}
                                        </td>
                                        {/* 3º T */}
                                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={result.seasonThirdPlaceT}
                                                    onChange={(e) => updateResult(
                                                        result.id || `${result.playerId}-${result.isSanma}`,
                                                        'seasonThirdPlaceT',
                                                        parseInt(e.target.value) || 0,
                                                        isSanma
                                                    )}
                                                    className="w-16 h-8 text-center"
                                                    min="0"
                                                />
                                            ) : (
                                                result.seasonThirdPlaceT
                                            )}
                                        </td>
                                        {/* 4º T - solo para 4 jugadores */}
                                        {!isSanma && (
                                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                                {isEditing ? (
                                                    <Input
                                                        type="number"
                                                        value={result.seasonFourthPlaceT}
                                                        onChange={(e) => updateResult(
                                                            result.id || `${result.playerId}-${result.isSanma}`,
                                                            'seasonFourthPlaceT',
                                                            parseInt(e.target.value) || 0,
                                                            isSanma
                                                        )}
                                                        className="w-16 h-8 text-center"
                                                        min="0"
                                                    />
                                                ) : (
                                                    result.seasonFourthPlaceT
                                                )}
                                            </td>
                                        )}
                                        {/* Puntos */}
                                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-center font-bold text-lg">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={result.seasonPoints}
                                                    onChange={(e) => updateResult(
                                                        result.id || `${result.playerId}-${result.isSanma}`,
                                                        'seasonPoints',
                                                        parseFloat(e.target.value) || 0,
                                                        isSanma
                                                    )}
                                                    className="w-20 h-8 text-center font-bold"
                                                />
                                            ) : (
                                                formatNumber(result.seasonPoints, 1)
                                            )}
                                        </td>
                                        {/* Acción */}
                                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                            {isEditing ? (
                                                <div className="flex gap-1 justify-center">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={stopEditing}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => startEditing(result.id || `${result.playerId}-${result.isSanma}`)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Guardar resultados
    const handleSave = async () => {
        if (!hasChanges) {
            alert('No hay cambios pendientes para guardar.');
            return;
        }

        // Confirmar antes de guardar
        if (!confirm('¿Estás seguro de que quieres guardar los cambios? Esta acción modificará los resultados oficiales de la temporada.')) {
            return;
        }

        setSaving(true);
        try {
            // Combinar todos los resultados
            const allResults = [...results4p, ...results3p];
            await onSave(allResults);
            setHasChanges(false);
            setEditingMode(false);
            setEditingResultId(null);
        } catch (error) {
            handleError(error, 'Guardar cambios');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-7xl max-h-[90vh] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5" />
                            Resultados: {season.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(season.startDate).toLocaleDateString()} - {season.endDate ? new Date(season.endDate).toLocaleDateString() : 'Activa'}
                            {season.isClosed && <span className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Cerrada</span>}
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
                    {/* Simple tab navigation */}
                    <div className="w-full">
                        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                            <button
                                onClick={() => setActiveTab('4p')}
                                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === '4p'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Users className="h-4 w-4" />
                                4 Jugadores ({results4p.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('3p')}
                                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === '3p'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Users className="h-4 w-4" />
                                3 Jugadores ({results3p.length})
                            </button>
                        </div>

                        {/* Tab content */}
                        <div className="mt-6">
                            {activeTab === '4p' && renderResultsTable(results4p, false)}
                            {activeTab === '3p' && renderResultsTable(results3p, true)}
                        </div>
                    </div>

                    {/* Información adicional */}
                    <Card className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20">
                        <div className="flex items-start gap-2">
                            <Trophy className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                                    Información de la Temporada
                                </h4>
                                <div className="text-sm text-blue-700 dark:text-blue-200 mt-1 space-y-1">
                                    <p><strong>Estado:</strong> {season.isClosed ? 'Cerrada' : season.isActive ? 'Activa' : 'Inactiva'}</p>
                                    <p><strong>Participantes 4p:</strong> {results4p.length}</p>
                                    <p><strong>Participantes 3p:</strong> {results3p.length}</p>
                                    <p><strong>Total Participantes:</strong> {results4p.length + results3p.length}</p>
                                </div>
                                <div className="mt-3 text-xs text-blue-600 dark:text-blue-300">
                                    💡 Los resultados se generan automáticamente al cerrar la temporada. Puedes editarlos usando el botón ✏️ en cada fila para corregir datos incorrectos (especialmente útil durante migraciones).
                                </div>
                            </div>
                        </div>
                    </Card>
                </CardContent>

                {/* Botones de acción */}
                <div className="p-6 border-t flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {hasChanges && (
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium">Cambios sin guardar</span>
                            </div>
                        )}
                        {editingMode && (
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                <Edit className="h-4 w-4" />
                                <span className="text-sm">Modo edición activo</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (hasChanges) {
                                    if (confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar sin guardar?')) {
                                        onCancel();
                                    }
                                } else {
                                    onCancel();
                                }
                            }}
                        >
                            Cerrar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            className={hasChanges ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Guardando...' : hasChanges ? 'Guardar Cambios' : 'Sin Cambios'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
