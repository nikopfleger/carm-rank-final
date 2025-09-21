"use client";
import PlayerSingleCombobox, { type Player } from "@/components/players/player-single-combobox";
import * as React from "react";

type Props = {
    players: Array<Player | null>;              // la longitud decide cuántos slots (3 o 4)
    onChange(players: Array<Player | null>): void;
    searchApi?(q: string, signal?: AbortSignal): Promise<Player[]>;
};

export default function PlayersPicker({ players, onChange, searchApi }: Props) {
    const disabled = React.useMemo(() => {
        const s = new Set<number>();
        players.forEach(p => { if (p) s.add(p.id); });
        return s;
    }, [players]);

    const setAt = (i: number, v: Player | null) => {
        const next = players.slice();
        next[i] = v;
        onChange(next);
    };

    return (
        <div className="grid gap-2">
            {players.map((val, i) => (
                <PlayerSingleCombobox
                    key={i}
                    value={val}
                    onChange={(p) => setAt(i, p)}
                    searchApi={searchApi}
                    disabledIds={disabled}
                    placeholder={`Jugador ${i + 1}`}
                />
            ))}
        </div>
    );
}
