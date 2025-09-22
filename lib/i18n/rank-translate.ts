import { DEFAULT_LANGUAGE, STATIC_TRANSLATIONS, type SupportedLanguage } from '@/lib/i18n/static-translations';

export function translateDanRank(rankKey: string, language: SupportedLanguage = DEFAULT_LANGUAGE): string {
    const translations = STATIC_TRANSLATIONS[language] as any;
    const ranksMap = translations?.ranks as Record<string, string> | undefined;
    if (ranksMap && rankKey in ranksMap) {
        return ranksMap[rankKey];
    }
    return rankKey;
}


