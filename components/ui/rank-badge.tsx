'use client';

import { useI18nContext } from '@/components/providers/i18n-provider';
import { RankBadgeAuto } from './rank-badge-auto';

interface RankBadgeProps {
  rank: string;
  variant?: 'default' | 'compact' | 'detailed' | 'with-progress' | 'modern';
  className?: string;
  progress?: {
    current: number;
    max: number;
    percentage: number;
    nextRank: string;
    pointsToNext: number;
  };
  color?: string; // Color personalizado desde la base de datos
}

/**
 * Componente unificado para mostrar badges de rangos Dan
 * Formato: Solo kanji, tamaño fijo, tooltip condicional
 */
export function RankBadge({ rank, variant = 'default', className, progress, color }: RankBadgeProps) {
  const { language, t } = useI18nContext();

  // Usar RankBadgeAuto como base, que maneja todo automáticamente
  return (
    <RankBadgeAuto
      rank={rank}
      dbColor={color}
      size={variant === 'compact' ? 'sm' : 'md'}
      preferVioletHighDan={true}
      ariaLabel={language !== 'ja' ? t(`ranks.${rank}`, rank) : undefined}
      className={className}
    />
  );
}