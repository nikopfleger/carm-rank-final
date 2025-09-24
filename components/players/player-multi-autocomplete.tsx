import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { ChevronsUpDown, Loader2, X } from "lucide-react";
import * as React from "react";

export type Player = {
  id: number;
  nickname: string;
  playerNumber: number;
  fullname?: string;
};

type Props = {
  selected: Player[];
  onChange(players: Player[]): void;
  placeholder?: string;
  searchApi?(q: string, signal?: AbortSignal): Promise<Player[]>;
  minChars?: number;
  debounceMs?: number;
  maxResults?: number;
  allowDuplicates?: boolean;
  emptyHint?: string;
  className?: string;
};

export default function PlayerMultiCombobox({
  selected,
  onChange,
  placeholder = "Buscar por apodo o L123…",
  searchApi,
  minChars = 1,
  debounceMs = 200,
  maxResults = 15,
  allowDuplicates = false,
  emptyHint = "Escribí un apodo o L123 para buscar…",
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<Player[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const triggerInputRef = React.useRef<HTMLInputElement | null>(null);
  const cmdInputRef = React.useRef<HTMLInputElement | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // cache simple
  const cacheRef = React.useRef<Map<string, Player[]>>(new Map());
  const setCache = (k: string, v: Player[]) => {
    const m = cacheRef.current;
    if (m.has(k)) m.delete(k);
    m.set(k, v);
    if (m.size > 100) m.delete(m.keys().next().value as string);
  };

  const selectedIds = React.useMemo(
    () => new Set(selected.map((s) => s.id)),
    [selected]
  );

  const api = React.useMemo(() => searchApi ?? defaultSearchApi, [searchApi]);

  const normalizeQuery = React.useCallback((s: string) => {
    const m = s.trim().match(/^L?(\d{1,6})$/i);
    return m ? m[1] : s.trim();
  }, []);

  const doSearch = React.useCallback(
    async (rawQ: string) => {
      const q = normalizeQuery(rawQ);

      if (q.length < minChars) {
        abortRef.current?.abort();
        setItems([]);
        setLoading(false);
        setErrorMsg(null);
        return;
      }

      const cached = cacheRef.current.get(q);
      if (cached) {
        const filtered = (allowDuplicates
          ? cached
          : cached.filter((p) => !selectedIds.has(p.id))
        ).slice(0, maxResults);
        setItems(filtered);
        setLoading(false);
        setErrorMsg(null);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLoading(true);
        setErrorMsg(null);
        const raw = await api(q, controller.signal);

        if (controller.signal.aborted) {
          setLoading(false);
          return;
        }

        // Siempre actualizar el estado, incluso si el componente se desmontó
        setCache(q, raw);
        const filtered = (allowDuplicates
          ? raw
          : raw.filter((p) => !selectedIds.has(p.id))
        ).slice(0, maxResults);
        setItems(filtered);
        setLoading(false);
      } catch (error) {
        if (controller.signal.aborted) {
          setLoading(false);
          return;
        }
        setItems([]);
        setLoading(false);
        setErrorMsg("No se pudo completar la búsqueda.");
      }
    },
    [api, allowDuplicates, maxResults, minChars, normalizeQuery, selectedIds]
  );

  // debounce
  const debRef = React.useRef<number | undefined>(undefined);
  const scheduleSearch = React.useCallback(
    (q: string) => {
      if (debRef.current) window.clearTimeout(debRef.current);
      debRef.current = window.setTimeout(() => doSearch(q), debounceMs) as any;
    },
    [doSearch, debounceMs]
  );

  const add = React.useCallback(
    (p: Player) => {
      if (!allowDuplicates && selectedIds.has(p.id)) return;
      onChange([...selected, p]);
      setQuery("");
      setItems([]);
      setOpen(false);
      setTimeout(() => triggerInputRef.current?.focus(), 0);
    },
    [allowDuplicates, onChange, selected, selectedIds]
  );

  const remove = React.useCallback(
    (pid: number) => {
      onChange(selected.filter((p) => p.id !== pid));
    },
    [onChange, selected]
  );

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !query && selected.length > 0) {
      remove(selected[selected.length - 1].id);
    }
    if (e.key === "ArrowDown") {
      setOpen(true);
      setTimeout(() => cmdInputRef.current?.focus(), 0);
    }
  };

  return (
    <div className={className}>
      {/* chips */}
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((p) => (
            <Badge key={p.id} variant="secondary" className="flex items-center gap-1 pr-1">
              {p.nickname} (L{p.playerNumber})
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="ml-1 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700 min-w-[24px] min-h-[24px] flex items-center justify-center"
                aria-label={`Quitar ${p.nickname}`}
              >
                <X className="h-4 w-4" />
              </button>
            </Badge>
          ))}
          <Button type="button" variant="ghost" className="h-7 px-2" onClick={() => onChange([])}>
            Limpiar todo
          </Button>
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        {/* 👇 El input actúa de ANCLA, no de trigger (no hay toggle automático) */}
        <PopoverAnchor asChild>
          <div className="relative">
            <Input
              ref={triggerInputRef}
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                if (!open) setOpen(true);
                scheduleSearch(v);
              }}
              onFocus={() => {
                setOpen(true);
                if (query) scheduleSearch(query);
              }}
              onKeyDown={onTriggerKeyDown}
              role="combobox"
              aria-expanded={open}
              aria-controls="player-combobox-listbox"
              aria-autocomplete="list"
            />
            <ChevronsUpDown
              className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 cursor-pointer"
              onMouseDown={(e) => {
                e.preventDefault(); // evita blur
                e.stopPropagation(); // evita propagación
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!open) {
                  setOpen(true);
                  setTimeout(() => cmdInputRef.current?.focus(), 0);
                } else {
                  setOpen(false);
                }
              }}
              aria-hidden
            />
          </div>
        </PopoverAnchor>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            setTimeout(() => cmdInputRef.current?.focus(), 0);
          }}
          onEscapeKeyDown={() => setOpen(false)}
          onInteractOutside={(e) => {
            // No cerrar si se hace click en el input trigger o en la flecha
            const target = e.target as Element;
            if (triggerInputRef.current?.contains(target)) {
              e.preventDefault();
              return;
            }
            // cerrar en click afuera manteniendo selección con mouse
            if (!e.defaultPrevented) setOpen(false);
          }}
        >
          <Command shouldFilter={false}>
            <div className="relative">
              <CommandInput
                ref={cmdInputRef}
                value={query}
                onValueChange={(v) => {
                  setQuery(v);
                  scheduleSearch(v);
                }}
                placeholder={placeholder}
                aria-controls="player-combobox-listbox"
              />
              {loading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin opacity-70" />}
            </div>

            <CommandList id="player-combobox-listbox">
              {errorMsg ? (
                <div className="px-3 py-2 text-center text-sm text-red-600 dark:text-red-400">
                  {errorMsg}
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    {query.trim() ? (loading ? "Cargando…" : "Probá con otro apodo o número de legajo") : emptyHint}
                  </CommandEmpty>

                  {items.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={`${p.nickname} ${p.playerNumber} ${p.fullname ?? ""}`}
                      onSelect={() => add(p)}
                      className="flex flex-col items-start py-3 px-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {p.nickname}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          (L{p.playerNumber})
                        </span>
                      </div>
                      {p.fullname && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {p.fullname}
                        </div>
                      )}
                    </CommandItem>
                  ))}

                  {query.trim() && (
                    <div className="border-t p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setQuery("");
                          setOpen(false);
                          setTimeout(() => triggerInputRef.current?.focus(), 0);
                        }}
                      >
                        Cerrar búsqueda
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ================== API por defecto ==================
async function defaultSearchApi(q: string, signal?: AbortSignal): Promise<Player[]> {
  if (!q.trim()) return [];

  const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`, {
    signal,
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = await res.json();
  const arr = Array.isArray(data) ? data : data?.data ?? [];

  return arr
    .map((x: any) => ({
      id: Number(x.id ?? x.player?.id ?? x.oid ?? 0),
      nickname: String(x.nickname ?? x.player?.nickname ?? ""),
      playerNumber: Number(x.playerNumber ?? x.player?.playerNumber ?? x.legajo ?? 0),
      fullname: x.fullname ?? x.player?.fullname,
    }))
    .filter((x: Player) => x.id && x.nickname);
}
