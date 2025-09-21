'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';
import { useState } from 'react';

interface PositionInputProps {
    totalPlayers: number;
    onGoToPosition: (position: number) => void;
    className?: string;
}

export function PositionInput({ totalPlayers, onGoToPosition, className }: PositionInputProps) {
    const [value, setValue] = useState('');

    const go = () => {
        const n = parseInt(value, 10);
        if (!Number.isNaN(n) && n > 0) {
            onGoToPosition(Math.min(n, totalPlayers || n));
        }
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <label htmlFor="rank-position" className="sr-only">
                Ir a posición
            </label>

            {/* Wrapper con ring; sin overflow-hidden para que no corte el foco */}
            <div
                className="
          group relative flex items-center rounded-2xl border bg-muted/40
          px-3 focus-within:ring-2 focus-within:ring-brand-500/60
          focus-within:ring-offset-2 focus-within:ring-offset-background
        "
            >
                <Target aria-hidden className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />

                {/* Evitamos spinners del navegador usando text + inputMode=numeric */}
                <input
                    id="rank-position"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={value}
                    onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ''))}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            go();
                        }
                    }}
                    placeholder="Posición…"
                    className="
            h-10 w-[220px] sm:w-[260px] bg-transparent border-0 outline-none
            text-foreground placeholder:text-muted-foreground rounded-2xl
            pl-0 pr-1 py-0 min-w-0
          "
                    aria-label="Posición"
                />
            </div>

            <Button type="button" onClick={go} className="h-10 rounded-xl">
                Ir
            </Button>
        </div>
    );
}
