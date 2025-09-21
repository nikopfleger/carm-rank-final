'use client';

import { useI18nContext } from '@/components/providers/i18n-provider';
import { Card } from '@/components/ui/card';
import { RankBadgeAuto } from '@/components/ui/rank-badge-auto';
import { unifiedStyles } from '@/components/ui/unified-styles';
import { fmtInt, fmtPct1 } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

interface DanConfig {
    rank: string;
    minPoints: number;
    maxPoints: number;
    color: string;
}

interface DanProgressCardProps {
    currentDan: number;
    danConfig: DanConfig | null;
    nextDanConfig: DanConfig | null;
    dbColor?: string;
    className?: string;
    dense?: boolean;
}

export function DanProgressCard({
    currentDan,
    danConfig,
    nextDanConfig,
    dbColor,
    className,
    dense = false,
}: DanProgressCardProps) {
    const { t } = useI18nContext();
    if (!danConfig) return null;

    const bandStart = danConfig.minPoints;
    const bandEnd = danConfig.maxPoints;
    const bandRange = Math.max(1, bandEnd - bandStart);
    const withinBand = Math.max(0, Math.min(currentDan - bandStart, bandRange));
    const progressPct = Math.max(0, Math.min((withinBand / bandRange) * 100, 100));
    const pointsToNext = nextDanConfig ? Math.max(0, nextDanConfig.minPoints - currentDan) : 0;

    const rangoLabel = `${fmtInt(bandStart)}–${fmtInt(bandEnd)}`;
    const activeColor = dbColor || danConfig.color;

    const pad = dense ? 'p-4' : 'p-6';
    const gapYBlock = dense ? 'space-y-1.5' : 'space-y-2';

    return (
        <Card className={cn(`${pad} ${unifiedStyles.card}`, className)}>
            {/* bloque superior: insignia y rango */}
            <div className={cn('flex flex-col items-center text-center', gapYBlock)} title={t(`ranks.${danConfig.rank}`, danConfig.rank)}>
                <RankBadgeAuto
                    rank={danConfig.rank}
                    dbColor={activeColor}
                    size={dense ? 'sm' : 'md'}
                    preferVioletHighDan
                />
                <div className="text-xs text-muted-foreground tabular-nums">
                    {rangoLabel} {t('player.profilePage.pointsShort', 'pts')}
                </div>
            </div>

            {/* separador */}
            <div className="my-3 h-px w-full bg-border/60" />

            {/* bloque progreso */}
            <div className="flex flex-col items-center text-center space-y-2">
                {/* título */}
                <div className="text-sm font-semibold text-foreground/90">
                    {t('player.profilePage.progressTo', 'Progreso a')}{' '}
                    <span title={nextDanConfig ? t(`ranks.${nextDanConfig.rank}`, nextDanConfig.rank) : ''}>
                        {nextDanConfig ? nextDanConfig.rank : t('player.profilePage.nextRank', 'siguiente rango')}
                    </span>
                </div>

                {/* progreso dentro de la banda */}
                <div className="text-xs text-muted-foreground tabular-nums">
                    {fmtInt(Math.round(withinBand))}/{fmtInt(bandRange)} {t('player.profilePage.pointsShort', 'pts')}
                </div>

                {/* faltan X puntos */}
                {pointsToNext > 0 && (
                    <div className="text-xs text-muted-foreground tabular-nums">
                        {t('player.profilePage.pointsToNext', 'Faltan')} {fmtInt(pointsToNext)}{' '}
                        {t('player.profilePage.pointsShort', 'pts')}{' '}
                        {t('player.profilePage.for', 'para')}{' '}
                        <span title={nextDanConfig ? t(`ranks.${nextDanConfig.rank}`, nextDanConfig.rank) : ''}>
                            {nextDanConfig ? nextDanConfig.rank : t('player.profilePage.nextRank', 'siguiente rango')}
                        </span>
                    </div>
                )}

                {/* label + porcentaje en la misma fila */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground tabular-nums">
                    <span>{t('player.profilePage.progressWithinBand', 'Progreso dentro del rango')}</span>
                    <span>{fmtPct1(progressPct)}</span>
                </div>

                {/* barra */}
                <div
                    className="h-3 w-full rounded-full bg-muted"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progressPct)}
                    aria-label={t('player.profilePage.progressWithinBand', 'Progreso dentro del rango')}
                >
                    <div
                        className="h-3 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${progressPct}%`, backgroundColor: activeColor }}
                    />
                </div>
            </div>
        </Card>
    );
}
