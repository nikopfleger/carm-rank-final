'use client';

import { useI18nContext } from '@/components/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { SeparatorServer as Separator } from '@/components/ui/separator-server';
import { unifiedStyles } from '@/components/ui/unified-styles';
import { cn } from '@/lib/utils';

interface PlayerProfileHeaderProps {
    playerData: {
        nickname: string;
        playerId: number;
        fullname?: string;
        country?: string; // ISO-2 esperado por CountryFlag (ej. "AR")
        isActive: boolean;
        birthday?: string;
        onlineUsers?: Array<{ platform: string; username?: string; idOnline?: string }>;
    };
    onEditProfile?: () => void;
    submitting?: boolean;
    isLinked?: boolean;
    isLinkedToCurrentUser?: boolean;
    onLinkRequest?: () => void;
    onUnlinkRequest?: () => void;
    isLinkRequestPending?: boolean;
    className?: string;
}

export function PlayerProfileHeader({
    playerData,
    onEditProfile,
    submitting,
    isLinked,
    isLinkedToCurrentUser,
    onLinkRequest,
    onUnlinkRequest,
    isLinkRequestPending,
    className,
}: PlayerProfileHeaderProps) {
    const { t } = useI18nContext();

    const formatDate = (dateString: string) => {
        try {
            // Si la fecha viene en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss.sssZ, extraer solo la parte de fecha
            const dateMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
                const [year, month, day] = dateMatch[1].split('-').map(Number);
                const date = new Date(year, month - 1, day); // month - 1 porque Date usa 0-indexado
                return date.toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } else {
                // Para otros formatos, usar el método original
                const date = new Date(dateString);
                return date.toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        } catch (error) {
            return dateString;
        }
    };

    return (
        <div
            className={cn(
                'bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
                className
            )}
        >
            <div className="px-6 pt-5 pb-4">
                <div className="flex items-start justify-between">
                    {/* Datos completos del jugador */}
                    <div className="flex-1">
                        {/* Nombre completo */}
                        {playerData.fullname && (
                            <div className="mb-3">
                                <h2 className="text-lg font-semibold text-foreground">
                                    {playerData.fullname}
                                </h2>
                            </div>
                        )}

                        {/* Fecha de nacimiento */}
                        {playerData.birthday && (
                            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                                <span>📅</span>
                                <span>{formatDate(playerData.birthday)}</span>
                            </div>
                        )}

                        {/* Cuentas online */}
                        {playerData.onlineUsers && playerData.onlineUsers.length > 0 && (
                            <div className="mb-3">
                                <h3 className="text-sm font-medium text-foreground mb-2">
                                    {t("player.profilePage.onlineUsers")}:
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {playerData.onlineUsers.map((account, index) => (
                                        <div key={index} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                                            <span className="text-muted-foreground">
                                                {account.platform === 'TENHOU' ? '🀄' :
                                                    account.platform === 'MAHJONG_SOUL' ? '🎮' :
                                                        account.platform === 'RIICHI_CITY' ? '🏙️' : '🌐'}
                                            </span>
                                            <span className="font-medium text-foreground">
                                                {account.platform === 'TENHOU' ? 'Tenhou' :
                                                    account.platform === 'MAHJONG_SOUL' ? 'Mahjong Soul' :
                                                        account.platform === 'RIICHI_CITY' ? 'Riichi City' :
                                                            account.platform}: {account.username}
                                                {account.idOnline && ` (${account.idOnline})`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Botones de acción a la derecha */}
                    <div className="flex flex-col items-end gap-2">
                        {/* Botón de editar perfil (solo si está vinculado al usuario actual) */}
                        {isLinkedToCurrentUser && onEditProfile && (
                            <Button
                                onClick={onEditProfile}
                                disabled={submitting}
                                className={unifiedStyles.smallButton}
                            >
                                {submitting ? 'Editando...' : 'Editar Perfil'}
                            </Button>
                        )}

                        {/* Botones de vinculación */}
                        {(() => {
                            console.log('Renderizando botones de vinculación:', { onLinkRequest: !!onLinkRequest, onUnlinkRequest: !!onUnlinkRequest, isLinked, isLinkRequestPending });
                            return null;
                        })()}
                        {onLinkRequest && !isLinked && (
                            <Button
                                onClick={() => {
                                    console.log('Botón de vincular presionado');
                                    onLinkRequest();
                                }}
                                disabled={isLinkRequestPending}
                                className={unifiedStyles.smallButton}
                            >
                                {isLinkRequestPending
                                    ? t("player.profilePage.sendingRequest")
                                    : t("player.profilePage.linkPlayer")
                                }
                            </Button>
                        )}
                        {onUnlinkRequest && isLinkedToCurrentUser && (
                            <Button
                                onClick={() => {
                                    console.log('Botón de desvincular presionado');
                                    onUnlinkRequest();
                                }}
                                disabled={submitting}
                                className={unifiedStyles.secondaryButton}
                            >
                                {submitting ? 'Desvinculando...' : 'Desvincular'}
                            </Button>
                        )}
                        {isLinkedToCurrentUser && (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="text-sm font-medium">
                                    {t("player.profilePage.youAreLinked")}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Línea divisoria del header */}
            <Separator />
        </div>
    );
}
