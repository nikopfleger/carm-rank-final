import PlayerSingleAutocomplete, { Player } from "@/components/players/player-single-autocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { Minus, Plus, Save, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Tournament {
    id: number;
    name: string;
    type: string;
    startDate: string;
    endDate?: string;
    isCompleted: boolean;
    tournamentResults?: TournamentResultData[];
}

interface TournamentResultData {
    id?: number;
    position: number;
    pointsWon: number;
    prizeWon?: number;
    playerId: number;
    player: {
        id: number;
        nickname: string;
        fullname?: string;
        playerNumber?: number;
    };
}

// Player type is now imported from PlayerSingleAutocomplete

interface TournamentResultsEditorProps {
    tournament: Tournament;
    onSave(results: TournamentResultData[]): Promise<void>;
    onCancel(): void;
}

export function TournamentResultsEditor({
    tournament,
    onSave,
    onCancel
}: TournamentResultsEditorProps) {
    const { handleError } = useErrorHandler();
    const [results, setResults] = useState<TournamentResultData[]>([]);
    const [saving, setSaving] = useState(false);

    // Inicializar resultados existentes
    useEffect(() => {
        if (tournament.tournamentResults && tournament.tournamentResults.length > 0) {
            setResults([...tournament.tournamentResults].sort((a, b) => a.position - b.position));
        } else {
            // Inicializar con un resultado vacío
            setResults([createEmptyResult(1)]);
        }
    }, [tournament]);

    // Crear resultado vacío
    const createEmptyResult = (position: number): TournamentResultData => ({
        position,
        pointsWon: 0,
        prizeWon: 0,
        playerId: 0,
        player: {
            id: 0,
            nickname: '',
            fullname: ''
        }
    });

    // Agregar nuevo resultado
    const addResult = () => {
        const newPosition = results.length + 1;
        setResults([...results, createEmptyResult(newPosition)]);
    };

    // Eliminar resultado
    const removeResult = (index: number) => {
        const newResults = results.filter((_, i) => i !== index);
        // Reordenar posiciones
        const reorderedResults = newResults.map((result, i) => ({
            ...result,
            position: i + 1
        }));
        setResults(reorderedResults);
    };

    // Actualizar resultado
    const updateResult = (index: number, field: keyof TournamentResultData, value: any) => {
        const newResults = [...results];
        if (field === 'player') {
            // value es Player | null del autocomplete
            const selectedPlayer = value as Player | null;
            if (selectedPlayer) {
                newResults[index] = {
                    ...newResults[index],
                    playerId: selectedPlayer.id,
                    player: {
                        id: selectedPlayer.id,
                        nickname: selectedPlayer.nickname,
                        fullname: selectedPlayer.fullname,
                        playerNumber: selectedPlayer.playerNumber
                    }
                };
            } else {
                // Limpiar selección
                newResults[index] = {
                    ...newResults[index],
                    playerId: 0,
                    player: {
                        id: 0,
                        nickname: '',
                        fullname: ''
                    }
                };
            }
        } else {
            newResults[index] = {
                ...newResults[index],
                [field]: field === 'pointsWon' || field === 'prizeWon' ? parseFloat(value) || 0 : value
            };
        }
        setResults(newResults);
    };

    // Validar resultados
    const validateResults = (): string[] => {
        const errors: string[] = [];
        const usedPlayerIds = new Set<number>();
        const positions = new Set<number>();

        results.forEach((result, index) => {
            if (!result.playerId || result.playerId === 0) {
                errors.push(`Posición ${index + 1}: Debe seleccionar un jugador`);
            } else if (usedPlayerIds.has(result.playerId)) {
                errors.push(`Posición ${index + 1}: El jugador ya está asignado a otra posición`);
            } else {
                usedPlayerIds.add(result.playerId);
            }

            if (positions.has(result.position)) {
                errors.push(`Posición ${result.position}: Posición duplicada`);
            } else {
                positions.add(result.position);
            }

            if (result.pointsWon < 0) {
                errors.push(`Posición ${index + 1}: Los puntos no pueden ser negativos`);
            }
        });

        return errors;
    };

    // Guardar resultados
    const handleSave = async () => {
        const errors = validateResults();
        if (errors.length > 0) {
            alert(`Errores de validación:\n${errors.join('\n')}`);
            return;
        }

        setSaving(true);
        try {
            await onSave(results);
        } catch (error) {
            handleError(error, 'Guardar resultados');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5" />
                            Editar Resultados: {tournament.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Agrega jugadores y sus posiciones en el torneo
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent className="flex flex-col max-h-[calc(90vh-120px)]">
                    <div className="space-y-4">
                        {/* Botón para agregar resultado */}
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium">Resultados del Torneo</h3>
                            <Button onClick={addResult} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Jugador
                            </Button>
                        </div>

                        {/* Lista de resultados con scroll */}
                        <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                            {results.map((result, index) => {
                                // Obtener IDs de jugadores ya seleccionados (excluyendo el actual)
                                const excludePlayerIds = results
                                    .map((r, i) => i !== index ? r.playerId : null)
                                    .filter((id): id is number => id !== null && id !== 0);

                                // Convertir el jugador actual al formato esperado por el autocomplete
                                const selectedPlayer = result.playerId && result.playerId !== 0 ? {
                                    id: result.playerId,
                                    nickname: result.player.nickname,
                                    playerNumber: result.player.playerNumber || 0, // Usar el playerNumber si está disponible
                                    fullname: result.player.fullname
                                } as Player : null;

                                return (
                                    <Card key={index} className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                            {/* Posición */}
                                            <div>
                                                <Label htmlFor={`position-${index}`}>Posición</Label>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                                        {result.position}
                                                    </div>
                                                    <span className="text-sm text-gray-600">
                                                        {result.position === 1 ? '🥇' : result.position === 2 ? '🥈' : result.position === 3 ? '🥉' : '🏅'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Jugador con autocomplete */}
                                            <div>
                                                <Label htmlFor={`player-${index}`}>Jugador</Label>
                                                <PlayerSingleAutocomplete
                                                    selected={selectedPlayer}
                                                    onChange={(player) => updateResult(index, 'player', player)}
                                                    excludePlayerIds={excludePlayerIds}
                                                    placeholder="Buscar jugador..."
                                                />
                                            </div>

                                            {/* Puntos */}
                                            <div>
                                                <Label htmlFor={`points-${index}`}>Puntos</Label>
                                                <Input
                                                    id={`points-${index}`}
                                                    type="number"
                                                    step="0.1"
                                                    value={result.pointsWon}
                                                    onChange={(e) => updateResult(index, 'pointsWon', e.target.value)}
                                                    placeholder="0.0"
                                                />
                                            </div>

                                            {/* Premio (opcional) */}
                                            <div>
                                                <Label htmlFor={`prize-${index}`}>Premio (opcional)</Label>
                                                <Input
                                                    id={`prize-${index}`}
                                                    type="number"
                                                    step="0.01"
                                                    value={result.prizeWon || ''}
                                                    onChange={(e) => updateResult(index, 'prizeWon', e.target.value)}
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            {/* Acciones */}
                                            <div>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeResult(index)}
                                                    disabled={results.length <= 1}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Información adicional */}
                        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                            <div className="flex items-start gap-2">
                                <Trophy className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                                        Información del Torneo
                                    </h4>
                                    <div className="text-sm text-blue-700 dark:text-blue-200 mt-1 space-y-1">
                                        <p><strong>Tipo:</strong> {tournament.type}</p>
                                        <p><strong>Fecha:</strong> {new Date(tournament.startDate).toLocaleDateString()}</p>
                                        <p><strong>Estado:</strong> {tournament.isCompleted ? 'Completado' : 'En Curso'}</p>
                                        <p><strong>Participantes:</strong> {results.length}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </CardContent>

                {/* Botones de acción */}
                <div className="p-6 border-t flex justify-end gap-2">
                    <Button variant="outline" onClick={onCancel} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Resultados
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
