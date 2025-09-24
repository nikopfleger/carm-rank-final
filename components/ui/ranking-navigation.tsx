import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Target, User } from 'lucide-react';
import React, { useState } from 'react';

interface RankingNavigationProps {
    totalPlayers: number;
    currentPlayerPosition?: number;
    onGoToPosition(position: number): void;
    onGoToMyPosition(): void;
    className?: string;
}

export function RankingNavigation({
    totalPlayers,
    currentPlayerPosition,
    onGoToPosition,
    onGoToMyPosition,
    className,
}: RankingNavigationProps) {
    const [positionInput, setPositionInput] = useState('');

    const handleGoToPosition = (e: React.FormEvent) => {
        e.preventDefault();
        const position = parseInt(positionInput);
        if (position >= 1 && position <= totalPlayers) {
            onGoToPosition(position);
            setPositionInput('');
        }
    };

    const canGoToMyPosition = currentPlayerPosition && currentPlayerPosition <= totalPlayers;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Ir a mi posición - solo si el usuario tiene ranking */}
            {canGoToMyPosition && (
                <Button
                    variant="default"
                    size="sm"
                    onClick={onGoToMyPosition}
                    className="flex items-center gap-2 h-9"
                >
                    <User className="h-4 w-4" />
                    Ir a mi posición (#{currentPlayerPosition})
                </Button>
            )}

            {/* Ir a posición específica */}
            <form onSubmit={handleGoToPosition} className="flex gap-2">
                <div className="relative">
                    <Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="number"
                        placeholder="Ir a posición #"
                        value={positionInput}
                        onChange={(e) => setPositionInput(e.target.value)}
                        min="1"
                        max={totalPlayers}
                        className="w-32 pl-10 h-9"
                        aria-label={`Ir a posición (1-${totalPlayers})`}
                    />
                </div>
                <Button type="submit" variant="outline" size="sm" className="h-9">
                    Ir
                </Button>
            </form>
        </div>
    );
}
