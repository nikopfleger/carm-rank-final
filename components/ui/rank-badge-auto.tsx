'use client';

import { cn } from '@/lib/utils';
import React from 'react';

type Variant = 'subtle' | 'elevated' | 'metal';
type Size = 'sm' | 'md';

/** ========== Base visual reutilizable (Fancy) ========== */
function FancyRankBadge({
    label,
    color,          // hex base del rango (ej '#f59e0b')
    size = 'md',
    variant = 'elevated',
    ariaLabel,
    className,
    forceDarkText = false, // para 新人
}: {
    label: string;
    color: string;
    size?: Size;
    variant?: Variant;
    ariaLabel?: string;
    className?: string;
    forceDarkText?: boolean;
}) {
    const h = size === 'sm' ? 'h-6 text-[11px] px-2.5' : 'h-7 text-xs px-3';
    const minW = size === 'sm' ? 'min-w-[64px]' : 'min-w-[72px]';
    return (
        <span
            role="status"
            aria-label={ariaLabel ?? label}
            className={cn(
                'fancy-badge relative inline-flex items-center justify-center rounded-full font-semibold tracking-wide whitespace-nowrap',
                minW,
                forceDarkText ? 'text-[#0b1220]' : 'text-white',
                'focus:outline-none focus-visible:ring-2',
                h,
                {
                    'fancy-badge--subtle': variant === 'subtle',
                    'fancy-badge--elevated': variant === 'elevated',
                    'fancy-badge--metal': variant === 'metal',
                },
                className
            )}
            style={{ ['--c' as any]: color } as React.CSSProperties}
        >
            {label}
        </span>
    );
}

/** ========== Utils de parsing/mapeo ========== */
const KANJI_NUM: Record<string, number> = {
    '初': 1, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
};

function parseRank(rank: string): { tier: 'newbie' | 'kyu' | 'dan' | 'kamuro'; level?: number } {
    const r = rank.trim();

    if (r === '神室王') return { tier: 'kamuro' };
    if (r === '新人') return { tier: 'newbie' };

    // 1級 / ９級 / 9級
    const kyuNum = r.match(/(\d+)\s*級/);
    if (kyuNum) return { tier: 'kyu', level: Number(kyuNum[1]) };

    const kyuKanji = r.match(/([一二三四五六七八九十])\s*級/);
    if (kyuKanji) return { tier: 'kyu', level: KANJI_NUM[kyuKanji[1]] };

    // 初段 / 二段 / 10段
    if (r.includes('段')) {
        if (r.startsWith('初')) return { tier: 'dan', level: 1 };
        const danNum = r.match(/(\d+)\s*段/);
        if (danNum) return { tier: 'dan', level: Number(danNum[1]) };
        const danKanji = r.match(/([一二三四五六七八九十])\s*段/);
        if (danKanji) return { tier: 'dan', level: KANJI_NUM[danKanji[1]] };
    }

    // fallback: trátalo como etiqueta libre
    return { tier: 'kyu', level: 9 };
}

// Azules escalonados para Kyu 9→1
const KYU_SCALE: Record<number, string> = {
    9: '#60A5FA', // blue-400
    8: '#60A5FA',
    7: '#60A5FA',
    6: '#3B82F6', // blue-500
    5: '#3B82F6',
    4: '#3B82F6',
    3: '#2563EB', // blue-600
    2: '#2563EB',
    1: '#1D4ED8', // blue-700
};

function isHex(c?: string) {
    return !!c && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c);
}

/** ========== Lógica de mapeo automático ========== */
export function getRankTheme(
    rank: string,
    dbColor?: string,
    opts?: { preferVioletHighDan?: boolean }
): { color: string; variant: Variant; forceDarkText?: boolean } {
    const { tier, level } = parseRank(rank);
    const preferViolet = !!opts?.preferVioletHighDan;

    // Si viene un color válido desde la DB, lo respetamos como base por defecto
    const base = isHex(dbColor) ? (dbColor as string) : undefined;

    if (tier === 'newbie') {
        // Fondo más oscuro para mejor contraste y texto blanco
        return { color: base ?? '#6B7280', variant: 'elevated', forceDarkText: false };
    }

    if (tier === 'kyu') {
        const lv = Math.min(9, Math.max(1, level ?? 9));
        const color = KYU_SCALE[lv] ?? base ?? '#3B82F6';
        return { color, variant: 'elevated' };
    }

    if (tier === 'dan') {
        const lv = Math.min(10, Math.max(1, level ?? 1));
        // bloques por prestigio (puede sobreescribir dbColor para coherencia)
        if (lv <= 3) {
            return { color: '#10B981', variant: 'elevated' }; // emerald-500
        }
        if (lv <= 6) {
            return { color: '#F59E0B', variant: 'elevated' }; // amber-500
        }
        if (lv <= 8) {
            return { color: '#D97706', variant: 'metal' };    // amber-600 (más profundo)
        }
        // 9–10段
        if (preferViolet) {
            return { color: '#7C3AED', variant: 'metal' };    // violet-600 (premium)
        }
        return { color: base ?? '#EF4444', variant: 'metal' }; // rojo (DB) si no se prefiere violeta
    }

    // 神室王
    if (tier === 'kamuro') {
        return { color: base ?? '#A855F7', variant: 'metal' }; // violet premium
    }

    // fallback
    return { color: base ?? '#3B82F6', variant: 'elevated' };
}

/** ========== Wrapper listo para usar ========== */
export function RankBadgeAuto({
    rank,
    dbColor,
    size = 'md',
    preferVioletHighDan = true, // recomendado: deja el rojo solo para semántica negativa
    ariaLabel,
    className,
}: {
    rank: string;
    dbColor?: string;
    size?: Size;
    preferVioletHighDan?: boolean;
    ariaLabel?: string;
    className?: string;
}) {
    const theme = getRankTheme(rank, dbColor, { preferVioletHighDan });
    return (
        <FancyRankBadge
            label={rank}
            color={theme.color}
            variant={theme.variant}
            size={size}
            forceDarkText={!!theme.forceDarkText}
            ariaLabel={ariaLabel}
            className={className}
        />
    );
}
