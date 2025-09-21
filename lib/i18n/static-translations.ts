// ============================================================================
// 🌍 TRADUCCIONES ESTÁTICAS PARA CARGA RÁPIDA
// ============================================================================

import enTranslations from './translations/en.json';
import esTranslations from './translations/es.json';
import jaTranslations from './translations/ja.json';

export type SupportedLanguage = 'es' | 'en' | 'ja';

export const STATIC_TRANSLATIONS = {
    es: esTranslations,
    en: enTranslations,
    ja: jaTranslations,
} as const;

export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

// Función para obtener traducciones estáticas
export function getStaticTranslations(language: SupportedLanguage) {
    return STATIC_TRANSLATIONS[language] || STATIC_TRANSLATIONS[DEFAULT_LANGUAGE];
}

// Función para obtener idioma desde localStorage de forma segura
export function getStoredLanguage(): SupportedLanguage {
    if (typeof window === 'undefined') {
        return DEFAULT_LANGUAGE;
    }

    try {
        const stored = localStorage.getItem('carm-rank-language') as SupportedLanguage;
        if (stored && ['es', 'en', 'ja'].includes(stored)) {
            return stored;
        }
    } catch (error) {
        console.warn('Error reading language from localStorage:', error);
    }

    return DEFAULT_LANGUAGE;
}

// Función para guardar idioma en localStorage de forma segura
export function setStoredLanguage(language: SupportedLanguage): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.setItem('carm-rank-language', language);
    } catch (error) {
        console.warn('Error saving language to localStorage:', error);
    }
}
