'use client';

import { ReactNode } from 'react';
import { LoadingOverlay } from '../ui/loading-overlay';
import { useI18nContext } from './i18n-provider';

interface I18nWrapperProps {
  children: ReactNode;
}

export function I18nWrapper({ children }: I18nWrapperProps) {
  const { isReady, language } = useI18nContext();

  // Si las traducciones no están listas, mostrar loading
  if (!isReady) {
    const loadingMessage = language === 'es' 
      ? 'Cargando idioma...' 
      : 'Loading language...';
    
    return <LoadingOverlay message={loadingMessage} size="lg" fullScreen={true} />;
  }

  // Si están listas, mostrar el contenido
  return <>{children}</>;
}
