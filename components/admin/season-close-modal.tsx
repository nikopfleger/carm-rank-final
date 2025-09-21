"use client";

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
import {
    AlertTriangle,
    BarChart3,
    Calendar,
    CheckCircle,
    Clock,
    Trophy,
    Users
} from "lucide-react";
import { useState } from "react";

interface Season {
    id: number;
    name: string;
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
    gamesCount?: number;
    playersCount?: number;
}

interface SeasonStats {
    totalGames: number;
    totalPlayers: number;
    avgGamesPerPlayer: number;
    topPlayer?: {
        nickname: string;
        seasonPoints: number;
    };
}

interface SeasonCloseModalProps {
    isOpen: boolean;
    currentSeason: Season | null;
    newSeason: Season;
    seasonStats?: SeasonStats;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

export function SeasonCloseModal({
    isOpen,
    currentSeason,
    newSeason,
    seasonStats,
    onConfirm,
    onCancel,
    loading = false
}: SeasonCloseModalProps) {
    const { t } = useI18nContext();
    const [confirmationStep, setConfirmationStep] = useState(0);
    const [userConfirmation, setUserConfirmation] = useState("");

    const handleConfirm = async () => {
        if (confirmationStep === 0) {
            setConfirmationStep(1);
            return;
        }

        if (userConfirmation.toUpperCase() !== "CONFIRMAR") {
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

    const formatDate = (date: Date | undefined) => {
        if (!date) return 'No definida';
        return date.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getDuration = (start: Date, end?: Date) => {
        const endDate = end || new Date();
        const diffTime = Math.abs(endDate.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) {
            return `${diffDays} días`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} ${months === 1 ? 'mes' : 'meses'}`;
        } else {
            const years = Math.floor(diffDays / 365);
            const remainingMonths = Math.floor((diffDays % 365) / 30);
            return `${years} ${years === 1 ? 'año' : 'años'}${remainingMonths > 0 ? ` y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}` : ''}`;
        }
    };

    if (!currentSeason) {
        return (
            <UnifiedModal
                isOpen={isOpen}
                onClose={onCancel}
                title="Activar Nueva Temporada"
                description="No hay temporada activa actualmente"
                icon={Trophy}
                size="md"
                footer={
                    <div className="flex gap-3 justify-end w-full">
                        <UnifiedButton variant="cancel" onClick={onCancel}>
                            Cancelar
                        </UnifiedButton>
                        <UnifiedButton
                            variant="primary"
                            onClick={onConfirm}
                            loading={loading}
                        >
                            Activar Temporada
                        </UnifiedButton>
                    </div>
                }
            >
                <div className="space-y-4">
                    <InfoChip icon={Trophy}>
                        Se activará la temporada &quot;{newSeason.name}&quot; como temporada principal
                    </InfoChip>

                    <UnifiedCard variant="bordered">
                        <UnifiedCardContent className="pt-4">
                            <div className="flex items-center gap-3 mb-3">
                                <Trophy className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold">{newSeason.name}</h3>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Inicio: {formatDate(newSeason.startDate)}
                                </div>
                                {newSeason.endDate && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Fin programado: {formatDate(newSeason.endDate)}
                                    </div>
                                )}
                            </div>
                        </UnifiedCardContent>
                    </UnifiedCard>
                </div>
            </UnifiedModal>
        );
    }

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={handleCancel}
            title={confirmationStep === 0 ? "Cerrar Temporada Actual" : "Confirmación Final"}
            description={confirmationStep === 0
                ? "Esta acción cerrará la temporada activa y guardará todos los resultados"
                : "Confirme que desea proceder con el cierre de temporada"
            }
            icon={confirmationStep === 0 ? AlertTriangle : CheckCircle}
            iconColor={confirmationStep === 0 ? "bg-orange-100 dark:bg-orange-900/20" : "bg-green-100 dark:bg-green-900/20"}
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
                        disabled={confirmationStep === 1 && userConfirmation.toUpperCase() !== "CONFIRMAR"}
                    >
                        {confirmationStep === 0 ? "Continuar" : "Cerrar Temporada"}
                    </UnifiedButton>
                </div>
            }
        >
            <div className="space-y-6">
                {confirmationStep === 0 ? (
                    <>
                        {/* Alerta principal */}
                        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800 dark:text-orange-200">
                                <strong>Acción irreversible:</strong> Los resultados de la temporada se guardarán permanentemente
                                y los contadores de temporada se reiniciarán para todos los jugadores.
                            </AlertDescription>
                        </Alert>

                        {/* Temporada actual */}
                        <UnifiedCard variant="bordered">
                            <UnifiedCardContent className="pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Trophy className="w-5 h-5 text-orange-600" />
                                        <div>
                                            <h3 className="font-semibold text-lg">{currentSeason.name}</h3>
                                            <p className="text-sm text-gray-600">Temporada Activa</p>
                                        </div>
                                    </div>
                                    <UnifiedBadge variant="warning" size="sm">
                                        Activa
                                    </UnifiedBadge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-600">Inicio:</span>
                                            <span className="font-medium">{formatDate(currentSeason.startDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-600">Duración:</span>
                                            <span className="font-medium">{getDuration(currentSeason.startDate)}</span>
                                        </div>
                                    </div>

                                    {seasonStats && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <BarChart3 className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-600">Juegos:</span>
                                                <span className="font-medium">{seasonStats.totalGames}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Users className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-600">Jugadores:</span>
                                                <span className="font-medium">{seasonStats.totalPlayers}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {seasonStats?.topPlayer && (
                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Líder actual:</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{seasonStats.topPlayer.nickname}</span>
                                                <UnifiedBadge variant="success" size="sm">
                                                    {seasonStats.topPlayer.seasonPoints.toFixed(1)} pts
                                                </UnifiedBadge>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </UnifiedCardContent>
                        </UnifiedCard>

                        {/* Nueva temporada */}
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                Nueva Temporada a Activar
                            </h4>

                            <UnifiedCard variant="flat">
                                <UnifiedCardContent className="pt-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Trophy className="w-5 h-5 text-green-600" />
                                        <div>
                                            <h3 className="font-semibold">{newSeason.name}</h3>
                                            <p className="text-sm text-gray-600">Se activará automáticamente</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-600">Inicio:</span>
                                            <span className="font-medium">{formatDate(newSeason.startDate)}</span>
                                        </div>
                                        {newSeason.endDate && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-600">Fin programado:</span>
                                                <span className="font-medium">{formatDate(newSeason.endDate)}</span>
                                            </div>
                                        )}
                                    </div>
                                </UnifiedCardContent>
                            </UnifiedCard>
                        </div>

                        {/* Proceso que se ejecutará */}
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                Proceso de Cierre
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span>Guardar resultados finales en historial de temporadas</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span>Reiniciar contadores de temporada para todos los jugadores</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span>Activar nueva temporada para futuros juegos</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Confirmación final */}
                        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800 dark:text-red-200">
                                <strong>Última confirmación:</strong> Esta acción no se puede deshacer.
                                Los datos de la temporada actual se archivarán permanentemente.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Para continuar, escriba <strong>CONFIRMAR</strong> en el campo siguiente:
                                </label>
                                <input
                                    type="text"
                                    value={userConfirmation}
                                    onChange={(e) => setUserConfirmation(e.target.value)}
                                    placeholder="Escriba CONFIRMAR"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                    disabled={loading}
                                />
                            </div>

                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Se cerrará: <strong>{currentSeason.name}</strong><br />
                                Se activará: <strong>{newSeason.name}</strong>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </UnifiedModal>
    );
}
