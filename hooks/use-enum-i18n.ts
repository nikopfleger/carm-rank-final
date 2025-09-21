// ============================================================================
// 🌍 HOOK PARA MANEJAR ENUMS CON I18N
// ============================================================================

import { useI18nContext } from '@/components/providers/i18n-provider';
import { GameDurationEnum, GameTypeEnum, getEnumOptions, getEnumTranslation, OnlinePlatform, PointsTypeEnum, TournamentType, WindEnum } from '@/lib/enum/i18n-enums';

export function useEnumI18n() {
    const { t, translations } = useI18nContext();

    // Mapas de traducciones por idioma (objetos, no strings)
    const tt = (translations?.tournament?.types ?? {}) as Record<string, string>;
    const gt = (translations?.enums?.gameTypes ?? {}) as Record<string, string>;
    const pt = (translations?.enums?.pointsTypes ?? {}) as Record<string, string>;
    const op = (translations?.enums?.onlinePlatforms ?? {}) as Record<string, string>;
    const wd = (translations?.enums?.winds ?? {}) as Record<string, string>;
    const gd = (translations?.enums?.gameDurations ?? {}) as Record<string, string>;

    // Opciones
    const tournamentTypeOptions = getEnumOptions(TournamentType, tt);
    const gameTypeOptions = getEnumOptions(GameTypeEnum, gt);
    const pointsTypeOptions = getEnumOptions(PointsTypeEnum, pt);
    const onlinePlatformOptions = getEnumOptions(OnlinePlatform, op);
    const windOptions = getEnumOptions(WindEnum, wd);
    const gameDurationOptions = getEnumOptions(GameDurationEnum, gd);

    // Traducciones individuales
    const getTournamentTypeLabel = (value: string) => getEnumTranslation(value, tt);
    const getGameTypeLabel = (value: string) => getEnumTranslation(value, gt);
    const getPointsTypeLabel = (value: string) => getEnumTranslation(value, pt);
    const getOnlinePlatformLabel = (value: string) => getEnumTranslation(value, op);
    const getWindLabel = (value: string) => getEnumTranslation(value, wd);
    const getGameDurationLabel = (value: string) => getEnumTranslation(value, gd);

    return {
        // Opciones para formularios
        tournamentTypeOptions,
        gameTypeOptions,
        pointsTypeOptions,
        onlinePlatformOptions,
        windOptions,
        gameDurationOptions,

        // Funciones de traducción
        getTournamentTypeLabel,
        getGameTypeLabel,
        getPointsTypeLabel,
        getOnlinePlatformLabel,
        getWindLabel,
        getGameDurationLabel
    };
}
