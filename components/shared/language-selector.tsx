'use client';

import { SUPPORTED_LANGUAGES, getLanguageFlag, getLanguageName, useI18nContext, type SupportedLanguage } from '@/components/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useEffect, useState } from 'react';

// ============================================================================
// 🌍 SELECTOR DE IDIOMA
// ============================================================================

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons';
  size?: 'sm' | 'lg' | 'default';
  className?: string;
}

export const LanguageSelector = ({
  variant = 'dropdown',
  size = 'default',
  className = ''
}: LanguageSelectorProps) => {
  const { language, setLanguage, t } = useI18nContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    console.log('🔄 Selector: Cambiando idioma de', language, 'a', newLanguage);
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-1 ${className}`}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <Button
            key={lang}
            variant={language === lang ? 'default' : 'outline'}
            size={size}
            onClick={() => handleLanguageChange(lang)}
            className="flex items-center gap-1 px-2 py-1 text-xs"
            title={getLanguageName(lang)}
          >
            <span>{getLanguageFlag(lang)}</span>
            <span className="hidden sm:inline">{lang.toUpperCase()}</span>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Select
        value={language}
        onValueChange={(value: string) => handleLanguageChange(value as SupportedLanguage)}
      >
        <SelectTrigger className={`w-auto min-w-[60px] ${size === 'sm' ? 'h-8 text-xs' : size === 'lg' ? 'h-12 text-base' : 'h-10 text-sm'}`}>
          <div className="flex items-center gap-1">
            {isMounted ? (
              <>
                <span>{getLanguageFlag(language)}</span>
                <span className="font-medium">
                  {language === 'en' ? 'EN' : language === 'es' ? 'ES' : language === 'ja' ? 'JP' : 'PT'}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">...</span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="min-w-[80px]">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang} value={lang}>
              <div className="flex items-center gap-2">
                <span>{getLanguageFlag(lang)}</span>
                <span className="font-medium">
                  {lang === 'en' ? 'EN' : lang === 'es' ? 'ES' : lang === 'ja' ? 'JP' : 'PT'}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Componente compacto para usar en navegación
export const CompactLanguageSelector = ({ className = '' }: { className?: string }) => {
  return (
    <LanguageSelector
      variant="dropdown"
      size="sm"
      className={className}
    />
  );
};

// Componente con botones para usar en admin
export const ButtonLanguageSelector = ({ className = '' }: { className?: string }) => {
  return (
    <LanguageSelector
      variant="buttons"
      size="sm"
      className={className}
    />
  );
};
