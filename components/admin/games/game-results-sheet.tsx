"use client";

import { Badge } from "@/components/ui/badge";
import { GhostInput } from "@/components/ui/ghost-input";
import { useEnumI18n } from "@/hooks/use-enum-i18n";
import { cn } from "@/lib/utils";
import { Calculator, Loader2, Search, X } from "lucide-react";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Cálculos reutilizados (versión real) – SIN CAMBIOS
import {
  calcularOkaConEmpates,
  calcularPosiciones,
  calcularUmaConEmpates,
} from "@/lib/game-calculations-client";

/** Tipos de fila genérica que usa el sheet */
interface SheetRow {
  id: number | null;
  displayName: string; // lo que se ve/tipea en el input
  wind: string;
  oorasuScore: number | null;
  gameScore: number;
  chonbo: number;
}

export type Ruleset = {
  id: number;
  name: string;
  inPoints: number; // ej. 25000
  outPoints: number; // ej. 30000
  uma: {
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    fourthPlace: number | null;
  };
  oka: number; // ej. +20
  chonbo: number; // ej. -40
  sanma: boolean;
};

type Player = {
  id: number;
  nickname: string;
  playerNumber: number;
  fullname?: string;
};

type Props = {
  rows: SheetRow[];
  ruleset: Ruleset;
  playerCount?: 3 | 4;
  editable?: boolean;
  readOnly?: boolean; // alias defensivo
  showWind?: boolean;
  showOorasu?: boolean;
  /** Riichis flotantes (cada uno = 1000 puntos al total) */
  riichiFloating?: number;
  onRiichiFloatingChange?: (value: number) => void;

  /** Búsqueda remota de jugadores */
  searchPlayers?: (q: string) => Promise<Player[]>;

  /** Cambios en las filas (controlado por el padre) */
  onRowsChange?: (rows: SheetRow[]) => void;

  /** Reporte de validez al padre para la leyenda ✓/✗ */
  onValidityChange?: (s: {
    gameSumOK: boolean;
    finalZeroOK: boolean;
    beforeOkaSum: number;
    okaSum: number;
    finalSumVisual: number;
  }) => void;

  onComputedChange?: (data: {
    finals: number[];
    positions: number[];
    uma: number[];
    oka: number[];
    beforeOka: number[];
  }) => void;

  className?: string;
};

function getUmaArray(uma: Ruleset["uma"]): number[] {
  return uma.fourthPlace !== null
    ? [uma.firstPlace, uma.secondPlace, uma.thirdPlace, uma.fourthPlace]
    : [uma.firstPlace, uma.secondPlace, uma.thirdPlace];
}

/** Redondeo 1 decimal */
function r1(n: number) {
  return Math.round(n * 10) / 10;
}

