'use client';

// ============================================================================
// 🌍 TIPOS Y UTILIDADES DE INTERNACIONALIZACIÓN
// ============================================================================

import { getStaticTranslations, getStoredLanguage, setStoredLanguage, type SupportedLanguage } from '@/lib/i18n/static-translations';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type { SupportedLanguage };

export interface Translations {
  [key: string]: any;
}

export interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
  isLoading: boolean;
  isReady: boolean;
  hasError: boolean;
  translations: Translations;
  isClient: boolean;
}

// ============================================================================
// 🌍 PROVIDER DE INTERNACIONALIZACIÓN
// ============================================================================

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider = ({ children }: I18nProviderProps) => {
  // Siempre empezar con el idioma por defecto para evitar hydration mismatch
  const [language, setLanguageState] = useState<SupportedLanguage>('es');
  const [isClient, setIsClient] = useState(false);

  // Cargar traducciones estáticas inmediatamente
  const [translations, setTranslations] = useState<Record<string, any>>(() => {
    const staticTranslations = getStaticTranslations('es'); // Siempre empezar con español
    return staticTranslations;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Detectar cuando estamos en el cliente y cargar el idioma correcto
  useEffect(() => {
    setIsClient(true);

    // Cargar el idioma guardado en localStorage solo en el cliente
    const storedLang = getStoredLanguage();
    if (storedLang !== language) {
      setLanguageState(storedLang);
    }

    // Debug removido para compatibilidad serverless
  }, []);

  // Actualizar traducciones cuando cambia el idioma (usando traducciones estáticas)
  useEffect(() => {
    const newTranslations = getStaticTranslations(language);
    setTranslations(newTranslations);
  }, [language]);

  // Función para cambiar idioma
  const setLanguage = useCallback((newLanguage: SupportedLanguage) => {
    // Debug removido para compatibilidad serverless
    setLanguageState(newLanguage);
    setStoredLanguage(newLanguage);
  }, []); // ✅ Sin dependencias para evitar bucle infinito

  // Función para obtener traducción
  const t = useCallback((key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }

    const result = typeof value === 'string' ? value : (fallback || key);
    return result;
  }, [translations]);

  const contextValue = useMemo(() => {
    return {
      language,
      setLanguage,
      t,
      isLoading,
      isReady,
      hasError,
      translations,
      isClient
    };
  }, [language, translations, isLoading, isReady, hasError, isClient]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

// Hook para usar el contexto de i18n
export const useI18nContext = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18nContext must be used within an I18nProvider');
  }
  return context;
};

// ============================================================================
// 🌍 UTILIDADES PARA TRABAJAR CON IDIOMAS
// ============================================================================

export const getLanguageName = (code: SupportedLanguage): string => {
  const names = {
    es: 'Español',
    en: 'English',
    ja: '日本語'
  };
  return names[code];
};

export const getLanguageFlag = (code: SupportedLanguage): string => {
  const flags = {
    es: '🇪🇸',
    en: '🇺🇸',
    ja: '🇯🇵'
  };
  return flags[code];
};

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['es', 'en', 'ja'];
