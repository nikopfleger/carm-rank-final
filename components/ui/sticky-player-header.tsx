'use client';

import { useI18nContext } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { CountryFlag } from "@/components/ui/country-flag";
import { SeparatorServer as Separator } from "@/components/ui/separator-server";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { unifiedStyles } from "@/components/ui/unified-styles";

interface StickyPlayerHeaderProps {
    nickname: string;
    playerId: number;
    isActive: boolean;
    country?: string;
    isSanma: boolean;
    onSanmaChange: (isSanma: boolean) => void;
    gameTypeFilter: 'HANCHAN' | 'TONPUUSEN' | 'TOTAL';
    setGameTypeFilter: (value: 'HANCHAN' | 'TONPUUSEN' | 'TOTAL') => void;
}

export function StickyPlayerHeader({
    nickname,
    playerId,
    isActive,
    country,
    isSanma,
    onSanmaChange,
    gameTypeFilter,
    setGameTypeFilter
}: StickyPlayerHeaderProps) {
    const { t } = useI18nContext();

    const playersValue = isSanma ? '3p' : '4p';
    const gameTypeValue = gameTypeFilter === 'TOTAL' ? 'all' : gameTypeFilter === 'HANCHAN' ? 'hanchan' : 'tonpuusen';

    return (
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container mx-auto px-4 py-3">
                {/* Layout responsive: columna en móvil, fila en desktop */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Datos básicos del jugador */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                            <div
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-base sm:text-lg font-bold"
                                role="img"
                                aria-label={`Avatar de ${nickname}`}
                            >
                                {nickname?.charAt(0) || '?'}
                            </div>
                            {isActive && (
                                <span
                                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-green-500 ring-2 ring-background"
                                    aria-label={t('player.profilePage.active', 'Activo')}
                                />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-xl font-semibold truncate text-foreground">
                                    {nickname}{' '}
                                    <span className="text-muted-foreground text-sm sm:text-base">(L{playerId})</span>
                                </h1>
                                <Badge
                                    variant={isActive ? 'default' : 'secondary'}
                                    className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5"
                                    role="status"
                                    aria-label={`Estado: ${isActive
                                        ? t('player.profilePage.active', 'Activo')
                                        : t('player.profilePage.inactive', 'Inactivo')
                                        }`}
                                >
                                    {isActive ? t('player.profilePage.active') : t('player.profilePage.inactive')}
                                </Badge>
                            </div>

                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                {country && (
                                    <CountryFlag
                                        countryCode={country}
                                        countryName={country}
                                        size="sm"
                                        aria-label={`País: ${country}`}
                                    />
                                )}
                                <span className="truncate">{country || 'ARG'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Controls - Responsive: stack en móvil, inline en desktop */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                        {/* Controles en una sola línea en móvil */}
                        <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
                            {/* Player count selector */}
                            <fieldset className="flex flex-col items-start min-w-0">
                                <legend className="text-[10px] sm:text-[11px] text-muted-foreground mb-1">
                                    {t("player.profilePage.players")}
                                </legend>
                                <ToggleGroup
                                    type="single"
                                    value={playersValue}
                                    onValueChange={(v) => v && onSanmaChange(v === '3p')}
                                    className={`${unifiedStyles.toggleGroup} scale-90 sm:scale-100`}
                                    aria-label={t("player.profilePage.players")}
                                >
                                    <ToggleGroupItem
                                        value="4p"
                                        className={`${unifiedStyles.toggleGroupItem} text-xs sm:text-sm px-2 sm:px-3`}
                                    >
                                        4p
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="3p"
                                        className={`${unifiedStyles.toggleGroupItem} text-xs sm:text-sm px-2 sm:px-3`}
                                    >
                                        3p
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </fieldset>

                            {/* Separador - oculto en móvil */}
                            <Separator orientation="vertical" className="hidden sm:block h-8 bg-border/40" />

                            {/* Game type selector */}
                            <fieldset className="flex flex-col items-start min-w-0 flex-1 sm:flex-initial">
                                <legend className="text-[10px] sm:text-[11px] text-muted-foreground mb-1">
                                    {t("player.profilePage.type")}
                                </legend>
                                <ToggleGroup
                                    type="single"
                                    value={gameTypeValue}
                                    onValueChange={(v) => {
                                        if (!v) return;
                                        const mapped = v === 'all' ? 'TOTAL' : v === 'hanchan' ? 'HANCHAN' : 'TONPUUSEN';
                                        setGameTypeFilter(mapped);
                                    }}
                                    className={`${unifiedStyles.toggleGroup} scale-90 sm:scale-100 w-full sm:w-auto`}
                                    aria-label={t("player.profilePage.type")}
                                >
                                    <ToggleGroupItem
                                        value="all"
                                        className={`${unifiedStyles.toggleGroupItem} text-xs sm:text-sm px-1.5 sm:px-3 flex-1 sm:flex-initial`}
                                    >
                                        {t('common.all', 'Todos')}
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="hanchan"
                                        className={`${unifiedStyles.toggleGroupItem} text-xs sm:text-sm px-1.5 sm:px-3 flex-1 sm:flex-initial`}
                                    >
                                        Hanchan
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="tonpuusen"
                                        className={`${unifiedStyles.toggleGroupItem} text-xs sm:text-sm px-1.5 sm:px-3 flex-1 sm:flex-initial`}
                                    >
                                        Tonpuusen
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </fieldset>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