const GameResultsSheet = memo(function GameResultsSheet({
  rows,
  ruleset,
  playerCount = ruleset.sanma ? 3 : 4,
  editable = false,
  readOnly,
  showWind = true,
  showOorasu = true,
  riichiFloating = 0,
  onRiichiFloatingChange,
  searchPlayers,
  onRowsChange,
  onValidityChange,
  onComputedChange,
  className,
}: Props) {
  const isEditable = !!editable && !readOnly;

  // ──────────────────────────
  // AUTOCOMPLETE STATE (UX mejorada)
  // ──────────────────────────
  const [searchTerms, setSearchTerms] = useState<string[]>(
    rows.map((r) => r.displayName || "")
  );
  const [resultsByIndex, setResultsByIndex] = useState<Player[][]>(
    rows.map(() => [])
  );
  const [loadingByIndex, setLoadingByIndex] = useState<boolean[]>(
    rows.map(() => false)
  );
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [activeOption, setActiveOption] = useState<number>(-1); // para ↑/↓
  const [dropdownStyle, setDropdownStyle] =
    useState<React.CSSProperties | null>(null);

  // Evitar carreras de peticiones
  const activeReqRef = useRef(0);
  // Control cuidadoso del blur
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Mantener sincronizado el texto visible con las filas (rehidrataciones)
  useEffect(() => {
    setSearchTerms(rows.map((r) => r.displayName || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.map((r) => `${r.id ?? ""}-${r.displayName}`).join("|")]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Reposicionar dropdown en scroll/resize cuando está abierto
  useEffect(() => {
    if (focusedIndex === null) return;
    function handler() {
      const input = inputRefs.current[focusedIndex!];
      if (!input) return;
      const rect = input.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    handler();
    const opt = { passive: true, capture: true } as any;
    window.addEventListener("scroll", handler, opt);
    window.addEventListener("resize", handler, opt);
    return () => {
      window.removeEventListener("scroll", handler, opt);
      window.removeEventListener("resize", handler, opt);
    };
  }, [focusedIndex]);

  // Cerrar dropdown en click fuera
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (focusedIndex === null) return;
      const drop = dropdownRef.current;
      const inp = inputRefs.current[focusedIndex!];
      const target = e.target as Node | null;
      if (!drop || !inp) return;

      if (drop.contains(target) || inp.contains(target)) return;
      setFocusedIndex(null);
      setDropdownStyle(null);
      setActiveOption(-1);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [focusedIndex]);

  const usedPlayerIds = useMemo(
    () => new Set(rows.map((r) => r.id).filter(Boolean) as number[]),
    [rows]
  );

  function computeAndSetDropdownStyleFor(index: number) {
    const el = inputRefs.current[index];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }

  const runSearch = useCallback(async (term: string, index: number) => {
    if (!searchPlayers) {
      setResultsByIndex((prev) => {
        const next = prev.slice();
        next[index] = [];
        return next;
      });
      return;
    }

    // Limpiar timeout anterior
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const setLoading = (v: boolean) =>
      setLoadingByIndex((prev) => {
        const next = prev.slice();
        next[index] = v;
        return next;
      });

    // Si no hay término, mostrar algunos por defecto (top N)
    if (!term || term.length === 0) {
      try {
        setLoading(true);
        const raw = await searchPlayers("");
        const currentId = rows[index].id;
        const currentUsedIds = new Set(rows.map((r) => r.id).filter(Boolean) as number[]);
        const filtered = (raw || [])
          .filter((p) => p.id === currentId || !currentUsedIds.has(p.id))
          .slice(0, 8);

        setResultsByIndex((prev) => {
          const next = prev.slice();
          next[index] = filtered;
          return next;
        });
      } catch {
        setResultsByIndex((prev) => {
          const next = prev.slice();
          next[index] = [];
          return next;
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Búsqueda con debounce
    searchTimeoutRef.current = setTimeout(async () => {
      const myId = ++activeReqRef.current;
      try {
        setLoading(true);
        const raw = await searchPlayers(term);

        const currentId = rows[index].id;
        const currentUsedIds = new Set(rows.map((r) => r.id).filter(Boolean) as number[]);
        const filtered = (raw || [])
          .filter((p) => p.id === currentId || !currentUsedIds.has(p.id))
          .slice(0, 10);

        if (myId === activeReqRef.current) {
          setResultsByIndex((prev) => {
            const next = prev.slice();
            next[index] = filtered;
            return next;
          });
          setActiveOption(filtered.length ? 0 : -1);
        }
      } catch {
        if (myId === activeReqRef.current) {
          setResultsByIndex((prev) => {
            const next = prev.slice();
            next[index] = [];
            return next;
          });
          setActiveOption(-1);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [searchPlayers, rows]);

  const handleFocus = useCallback((index: number) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setFocusedIndex(index);
    computeAndSetDropdownStyleFor(index);
    runSearch(searchTerms[index] || "", index);
  }, [searchTerms, runSearch]);

  function handleBlur() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setFocusedIndex(null);
      setDropdownStyle(null);
      setActiveOption(-1);
    }, 140);
  }

  function handleChangeName(index: number, value: string) {
    setSearchTerms((prev) => {
      const next = prev.slice();
      next[index] = value;
      return next;
    });

    if (isEditable) {
      const nextRows = rows.slice();
      nextRows[index] = { ...nextRows[index], displayName: value };
      onRowsChange?.(nextRows);
    }

    // Si el usuario escribe, abrir dropdown
    setFocusedIndex(index);
    computeAndSetDropdownStyleFor(index);

    // Al empezar a escribir, “des-seleccionar” el jugador
    if (rows[index].id !== null) {
      const nextRows = rows.slice();
      nextRows[index] = { ...nextRows[index], id: null };
      onRowsChange?.(nextRows);
    }

    runSearch(value, index);
  }

  function selectPlayer(index: number, p: Player) {
    const display = `${p.nickname} (L${p.playerNumber})`;
    const nextRows = rows.slice();
    nextRows[index] = { ...nextRows[index], id: p.id, displayName: display };
    onRowsChange?.(nextRows);

    setSearchTerms((t) => {
      const n = t.slice();
      n[index] = display;
      return n;
    });

    // Cerrar dropdown y quitar foco del input actual
    setFocusedIndex(null);
    setDropdownStyle(null);
    setActiveOption(-1);

    // Solo quitar foco, no avanzar automáticamente al siguiente
    const currentInput = inputRefs.current[index];
    currentInput?.blur();
  }

  function clearSelection(index: number) {
    const nextRows = rows.slice();
    nextRows[index] = { ...nextRows[index], id: null, displayName: "" };
    onRowsChange?.(nextRows);
    setSearchTerms((t) => {
      const n = t.slice();
      n[index] = "";
      return n;
    });
    setFocusedIndex(index);
    computeAndSetDropdownStyleFor(index);
    runSearch("", index);
    requestAnimationFrame(() => inputRefs.current[index]?.focus());
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (focusedIndex !== index) setFocusedIndex(index);

    const items = resultsByIndex[index] || [];

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveOption((prev) => (items.length ? (prev + 1) % items.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveOption((prev) => (items.length ? (prev - 1 + items.length) % items.length : -1));
    } else if (e.key === "Enter") {
      if (focusedIndex === index && activeOption >= 0 && items[activeOption]) {
        e.preventDefault();
        selectPlayer(index, items[activeOption]);
      }
    } else if (e.key === "Escape") {
      setFocusedIndex(null);
      setDropdownStyle(null);
      setActiveOption(-1);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Backspace" && !searchTerms[index] && rows[index].id) {
      // si está vacío y había selección, limpia
      clearSelection(index);
    }
  }

  // ──────────────────────────
  // CÁLCULOS (sin cambios)
  // ──────────────────────────
  const computed = useMemo(() => {
    const dev = ruleset.outPoints / 1000;

    // 1) Uma con empates basado en (gameScore/1000 - dev)
    const base = rows
      .slice(0, playerCount)
      .map((r, i) => ({ i, score: (r.gameScore ?? 0) / 1000 - dev }))
      .sort((a, b) => b.score - a.score);

    const gameScores = base.map((b) => b.score);
    const { posiciones_display } = calcularPosiciones(gameScores);
    const umaVec = getUmaArray(ruleset.uma);

    const umaByOriginalIndex = new Map<number, number>();
    base.forEach((b, idx) => {
      const pos = posiciones_display[idx];
      const uma = calcularUmaConEmpates(posiciones_display, pos, umaVec);
      umaByOriginalIndex.set(b.i, uma);
    });

    // 2) Oka por puntaje antes de Oka
    const pre = rows
      .slice(0, playerCount)
      .map((r, i) => {
        const ch = (r.chonbo ?? 0) * (isNaN(ruleset.chonbo) ? -0 : ruleset.chonbo);
        const uma = umaByOriginalIndex.get(i) ?? 0;
        const before = (r.gameScore ?? 0) / 1000 - dev + uma + ch;
        return { i, before };
      })
      .sort((a, b) => b.before - a.before);

    const preArr = pre.map((p) => p.before);
    const { posiciones_display: posOka } = calcularPosiciones(preArr);

    const okaByOriginalIndex = new Map<number, number>();
    pre.forEach((p, idx) => {
      const pos = posOka[idx];
      const oka = calcularOkaConEmpates(posOka, pos, ruleset.oka);
      okaByOriginalIndex.set(p.i, oka);
    });

    // 3) Final y posición
    const finals = rows
      .slice(0, playerCount)
      .map((r, i) => {
        const ch = (r.chonbo ?? 0) * (isNaN(ruleset.chonbo) ? 0 : ruleset.chonbo);
        const uma = umaByOriginalIndex.get(i) ?? 0;
        const oka = okaByOriginalIndex.get(i) ?? 0;
        const finalScore = (r.gameScore ?? 0) / 1000 - dev + uma + oka + ch;
        return { i, finalScore, uma, oka, ch };
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    const posFinal: number[] = Array(playerCount).fill(1);
    let current = 1;
    for (let i = 0; i < finals.length; i++) {
      let tied = 1;
      for (let j = i + 1; j < finals.length; j++) {
        if (Math.abs(finals[j].finalScore - finals[i].finalScore) < 0.01) tied++;
        else break;
      }
      for (let k = 0; k < tied; k++) {
        posFinal[finals[i + k].i] = current;
      }
      i += tied - 1;
      current += tied;
    }

    return rows.slice(0, playerCount).map((r, i) => {
      const ch = (r.chonbo ?? 0) * (isNaN(ruleset.chonbo) ? 0 : ruleset.chonbo);
      const uma = umaByOriginalIndex.get(i) ?? 0;
      const oka = okaByOriginalIndex.get(i) ?? 0;
      const finalScore = (r.gameScore ?? 0) / 1000 - dev + uma + oka + ch;
      return {
        umaPrec: uma,        // PRECISO
        okaPrec: oka,        // PRECISO
        finalPrec: finalScore, // PRECISO
        finalPosition: posFinal[i],
        // Mantener compatibilidad
        umaCalc: uma,
        okaCalc: r1(oka),
        finalScore: r1(finalScore),
      };
    });
  }, [rows, ruleset, playerCount]);

  const beforeOkaPerPlayer = useMemo(() => {
    const dev = ruleset.outPoints / 1000;
    return rows.slice(0, playerCount).map((r, i) => {
      const ch = (r.chonbo ?? 0) * (isNaN(ruleset.chonbo) ? 0 : (ruleset.chonbo ?? 0));
      const uma = computed[i]?.umaPrec ?? 0;
      return r1((r.gameScore ?? 0) / 1000 - dev + uma + ch);
    });
  }, [rows, ruleset, playerCount, computed]);

  const prevComputedRef = useRef<any>(null);

  useEffect(() => {
    if (!onComputedChange) return;

    const newData = {
      finals: computed.map((c) => c.finalScore),
      positions: computed.map((c) => c.finalPosition),
      uma: computed.map((c) => c.umaCalc),
      oka: computed.map((c) => c.okaCalc),
      beforeOka: beforeOkaPerPlayer,
    };

    if (JSON.stringify(prevComputedRef.current) !== JSON.stringify(newData)) {
      prevComputedRef.current = newData;
      onComputedChange(newData);
    }
  }, [computed, beforeOkaPerPlayer, onComputedChange]);

  // ──────────────────────────
  // Totales y validaciones  (sin cambios de lógica)
  // ──────────────────────────
  const totals = useMemo(() => {
    const dev = ruleset.outPoints / 1000;

    const totalGame = rows
      .slice(0, playerCount)
      .reduce((s, r) => (r.gameScore ?? 0) + s, 0);

    const expected = ruleset.inPoints * playerCount;
    const riichiFloatingPoints = (riichiFloating || 0) * 1000;
    const totalGameWithRiichi = totalGame + riichiFloatingPoints;

    const totalCh = rows
      .slice(0, playerCount)
      .reduce((s, r) => s + (r.chonbo ?? 0) * (ruleset.chonbo ?? 0), 0);

    const okaSumPrecise = computed.reduce((s, c) => s + c.okaPrec, 0);
    const totalFinalPrecise = computed.reduce((s, c) => s + c.finalPrec, 0);

    const beforeOkaSumRaw = rows.slice(0, playerCount).reduce((s, r, i) => {
      const uma = computed[i]?.umaPrec ?? 0;
      const ch = (r.chonbo ?? 0) * (ruleset.chonbo ?? 0);
      return s + ((r.gameScore ?? 0) / 1000 - dev + uma + ch);
    }, 0);

    const beforeOkaSum = r1(beforeOkaSumRaw + (ruleset.oka ?? 0) + Math.abs(totalCh) + (riichiFloating || 0));

    // Cálculo preciso para validación (sin redondear)
    const finalSumPrecise = totalFinalPrecise + Math.abs(totalCh) + (riichiFloating || 0);
    // Visualización con 1 decimal
    const finalSumVisual = r1(finalSumPrecise);

    const gameSumOK = totalGameWithRiichi === expected;
    const finalZeroOK = Math.abs(finalSumPrecise) < 0.01;

    return {
      totalGame: totalGameWithRiichi,
      expected: expected,
      expectedBase: expected,
      riichiFloatingPoints,
      totalFinal: totalFinalPrecise,
      totalCh,
      totalFinalVisual: finalSumVisual,
      totalFinalPrecise: finalSumPrecise,
      gameSumOK,
      finalZeroOK,
      beforeOkaSum,
      okaSum: r1(okaSumPrecise),
    };
  }, [rows, computed, ruleset, playerCount, riichiFloating]);

  // Notificar validez hacia arriba
  useEffect(() => {
    onValidityChange?.({
      gameSumOK: totals.gameSumOK,
      finalZeroOK: totals.finalZeroOK,
      beforeOkaSum: totals.beforeOkaSum,
      okaSum: totals.okaSum,
      finalSumVisual: totals.totalFinalVisual,
    });
  }, [
    totals.gameSumOK,
    totals.finalZeroOK,
    totals.beforeOkaSum,
    totals.okaSum,
    totals.totalFinalVisual,
    onValidityChange,
  ]);

  // Lista de vientos disponibles (únicos) - usando i18n
  const { windOptions } = useEnumI18n();
  const winds = windOptions.map(option => option.value);
  function windOptionsFor(index: number) {
    const others = rows
      .slice(0, playerCount)
      .map((r, i) => (i === index ? null : r.wind))
      .filter(Boolean);
    return winds.filter((w) => !others.includes(w as any) || rows[index].wind === w);
  }

  function updateRow<K extends keyof SheetRow>(i: number, key: K, value: SheetRow[K]) {
    if (!isEditable) return;
    const next = rows.slice();
    next[i] = { ...next[i], [key]: value };
    onRowsChange?.(next);
  }

  // ──────────────────────────
  // UI
  // ──────────────────────────
  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 dark:bg-gray-700">
              {showWind && <th className="border px-3 py-2 text-sm w-24">Viento</th>}
              <th className="border px-3 py-2 text-sm w-[450px]">Nombre</th>
              {showOorasu && (
                <th className="border px-3 py-2 text-sm w-36" title="Puntos bonus del último hand">
                  Puntaje Oorasu
                </th>
              )}
              <th className="border px-3 py-2 text-sm w-36" title="Puntos de la partida en unidades">
                Puntaje Partida
              </th>
              <th className="border px-3 py-2 text-sm w-24">Uma</th>
              <th className="border px-3 py-2 text-sm w-24">Chonbos</th>
              <th className="border px-3 py-2 text-sm w-36" title="Cantidad × valor Chonbo">
                Total (-) Chonbo
              </th>
              <th className="border px-3 py-2 text-sm w-24">Oka</th>
              <th className="border px-3 py-2 text-sm w-36">Puntaje Final</th>
              <th className="border px-3 py-2 text-sm w-24">Posición</th>
            </tr>
          </thead>


          <tbody>
            {rows.slice(0, playerCount).map((r, i) => {
              const dev = ruleset.outPoints / 1000;
              const ch = (r.chonbo ?? 0) * (ruleset.chonbo ?? 0);
              const c = computed[i];

              const isSelected = r.id != null;
              const loading = loadingByIndex[i];

              return (
                <tr key={i} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                  {/* Viento */}
                  {showWind && (
                    <td className="border px-2 py-1 text-center hover:bg-gray-50/50 dark:hover:bg-gray-800/30 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-0">
                      {isEditable ? (
                        <select
                          value={r.wind || ""}
                          onChange={(e) => updateRow(i, "wind", e.target.value)}
                          className="w-full bg-transparent border-none outline-none text-center h-7 focus:ring-0 focus:outline-none appearance-none text-gray-900 dark:text-gray-100 [&>option]:bg-gray-800 [&>option]:text-white [&>option]:text-base [&>option]:font-medium"
                          aria-label={`Viento jugador ${i + 1}`}
                        >
                          <option value="">--</option>
                          {windOptionsFor(i).map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-center">{r.wind || "—"}</div>
                      )}
                    </td>
                  )}

                  {/* Nombre (autocomplete mejorado) */}
                  <td className="border px-2 py-1 text-center hover:bg-gray-50/50 dark:hover:bg-gray-800/30 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-0">
                    {isEditable ? (
                      <div className="relative">
                        <GhostInput
                          ref={(el) => {
                            inputRefs.current[i] = el;
                          }}
                          value={searchTerms[i] ?? ""}
                          placeholder="Buscar..."
                          onFocus={() => handleFocus(i)}
                          onBlur={handleBlur}
                          onChange={(e) => handleChangeName(i, e.target.value)}
                          onKeyDown={(e) => onInputKeyDown(e, i)}
                          className="pr-16"
                          aria-autocomplete="list"
                          aria-expanded={focusedIndex === i}
                          aria-controls={`player-list-${i}`}
                        />
                        {/* Botón limpiar */}
                        {isSelected && (
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => clearSelection(i)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                            aria-label="Limpiar jugador"
                            title="Limpiar selección"
                          >
                            <X className="h-4 w-4 opacity-70" />
                          </button>
                        )}
                        {/* Indicador loading */}
                        {loading && (
                          <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin opacity-70" />
                        )}
                      </div>
                    ) : (
                      <div className="truncate">{r.displayName || "—"}</div>
                    )}
                  </td>

                  {/* Oorasu */}
                  {showOorasu && (
                    <td className="border px-2 py-1 text-center hover:bg-gray-50/50 dark:hover:bg-gray-800/30 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-0">
                      {isEditable ? (
                        <GhostInput
                          type="number"
                          value={r.oorasuScore ?? 0}
                          onChange={(e) =>
                            updateRow(
                              i,
                              "oorasuScore",
                              e.target.value === "" ? 0 : parseInt(e.target.value) || 0
                            )
                          }
                          className="w-28"
                          aria-label={`Puntaje Oorasu jugador ${i + 1}`}
                        />
                      ) : (
                        <div className="text-center">{r.oorasuScore ?? 0}</div>
                      )}
                    </td>
                  )}

                  {/* Puntaje Partida */}
                  <td className="border px-2 py-1 text-center hover:bg-gray-50/50 dark:hover:bg-gray-800/30 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-0">
                    {isEditable ? (
                      <GhostInput
                        type="number"
                        value={r.gameScore ?? 0}
                        onChange={(e) =>
                          updateRow(
                            i,
                            "gameScore",
                            e.target.value === "" ? 0 : parseInt(e.target.value) || 0
                          )
                        }
                        className={cn(
                          "w-28 font-mono",
                          (r.gameScore ?? 0) % 100 !== 0 ? "text-red-500" : ""
                        )}
                        aria-label={`Puntaje Partida jugador ${i + 1}`}
                      />
                    ) : (
                      <div className="text-center font-mono">
                        {(r.gameScore ?? 0).toLocaleString("es-ES")}
                      </div>
                    )}
                  </td>

                  {/* Uma */}
                  <td className="border px-3 py-2 text-center bg-gray-50 dark:bg-gray-700">
                    <Badge
                      variant={c.umaPrec > 0 ? "default" : c.umaPrec < 0 ? "destructive" : "secondary"}
                    >
                      {c.umaPrec > 0 ? "+" : ""}
                      {r1(c.umaPrec).toFixed(1)}
                    </Badge>
                  </td>

                  {/* Chonbos */}
                  <td className="border px-2 py-1 text-center hover:bg-gray-50/50 dark:hover:bg-gray-800/30 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-0">
                    {isEditable ? (
                      <GhostInput
                        type="number"
                        value={r.chonbo ?? 0}
                        onChange={(e) => updateRow(i, "chonbo", parseInt(e.target.value) || 0)}
                        className="w-20"
                        aria-label={`Chonbos jugador ${i + 1}`}
                      />
                    ) : (
                      <div className="text-center">{r.chonbo ?? 0}</div>
                    )}
                  </td>

                  {/* Total (-) chonbo */}
                  <td className="border px-3 py-2 text-center bg-gray-50 dark:bg-gray-700">
                    <Badge variant={(r.chonbo ?? 0) !== 0 ? "destructive" : "secondary"}>
                      {(r.chonbo ?? 0) !== 0 ? (r.chonbo ?? 0) * (ruleset.chonbo ?? 0) : "0"}
                    </Badge>
                  </td>


                  {/* Oka */}
                  <td className="border px-3 py-2 text-center bg-gray-50 dark:bg-gray-700">
                    <Badge variant={c.okaPrec > 0 ? "default" : "secondary"}>
                      {c.okaPrec > 0 ? "+" : ""}
                      {r1(c.okaPrec).toFixed(1)}
                    </Badge>
                  </td>

                  {/* Final */}
                  <td className="border px-3 py-2 text-center bg-gray-50 dark:bg-gray-700">
                    <Badge variant={c.finalPrec > 0 ? "default" : c.finalPrec < 0 ? "destructive" : "secondary"}>
                      {c.finalPrec > 0 ? "+" : ""}
                      {r1(c.finalPrec).toFixed(1)}
                    </Badge>
                  </td>

                  {/* Posición */}
                  <td className="border px-3 py-2 text-center bg-gray-50 dark:bg-gray-700">
                    <Badge variant="outline">{c.finalPosition}°</Badge>
                  </td>
                </tr>
              );
            })}

            {/* Riichis Flotantes */}
            <tr className="bg-blue-50 dark:bg-blue-900/20">
              <td colSpan={showWind ? 1 : 0} className="border-l border-t border-b px-3 py-2"></td>
              <td className="border-t border-b px-3 py-2 text-sm font-medium text-center">
                Riichis Flotantes
              </td>
              <td colSpan={showOorasu ? 1 : 0} className="border-t border-b px-3 py-2"></td>
              <td className="border-t border-b px-2 py-1 text-center hover:bg-gray-50/50 dark:hover:bg-gray-800/30 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-0">
                {isEditable ? (
                  <div className="flex items-center justify-center gap-2">
                    <GhostInput
                      type="number"
                      min="0"
                      max="10"
                      value={riichiFloating || ""}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : 0;
                        onRiichiFloatingChange?.(value);
                      }}
                      className="w-16 text-sm"
                      placeholder="0"
                      aria-label="Riichis flotantes"
                    />
                    <span className="text-xs text-gray-500">
                      × 1000
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-bold text-lg">{riichiFloating || 0}</span>
                    <span className="text-xs text-gray-500">
                      × 1000
                    </span>
                  </div>
                )}
              </td>
              <td colSpan={showOorasu ? 4 : 5} className="border-r border-t border-b px-3 py-2 text-xs text-gray-500 text-center">
                <span className="font-medium">Cada riichi flotante agrega 1000 puntos al total esperado</span>
              </td>
            </tr>


            {/* Totales + checks */}
            <tr
              className={cn(
                "bg-blue-50 dark:bg-blue-900/30 font-bold",
                totals.gameSumOK ? "" : "ring-1 ring-red-300 dark:ring-red-700"
              )}
            >
              <td className="border px-3 py-2 text-center">{showWind ? "TOTAL" : ""}</td>
              <td className="border px-3 py-2" />
              {showOorasu && (
                <td className="border px-3 py-2 text-center">
                  {(() => {
                    const sum = rows
                      .slice(0, playerCount)
                      .reduce((s, r) => s + (r.oorasuScore ?? 0), 0);
                    return sum.toLocaleString("es-ES");
                  })()}
                </td>
              )}
              {/* Total partida + check */}
              <td className="border px-3 py-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="text-center font-mono">
                    <div className="text-blue-700 dark:text-blue-300">
                      {(rows
                        .slice(0, playerCount)
                        .reduce((s, r) => (r.gameScore ?? 0) + s, 0) + (riichiFloating * 1000))
                        .toLocaleString("es-ES")}
                    </div>
                  </div>
                  {totals.gameSumOK ? (
                    <span className="text-green-600 font-bold text-lg">✓</span>
                  ) : (
                    <span className="text-red-600 font-bold text-lg">✗</span>
                  )}
                </div>
              </td>
              <td className="border px-3 py-2 text-center">
                {computed.reduce((s, c) => s + c.umaCalc, 0).toFixed(1)}
              </td>
              <td className="border px-3 py-2 text-center">
                {rows.slice(0, playerCount).reduce((s, r) => s + (r.chonbo ?? 0), 0)}
              </td>
              <td className="border px-3 py-2 text-center">
                {rows
                  .slice(0, playerCount)
                  .reduce((s, r) => s + (r.chonbo ?? 0) * (ruleset.chonbo ?? 0), 0)}
              </td>
              <td className="border px-3 py-2 text-center">{totals.okaSum.toFixed(1)}</td>
              <td className="border px-3 py-2 text-center">
                {totals.totalFinalVisual.toFixed(1)}
              </td>
              <td className="border px-3 py-2" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Detalles de las reglas */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
        <div className="text-center mb-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reglas del juego</div>
          <div className="text-xs text-gray-500">{ruleset.name}</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
          {/* IN Points */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">IN</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {ruleset.inPoints.toLocaleString("es-ES")}
            </div>
          </div>

          {/* OUT Points */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">OUT</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {ruleset.outPoints.toLocaleString("es-ES")}
            </div>
          </div>

          {/* UMA */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">UMA</div>
            <div className="text-sm font-mono">
              <span className="text-green-600 dark:text-green-400">+{ruleset.uma.firstPlace}</span>
              <span className="text-yellow-600 dark:text-yellow-400"> +{ruleset.uma.secondPlace}</span>
              <span className="text-orange-600 dark:text-orange-400"> +{ruleset.uma.thirdPlace}</span>
              {ruleset.uma.fourthPlace !== null && (
                <span className="text-red-600 dark:text-red-400"> +{ruleset.uma.fourthPlace}</span>
              )}
            </div>
          </div>

          {/* OKA */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">OKA</div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              +{ruleset.oka}
            </div>
          </div>

          {/* CHONBO */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">CHONBO</div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {ruleset.chonbo}
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-500 text-center">
            <div>
              <span className="font-medium">Modo:</span> {ruleset.sanma ? "Sanma (3 jugadores)" : "Yonma (4 jugadores)"}
            </div>
          </div>
        </div>
      </div>

      {/* Línea de resumen ✓ / ✗ */}
      <div className="mt-4 p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Partida</div>
              <div className="font-bold text-xl text-blue-700 dark:text-blue-300">
                {(rows
                  .slice(0, playerCount)
                  .reduce((s, r) => (r.gameScore ?? 0) + s, 0) + (riichiFloating * 1000))
                  .toLocaleString("es-ES")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Final</div>
              <div className={cn("font-bold text-xl", totals.finalZeroOK ? "text-green-600" : "text-red-600")}>
                {totals.totalFinalVisual.toFixed(1)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Chonbos</div>
              <div className="font-bold text-lg text-orange-600">
                {Math.abs(
                  rows
                    .slice(0, playerCount)
                    .reduce((s, r) => s + (r.chonbo ?? 0), 0)
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
            <Calculator className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            {totals.finalZeroOK ? (
              <span className="text-green-600 dark:text-green-400 font-semibold text-lg">✓ Válido</span>
            ) : (
              <span className="text-red-600 dark:text-red-400 font-semibold text-lg">✗ Revisar</span>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown (en portal) */}
      {isEditable &&
        focusedIndex !== null &&
        dropdownStyle &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            id={`player-list-${focusedIndex}`}
            data-autocomplete-dropdown="true"
            style={{
              ...dropdownStyle,
              minWidth: 300,
              width:
                typeof dropdownStyle.width === "number"
                  ? Math.max(dropdownStyle.width, 300)
                  : dropdownStyle.width,
            }}
            className="max-h-56 overflow-y-auto rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg"
            onMouseDown={(e) => e.preventDefault()} // evita que el blur cierre antes del click
          >
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700">
              <Search className="h-3.5 w-3.5" />
              {searchTerms[focusedIndex] ? (
                <>Resultados para “{searchTerms[focusedIndex]}”</>
              ) : (
                <>Escribe para buscar…</>
              )}
            </div>

            {(resultsByIndex[focusedIndex] || []).length > 0 ? (
              (resultsByIndex[focusedIndex] || []).map((p, idx) => {
                const isActive = idx === activeOption;
                const text = `${p.nickname} (L${p.playerNumber})`;
                return (
                  <div
                    key={p.id}
                    role="option"
                    aria-selected={isActive}
                    className={cn(
                      "px-3 py-2 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0",
                      isActive ? "bg-blue-50 dark:bg-blue-900/40" : "hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    )}
                    onMouseEnter={() => setActiveOption(idx)}
                    onClick={() => selectPlayer(focusedIndex, p)}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {text}
                      </span>
                      {p.fullname && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 truncate">
                          {p.fullname}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-3 text-gray-500 dark:text-gray-400 text-center text-sm">
                Sin resultados
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
});

export default GameResultsSheet;
