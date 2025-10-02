import { useI18nContext } from "@/components/providers/i18n-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    InfoChip,
    UnifiedBadge,
    UnifiedButton,
    UnifiedCard,
    UnifiedCardContent,
    UnifiedModal
} from "@/components/ui/unified";
import { formatYmdForDisplay, toYmd } from '@/lib/format-utils';
import {
    AlertTriangle,
    Award,
    BarChart3,
    Calendar,
    CheckCircle,
    Clock,
    Trophy,
    Users
} from "lucide-react";
import { useEffect, useState } from "react";

interface Tournament {
    id: number;
    name: string;
    startDate: Date;
    endDate?: Date;
    isCompleted: boolean;
    participantsCount?: number;
    gamesCount?: number;
    type?: string;
}

interface TournamentParticipant {
    playerId: number;
    playerNickname: string;
    totalPoints: number;
    gamesPlayed: number;
    position?: number;
}

interface TournamentFinalizeModalProps {
    isOpen: boolean;
    tournament: Tournament | null;
    participants?: TournamentParticipant[];
    onConfirm(): Promise<void>;
    onCancel(): void;
    loading?: boolean;
}

export function TournamentFinalizeModal({
    isOpen,
    tournament,
    participants = [],
    onConfirm,
    onCancel,
    loading = false
}: TournamentFinalizeModalProps) {
    const { t } = useI18nContext();
    const [confirmationStep, setConfirmationStep] = useState(0);
    const [userConfirmation, setUserConfirmation] = useState("");
    const [sortedParticipants, setSortedParticipants] = useState<TournamentParticipant[]>([]);

    // Ordenar participantes por puntos y asignar posiciones
    useEffect(() => {
        if (participants.length > 0) {
            const sorted = [...participants]
                .sort((a, b) => b.totalPoints - a.totalPoints)
                .map((participant, index) => ({
                    ...participant,
                    position: index + 1
                }));
            setSortedParticipants(sorted);
        }
    }, [participants]);

    const handleConfirm = async () => {
        if (confirmationStep === 0) {
            setConfirmationStep(1);
            return;
        }

        if (userConfirmation.toUpperCase() !== "FINALIZAR") {
            return;
        }

        await onConfirm();
        // Reset modal state
        setConfirmationStep(0);
        setUserConfirmation("");
    };

    const handleCancel = () => {
        setConfirmationStep(0);
        setUserConfirmation("");
        onCancel();
    };

    const formatDate = (date: Date) => {
        return formatYmdForDisplay(toYmd(date as any), 'es-AR');
    };

    const getDuration = (start: Date, end?: Date) => {
        const endDate = end || new Date();
        const diffTime = Math.abs(endDate.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Mismo día";
        if (diffDays === 1) return "1 día";
        if (diffDays < 30) return `${diffDays} días`;

        const months = Math.floor(diffDays / 30);
        const remainingDays = diffDays % 30;

        if (months === 1) {
            return remainingDays > 0 ? `1 mes y ${remainingDays} días` : "1 mes";
        }

        return remainingDays > 0 ? `${months} meses y ${remainingDays} días` : `${months} meses`;
    };

    const getPositionBadgeVariant = (position: number) => {
        switch (position) {
            case 1: return 'success';
            case 2: return 'warning';
            case 3: return 'info';
            default: return 'default';
        }
    };

    if (!tournament) return null;

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={handleCancel}
            title={confirmationStep === 0 ? "Finalizar Torneo" : "Confirmación Final"}
            description={confirmationStep === 0
                ? "Esta acción calculará los resultados finales y cerrará el torneo"
                : "Confirme que desea proceder con la finalización del torneo"
            }
            icon={confirmationStep === 0 ? Trophy : CheckCircle}
            iconColor={confirmationStep === 0 ? "bg-blue-100 dark:bg-blue-900/20" : "bg-green-100 dark:bg-green-900/20"}
            size="lg"
            closeOnOverlayClick={!loading}
            footer={
                <div className="flex gap-3 justify-end w-full">
                    <UnifiedButton
                        variant="cancel"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        Cancelar
                    </UnifiedButton>
                    <UnifiedButton
                        variant={confirmationStep === 0 ? "primary" : "approve"}
                        onClick={handleConfirm}
                        loading={loading}
                        disabled={confirmationStep === 1 && userConfirmation.toUpperCase() !== "FINALIZAR"}
                    >
                        {confirmationStep === 0 ? "Continuar" : "Finalizar Torneo"}
                    </UnifiedButton>
                </div>
            }
        >
            <div className="space-y-6">
                {confirmationStep === 0 ? (
                    <>
                        {/* Alerta principal */}
                        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                            <Trophy className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800 dark:text-blue-200">
                                <strong>Finalización de torneo:</strong> Se calcularán las posiciones finales basadas en los puntos
                                acumulados y se guardarán los resultados permanentemente.
                            </AlertDescription>
                        </Alert>

                        {/* Información del torneo */}
                        <UnifiedCard variant="bordered">
                            <UnifiedCardContent className="pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Trophy className="w-6 h-6 text-blue-600" />
                                        <div>
                                            <h3 className="font-semibold text-lg">{tournament.name}</h3>
                                            {tournament.type && (
                                                <p className="text-sm text-gray-600">{tournament.type}</p>
                                            )}
                                        </div>
                                    </div>
                                    <UnifiedBadge variant="warning" size="sm">
                                        Pendiente
                                    </UnifiedBadge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-600">Inicio:</span>
                                            <span className="font-medium">{formatDate(tournament.startDate)}</span>
                                        </div>
                                        {tournament.endDate && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-600">Fin:</span>
                                                <span className="font-medium">{formatDate(tournament.endDate)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-600">Duración:</span>
                                            <span className="font-medium">{getDuration(tournament.startDate, tournament.endDate)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {tournament.participantsCount && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Users className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-600">Participantes:</span>
                                                <span className="font-medium">{tournament.participantsCount}</span>
                                            </div>
                                        )}
                                        {tournament.gamesCount && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <BarChart3 className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-600">Juegos:</span>
                                                <span className="font-medium">{tournament.gamesCount}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </UnifiedCardContent>
                        </UnifiedCard>

                        {/* Resultados calculados */}
                        {sortedParticipants.length > 0 && (
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-gold-600" />
                                    Clasificación Final (Calculada)
                                </h4>

                                <UnifiedCard variant="flat">
                                    <UnifiedCardContent className="pt-4">
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {sortedParticipants.slice(0, 10).map((participant) => (
                                                <div key={participant.playerId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <UnifiedBadge
                                                            variant={getPositionBadgeVariant(participant.position!)}
                                                            size="sm"
                                                            className="min-w-[32px] justify-center"
                                                        >
                                                            {participant.position}°
                                                        </UnifiedBadge>
                                                        <div>
                                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                {participant.playerNickname}
                                                            </span>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {participant.gamesPlayed} juegos
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {participant.totalPoints.toFixed(1)} pts
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {sortedParticipants.length > 10 && (
                                                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                                                    ... y {sortedParticipants.length - 10} participantes más
                                                </div>
                                            )}
                                        </div>
                                    </UnifiedCardContent>
                                </UnifiedCard>
                            </div>
                        )}

                        {/* Proceso que se ejecutará */}
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                Proceso de Finalización
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span>Calcular posiciones finales basadas en puntos acumulados</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span>Guardar resultados en el historial de torneos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span>Marcar torneo como completado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span>Generar estadísticas finales del torneo</span>
                                </div>
                            </div>
                        </div>

                        {/* Advertencia sobre backup */}
                        <InfoChip icon={AlertTriangle}>
                            <strong>Recomendación:</strong> Asegúrese de tener un backup reciente de la base de datos
                            antes de proceder, ya que esta operación no se puede deshacer fácilmente.
                        </InfoChip>
                    </>
                ) : (
                    <>
                        {/* Confirmación final */}
                        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800 dark:text-red-200">
                                <strong>Última confirmación:</strong> Esta acción finalizará permanentemente el torneo
                                y calculará los resultados finales. No se puede deshacer.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Para continuar, escriba <strong>FINALIZAR</strong> en el campo siguiente:
                                </label>
                                <input
                                    type="text"
                                    value={userConfirmation}
                                    onChange={(e) => setUserConfirmation(e.target.value)}
                                    placeholder="Escriba FINALIZAR"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                    disabled={loading}
                                />
                            </div>

                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Se finalizará: <strong>{tournament.name}</strong><br />
                                Participantes: <strong>{sortedParticipants.length}</strong><br />
                                Ganador: <strong>{sortedParticipants[0]?.playerNickname || "N/A"}</strong>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </UnifiedModal>
    );
}
