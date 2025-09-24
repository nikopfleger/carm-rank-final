// PlayerSingleCombobox.tsx (shadcn Command + Popover)
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2 } from "lucide-react";
import * as React from "react";

export type Player = { id: number; nickname: string; playerNumber: number; fullname?: string; };

type SingleProps = {
    value: Player | null;
    onChange(p: Player | null): void;
    placeholder?: string;
    searchApi?(q: string, signal?: AbortSignal): Promise<Player[]>;
    minChars?: number;
    debounceMs?: number;
    disabledIds?: Set<number>; // para bloquear ya usados
};

export default function PlayerSingleCombobox({
    value, onChange, placeholder = "Buscar jugador…",
    searchApi, minChars = 1, debounceMs = 200, disabledIds
}: SingleProps) {
    const [open, setOpen] = React.useState(false);
    const [q, setQ] = React.useState("");
    const [items, setItems] = React.useState<Player[]>([]);
    const [loading, setLoading] = React.useState(false);
    const api = React.useMemo(() => searchApi ?? defaultSearchApi, [searchApi]);

    const abortRef = React.useRef<AbortController | null>(null);
    const debRef = React.useRef<number | null>(null);

    const fetchItems = React.useCallback(async (qq: string) => {
        const s = qq.trim();
        if (s.length < minChars) { setItems([]); setLoading(false); return; }
        abortRef.current?.abort();
        const c = new AbortController(); abortRef.current = c;
        try {
            setLoading(true);
            const raw = await api(s, c.signal);
            if (!c.signal.aborted) {
                const filtered = disabledIds ? raw.filter(p => !disabledIds.has(p.id) || (value && p.id === value.id)) : raw;
                setItems(filtered);
                setLoading(false);
            }
        } catch { if (!c.signal.aborted) { setItems([]); setLoading(false); } }
    }, [api, minChars, disabledIds, value]);

    const schedule = (qq: string) => {
        if (debRef.current) window.clearTimeout(debRef.current);
        debRef.current = window.setTimeout(() => fetchItems(qq), debounceMs) as unknown as number;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="relative">
                    <Input
                        value={value ? `${value.nickname} (L${value.playerNumber})` : q}
                        placeholder={placeholder}
                        onChange={(e) => { setQ(e.target.value); setOpen(true); schedule(e.target.value); }}
                        onFocus={() => { setOpen(true); if (q) schedule(q); }}
                    />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                    <div className="relative">
                        <CommandInput value={q} onValueChange={(v) => { setQ(v); schedule(v); }} placeholder={placeholder} />
                        {loading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin opacity-70" />}
                    </div>
                    <CommandList>
                        <CommandEmpty>{q.trim() ? (loading ? "Cargando…" : "Sin resultados") : "Escribe para buscar…"}</CommandEmpty>
                        {items.map(p => (
                            <CommandItem
                                key={p.id}
                                value={`${p.nickname} ${p.playerNumber} ${p.fullname ?? ""}`}
                                onSelect={() => { onChange(p); setOpen(false); setQ(""); }}
                            >
                                {p.nickname} (L{p.playerNumber})
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

async function defaultSearchApi(q: string, signal?: AbortSignal): Promise<Player[]> {
    const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    const arr = Array.isArray(data) ? data : data?.data ?? [];
    return arr.map((x: any) => ({
        id: Number(x.id ?? x.player?.id ?? x.oid ?? 0),
        nickname: String(x.nickname ?? x.player?.nickname ?? ""),
        playerNumber: Number(x.playerNumber ?? x.player?.playerNumber ?? x.playerId ?? x.player?.playerId ?? 0),
        fullname: x.fullname ?? x.player?.fullname,
    })).filter((x: Player) => x.id && x.nickname);
}
