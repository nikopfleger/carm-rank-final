import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';

interface ToggleSwitchProps {
  leftLabel: string;
  rightLabel: string;
  value: 'left' | 'right';
  onChange(value: 'left' | 'right'): void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

type SizeKey = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<SizeKey, {
  height: number;          // px del botón
  innerGap: number;        // margen interno para el slider (top/left/right/bottom)
  fontPx: number;          // tamaño de fuente para medir
  labelPadX: number;       // padding horizontal para el texto dentro del slider
  minSegmentWidth: number; // mínimo por segmento
  labelClass: string;      // tailwind para el texto
}> = {
  sm: { height: 32, innerGap: 4, fontPx: 12, labelPadX: 10, minSegmentWidth: 64, labelClass: 'text-xs' },
  md: { height: 40, innerGap: 4, fontPx: 14, labelPadX: 12, minSegmentWidth: 84, labelClass: 'text-sm' },
  lg: { height: 48, innerGap: 6, fontPx: 16, labelPadX: 14, minSegmentWidth: 104, labelClass: 'text-base' },
};

function measureTextPx(text: string, fontPx: number, fontFamily = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', fontWeight = 700) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return text.length * fontPx * 0.6; // fallback
  ctx.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
  return ctx.measureText(text).width;
}

export function ToggleSwitch({
  leftLabel,
  rightLabel,
  value,
  onChange,
  className,
  size = 'md',
}: ToggleSwitchProps) {
  const cfg = SIZE_MAP[size];

  // ancho de cada segmento = máx(anchoTexto(left), anchoTexto(right)) + padding interno
  const [segmentWidth, setSegmentWidth] = useState<number>(() => cfg.minSegmentWidth);

  useEffect(() => {
    const leftW = measureTextPx(leftLabel, cfg.fontPx);
    const rightW = measureTextPx(rightLabel, cfg.fontPx);
    const maxLabelW = Math.ceil(Math.max(leftW, rightW)) + cfg.labelPadX * 2;

    setSegmentWidth(Math.max(maxLabelW, cfg.minSegmentWidth));
  }, [leftLabel, rightLabel, cfg.fontPx, cfg.labelPadX, cfg.minSegmentWidth]);

  // botón total = dos segmentos + márgenes laterales del slider (innerGap * 2)
  const buttonWidth = useMemo(() => (segmentWidth * 2) + (cfg.innerGap * 2), [segmentWidth, cfg.innerGap]);
  // slider ocupa (segmento - 2*innerGap) para dejar margen a ambos lados
  const sliderWidth = useMemo(() => Math.max(segmentWidth - (cfg.innerGap * 2), 24), [segmentWidth, cfg.innerGap]);
  const sliderHeight = cfg.height - (cfg.innerGap * 2);

  // desplazamiento del slider cuando está a la derecha = ancho de un segmento
  const translateX = value === 'right' ? segmentWidth : 0;

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => onChange(value === 'left' ? 'right' : 'left')}
        className={cn(
          'relative rounded-full transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
        )}
        style={{
          width: buttonWidth,
          height: cfg.height,
        }}
      >
        {/* Slider */}
        <div
          className={cn(
            'absolute rounded-full shadow-lg transition-transform duration-500 ease-in-out',
            'bg-white dark:bg-gray-200'
          )}
          style={{
            top: cfg.innerGap,
            left: cfg.innerGap,
            width: sliderWidth,
            height: sliderHeight,
            transform: `translateX(${translateX}px)`,
            willChange: 'transform',
          }}
        >
          {/* Texto dentro del slider */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-black tracking-wider drop-shadow-sm text-gray-900', cfg.labelClass)}>
              {value === 'left' ? leftLabel : rightLabel}
            </span>
          </div>
        </div>

        {/* Labels de fondo (uno por segmento) */}
        <div
          className="absolute inset-0 flex items-center"
          // distribuimos los dos segmentos sin depender de padding fijo
          style={{ justifyContent: 'space-between' }}
        >
          {/* Segmento Izquierdo */}
          <div
            className="flex items-center justify-center"
            style={{ width: segmentWidth, height: '100%' }}
          >
            <span
              className={cn(
                'font-semibold transition-colors duration-300',
                cfg.labelClass,
                value === 'left' ? 'text-transparent' : 'text-gray-500 dark:text-gray-400'
              )}
              style={{ padding: `0 ${cfg.labelPadX}px` }}
            >
              {leftLabel}
            </span>
          </div>

          {/* Segmento Derecho */}
          <div
            className="flex items-center justify-center"
            style={{ width: segmentWidth, height: '100%' }}
          >
            <span
              className={cn(
                'font-semibold transition-colors duration-300',
                cfg.labelClass,
                value === 'right' ? 'text-transparent' : 'text-gray-500 dark:text-gray-400'
              )}
              style={{ padding: `0 ${cfg.labelPadX}px` }}
            >
              {rightLabel}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
