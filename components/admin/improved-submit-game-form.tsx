"use client";

import dynamic from "next/dynamic";

import { useGameService } from "@/components/providers/services-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameSheetSkeleton } from "@/components/ui/loading-skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnumI18n } from "@/hooks/use-enum-i18n";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { AlertTriangle, Calendar, CheckCircle, Upload } from "lucide-react";

// Lazy load del componente pesado
const GameResultsSheet = dynamic(() => import("@/components/admin/games/game-results-sheet"), {
  loading: () => <GameSheetSkeleton />,
  ssr: false
});

const GameResultsSheetMobile = dynamic(() => import("@/components/admin/games/game-results-sheet-mobile"), {
  loading: () => <GameSheetSkeleton />,
  ssr: false
});

import React from "react";

// ------------------ Tipos locales ------------------
interface GamePlayerSearch {
  id: number;
  nickname: string;
  playerNumber: number;
  fullname?: string;
}

interface GamePlayer {
  player: GamePlayerSearch | null;
  wind: string;
  oorasuScore?: number;
  gameScore: number;   // puntos (25_000, etc.)
  uma: number;         // k
  chonbo: number;      // cantidad
  oka: number;         // k
  finalScore: number;  // puntos
  finalPosition: number; // 1..N
}

interface GameForm {
  date: string;
  nroJuegoDia: number;
  locationId?: number;
  duration: "HANCHAN" | "TONPUUSEN";
  seasonId?: number;
  tournamentId?: number;
  riichiFloating: number; // cantidad de riichis flotantes (cada uno = 1000 puntos)
  players: GamePlayer[];
}

interface Uma {
  id: number;
  name: string;
  firstPlace: number;   // k
  secondPlace: number;  // k
  thirdPlace: number;   // k
  fourthPlace: number | null; // k o null en sanma
}

interface Ruleset {
  id: number;
  name: string;
  inPoints: number;     // puntos (ej. 25000)
  outPoints: number;    // puntos (devolución)
  uma: Uma;             // valores en k
  oka: number;          // total a repartir en k
  chonbo: number;       // valor por chonbo en k
  sanma: boolean;
}

type Position = 1 | 2 | 3 | 4;

// ------------------ Helpers de cálculo (puros) ------------------
const round1 = (x: number) => Math.round(x * 10) / 10;

function computePositions(gameScores: number[]): Position[] {
  const idx = gameScores.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const pos: number[] = Array(gameScores.length).fill(0);
  let rank = 1;
  for (let k = 0; k < idx.length; k++) {
    if (k > 0 && idx[k].v < idx[k - 1].v) rank = k + 1;
    pos[idx[k].i] = rank;
  }
  return pos as Position[];
}

function calculateUmaForPosition(position: Position, finalPositions: Position[], umaValues: number[]): number {
  const tieCount = Math.max(1, finalPositions.filter((p) => p === position).length);
  const start = position;
  const end = Math.min(umaValues.length, position + tieCount - 1);
  let sum = 0, n = 0;
  for (let pos = start; pos <= end; pos++) {
    sum += umaValues[pos - 1] ?? 0; // pos es 1-based
    n++;
  }
  return n ? sum / n : 0;
}

function calculateUmaForAll(finalPositions: Position[], umaValues: number[]): number[] {
  return finalPositions.map((pos) => calculateUmaForPosition(pos, finalPositions, umaValues));
}

function calculateOkaDistributionPerPlayer(finalPositions: Position[], okaAmount: number): number[] {
  const N = finalPositions.length;
  const winners: number[] = [];
  finalPositions.forEach((pos, i) => { if (pos === 1) winners.push(i); });
  const out = Array(N).fill(0);
  if (okaAmount === 0 || winners.length === 0) return out;

  const DEC = 1, SCALE = 10 ** DEC;
  const baseShare = okaAmount / winners.length;
  const baseRounded = Math.floor(baseShare * SCALE) / SCALE;
  const shares = Array(winners.length).fill(baseRounded);
  let remUnits = Math.round((okaAmount - baseRounded * winners.length) * SCALE);
  for (let t = 0; t < remUnits; t++) {
    const idx = t % winners.length;
    shares[idx] = Math.round((shares[idx] + 1 / SCALE) * SCALE) / SCALE;
  }
  winners.forEach((wIdx, k) => (out[wIdx] = shares[k]));
  return out;
}

function buildUmaVector(finalPositions: Position[], ruleset: Ruleset): number[] {
  const umaValues = [
    ruleset.uma.firstPlace,
    ruleset.uma.secondPlace,
    ruleset.uma.thirdPlace,
    ruleset.uma.fourthPlace ?? 0,
  ].slice(0, finalPositions.length);
  return calculateUmaForAll(finalPositions, umaValues);
}

/**
 * Núcleo de cálculo desde el estado del form.
 * Retorna: posiciones, UMA(k), preOka(k), Oka(k), finales en k y en puntos.
 */
function computeFromFormPlayers(players: GamePlayer[], ruleset: Ruleset) {
  const scores = players.map((p) => p.gameScore ?? 0);          // puntos
  const positions = computePositions(scores);                   // 1..N
  const uma = buildUmaVector(positions, ruleset);               // k
  const devolucionK = ruleset.outPoints / 1000;                 // k
  const chonboK = players.map((p) => (p.chonbo ?? 0) * (ruleset.chonbo ?? 0)); // k

  const preOka = players.map((p, i) =>
    round1((p.gameScore ?? 0) / 1000 - devolucionK + uma[i] - chonboK[i])
  );
  const oka = calculateOkaDistributionPerPlayer(positions, ruleset.oka ?? 0).map(round1);
  const finalsK = preOka.map((v, i) => round1(v + oka[i]));
  const finalsPoints = finalsK.map((k) => Math.round(k * 1000));

  return { positions, uma, preOka, oka, finalsK, finalsPoints };
}

// ----------------------------------------------------

export function ImprovedSubmitGameForm() {
  const { handleError, handleSuccess } = useErrorHandler();
  const gameService = useGameService();
  const { gameDurationOptions, getGameDurationLabel } = useEnumI18n();

  const [form, setForm] = React.useState<GameForm>({
    date: new Date().toISOString().split("T")[0],
    nroJuegoDia: 1,
    duration: "HANCHAN",
    riichiFloating: 0,
    players: Array(4)
      .fill(null)
      .map(() => ({
        player: null,
        wind: "",
        oorasuScore: 0,
        gameScore: 25000, // Se actualizará cuando se cargue el ruleset
        uma: 0,
        chonbo: 0,
        oka: 0,
        finalScore: 0,
        finalPosition: 1,
      })),
  });

  const [playerCount, setPlayerCount] = React.useState<3 | 4>(4);
  const [availableRulesets, setAvailableRulesets] = React.useState<Ruleset[]>([]);
  const [selectedRuleset, setSelectedRuleset] = React.useState<Ruleset | null>(null);
  const [availableSeasons, setAvailableSeasons] = React.useState<
    { id: number; name: string; isActive: boolean }[]
  >([]);
  const [availableLocations, setAvailableLocations] = React.useState<
    { id: number; name: string; address?: string; city?: string }[]
  >([]);
  const [availableTournaments, setAvailableTournaments] = React.useState<
    { id: number; name: string; startDate: string; type: string }[]
  >([]);

  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [computedForSave, setComputedForSave] = React.useState<any>(null);

  // Helper para obtener el puntaje inicial basado en el ruleset
  const getInitialGameScore = () => {
    return selectedRuleset?.inPoints || 25000;
  };

  // Estados para validación del número de juego
  const [gameNumberValidation, setGameNumberValidation] = React.useState<{
    isValidating: boolean;
    isValid: boolean;
    message: string;
  }>({
    isValidating: false,
    isValid: true,
    message: "",
  });
  const [nextAvailableNumber, setNextAvailableNumber] = React.useState<number>(1);
  const [gapsInfo, setGapsInfo] = React.useState<{ gaps: number[]; hasGaps: boolean }>({ gaps: [], hasGaps: false });
  const [showGapWarning, setShowGapWarning] = React.useState(false);
  const validateDebRef = React.useRef<number | null>(null);

  // ---------- Carga de reglas, temporadas y ubicaciones ----------
  const loadRulesets = async (isSanma: boolean) => {
    try {
      const rulesetsRes = await fetch(`/api/rulesets?sanma=${isSanma}`);
      if (rulesetsRes.ok) {
        const rulesets = await rulesetsRes.json();
        setAvailableRulesets(rulesets);
        if (rulesets.length > 0) {
          setSelectedRuleset(rulesets[0]);
          // Actualizar puntajes iniciales de los jugadores
          const inPoints = rulesets[0].inPoints;
          setForm(prev => ({
            ...prev,
            players: prev.players.map(p => ({
              ...p,
              gameScore: inPoints
            }))
          }));
        }
      }

      const seasonsRes = await fetch("/api/seasons");
      if (seasonsRes.ok) {
        const seasonsData = await seasonsRes.json();
        if (seasonsData.success && Array.isArray(seasonsData.data)) {
          setAvailableSeasons(seasonsData.data);
          const active = seasonsData.data.find((s: any) => s.isActive);
          if (active) setForm((prev) => ({ ...prev, seasonId: active.id }));
        } else {
          setAvailableSeasons([]);
        }
      }

      const locationsRes = await fetch("/api/abm/locations");
      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        if (locationsData.success && Array.isArray(locationsData.data)) {
          setAvailableLocations(locationsData.data);
        } else {
          setAvailableLocations([]);
        }
      }

      const tournamentsRes = await fetch("/api/tournaments/active");
      if (tournamentsRes.ok) {
        const tournamentsData = await tournamentsRes.json();
        setAvailableTournaments(tournamentsData);
      }
    } catch (err) {
      handleError(err, "Cargar datos del formulario");
    }
  };

  React.useEffect(() => {
    loadRulesets(playerCount === 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Validación nro juego ----------
  const validateGameNumber = async (date: string, gameNumber: number) => {
    if (!date || !gameNumber) return;

    setGameNumberValidation((prev) => ({ ...prev, isValidating: true }));

    try {
      const response = await fetch("/api/games/next-game-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, gameNumber }),
      });

      const result = await response.json();

      if (result.available) {
        setGameNumberValidation({
          isValidating: false,
          isValid: true,
          message: "Número de juego disponible",
        });
      } else {
        setGameNumberValidation({
          isValidating: false,
          isValid: false,
          message: `El número ${gameNumber} ya existe para esta fecha`,
        });
      }
    } catch (error) {
      setGameNumberValidation({
        isValidating: false,
        isValid: false,
        message: "Error validando número de juego",
      });
    }
  };

  const getNextAvailableNumber = async (date: string) => {
    if (!date) return;

    try {
      const response = await fetch(`/api/games/next-game-number?date=${date}`);
      const result = await response.json();

      if (result.nextNumber) {
        setNextAvailableNumber(result.nextNumber);
        setGapsInfo({ gaps: result.gaps || [], hasGaps: result.hasGaps || false });
        setForm((prev) => ({ ...prev, nroJuegoDia: result.nextNumber }));

        let message = `Siguiente número disponible: ${result.nextNumber}`;
        if (result.hasGaps && result.gaps.length > 0) {
          message += ` (Gaps disponibles: ${result.gaps.join(', ')})`;
        }

        setGameNumberValidation({
          isValidating: false,
          isValid: true,
          message,
        });
      }
    } catch (error) {
      console.error("Error obteniendo siguiente número:", error);
    }
  };

  // ---------- Cargar siguiente número disponible cuando cambie la fecha ----------
  React.useEffect(() => {
    if (form.date) {
      getNextAvailableNumber(form.date);
    }
  }, [form.date]);

  // ---------- Cambiar entre 3 y 4 jugadores ----------
  const togglePlayerCount = () => {
    const newCount = playerCount === 4 ? 3 : 4;
    setPlayerCount(newCount);
    loadRulesets(newCount === 3);

    const newPlayers = Array(newCount)
      .fill(null)
      .map(
        (_, i) =>
          form.players[i] || {
            player: null,
            wind: "",
            oorasuScore: 0,
            gameScore: getInitialGameScore(),
            uma: 0,
            chonbo: 0,
            oka: 0,
            finalScore: 0,
            finalPosition: 1,
          }
      );
    setForm((p) => ({ ...p, players: newPlayers }));
  };

  // ---------- Búsqueda de jugadores (para autocomplete de la planilla) ----------
  const searchPlayers = async (query: string): Promise<GamePlayerSearch[]> => {
    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(query || "")}`);
      if (res.ok) {
        const data = await res.json();
        const result = Array.isArray(data) ? data : [];
        return result;
      }
    } catch (e) {
      console.error("Error searching players:", e);
    }
    return [];
  };

  // ---------- Helpers de nombre ----------
  const formatDisplayName = (pl: GamePlayerSearch | null | undefined) =>
    pl ? `${pl.nickname} (L${pl.playerNumber})` : "";
  const stripLeagueTag = (s: string) => s.replace(/\s*\(L\d+\)\s*$/, "");

  // ---------- Cálculo puro (useMemo) y sincronización segura ----------
  const calc = React.useMemo(() => {
    if (!selectedRuleset) return null;
    const slice = form.players.slice(0, playerCount);
    return computeFromFormPlayers(slice, selectedRuleset);
  }, [selectedRuleset, playerCount, form.players]);

  // compara si cambió algo realmente (para evitar loops)
  function anyDiff(formPlayers: GamePlayer[], c: NonNullable<typeof calc>, len: number) {
    for (let i = 0; i < len; i++) {
      if (
        formPlayers[i].finalScore !== c.finalsPoints[i] ||
        formPlayers[i].uma !== c.uma[i] ||
        formPlayers[i].oka !== c.oka[i] ||
        formPlayers[i].finalPosition !== c.positions[i]
      ) {
        return true;
      }
    }
    return false;
  }

  React.useEffect(() => {
    if (!calc) return;
    const len = Math.min(playerCount, form.players.length);
    if (!anyDiff(form.players, calc, len)) return; // ✅ evita loop

    setComputedForSave({
      positions: calc.positions,
      uma: calc.uma,
      preOka: calc.preOka,
      oka: calc.oka,
      finals: calc.finalsPoints, // puntos
    });

    setForm((prev) => ({
      ...prev,
      players: prev.players.map((p, i) =>
        i < len
          ? {
            ...p,
            finalScore: calc.finalsPoints[i],
            uma: calc.uma[i],
            oka: calc.oka[i],
            finalPosition: calc.positions[i],
          }
          : p
      ),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calc, playerCount]);

  // ---------- Validaciones de envío ----------
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!form.nroJuegoDia) errors.push("El número de juego es requerido");
    if (!gameNumberValidation.isValid) errors.push(gameNumberValidation.message);
    if (!imageFile) errors.push("La imagen del resultado es obligatoria");

    if (!selectedRuleset) {
      errors.push("Debe seleccionar un conjunto de reglas");
      return errors;
    }

    const playersWithData = form.players.slice(0, playerCount).filter((p) => p.player);
    if (playersWithData.length < 3) errors.push("Debe seleccionar al menos 3 jugadores");

    const ids = playersWithData.map((p) => p.player!.id);
    if (ids.length !== new Set(ids).size) errors.push("No puede haber jugadores duplicados");

    playersWithData.forEach((p, i) => {
      if (p.gameScore % 100 !== 0) {
        errors.push(`Jugador ${i + 1}: El puntaje debe ser múltiplo de 100 (ej: 25000, no 25050)`);
      }
    });

    const totalGameScore = form.players
      .slice(0, playerCount)
      .reduce((s, p) => (p.gameScore != null ? s + p.gameScore : s), 0);

    const expected = selectedRuleset.inPoints * playerCount;
    const riichiFloatingPoints = (form.riichiFloating || 0) * 1000;
    const expectedWithRiichi = expected + riichiFloatingPoints;

    if (totalGameScore !== expectedWithRiichi) {
      const fmt = (n: number) => n.toLocaleString("es-ES");
      const riichiText = riichiFloatingPoints > 0 ? ` + ${fmt(riichiFloatingPoints)} (riichis flotantes)` : "";
      errors.push(
        `Los puntajes de partida deben sumar ${fmt(expected)}${riichiText}. Actual: ${fmt(totalGameScore)}`
      );
    }

    // Usar el valor calculado del GameResultsSheet que incluye chonbo
    const totalFinal = computedForSave?.finals?.reduce((s: number, score: number) => s + (score || 0), 0) ?? 0;
    if (Math.abs(totalFinal) > 100) {
      errors.push(`El total final debe ser 0. Actual: ${(totalFinal / 1000).toFixed(1)}`);
    }

    return errors;
  };

  // ---------- Enviar ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    setValidationErrors(errors);
    if (errors.length > 0) return;

    // Verificar gaps en la secuencia antes de enviar
    const currentNumber = form.nroJuegoDia;
    const hasGapsBeforeCurrentNumber = gapsInfo.gaps.some(gap => gap < currentNumber);

    if (hasGapsBeforeCurrentNumber && !showGapWarning) {
      const missingNumbers = gapsInfo.gaps.filter(gap => gap < currentNumber);
      const confirmed = window.confirm(
        `⚠️ Atención: Hay números de juego faltantes antes del ${currentNumber}.\n\n` +
        `Números faltantes: ${missingNumbers.join(', ')}\n\n` +
        `¿Estás seguro de que quieres enviar el juego ${currentNumber}?\n\n` +
        `Es recomendable llenar los gaps primero para mantener la secuencia correcta.`
      );

      if (!confirmed) {
        return; // No enviar si el usuario cancela
      }
    }

    setLoading(true);
    setSubmitSuccess(false);

    try {
      if (!selectedRuleset) throw new Error("Sin ruleset");

      const formData = new FormData();
      formData.append("date", form.date);
      formData.append("nroJuegoDia", String(form.nroJuegoDia));
      if (form.locationId) formData.append("locationId", String(form.locationId));
      formData.append("duration", form.duration);
      formData.append("riichiFloating", String(form.riichiFloating || 0));
      formData.append("sanma", String(playerCount === 3));
      formData.append("rulesetId", String(selectedRuleset.id));
      if (form.seasonId) formData.append("seasonId", String(form.seasonId));
      if (form.tournamentId) formData.append("tournamentId", String(form.tournamentId));
      if (imageFile) formData.append("image", imageFile);

      const playersData = form.players
        .slice(0, playerCount)
        .filter((p) => p.player)
        .map((p) => ({
          player: p.player!,
          wind: p.wind,
          oorasuScore: p.oorasuScore,
          gameScore: p.gameScore,
          chonbo: p.chonbo,
          finalScore: p.finalScore,
          finalPosition: p.finalPosition,
          uma: p.uma,
          oka: p.oka,
        }));

      formData.append("players", JSON.stringify(playersData));

      await gameService.submitGame(formData);
      setSubmitSuccess(true);
      setValidationErrors([]);
      handleSuccess("Juego enviado exitosamente para validación", "Envío exitoso");

      setForm({
        date: new Date().toISOString().split("T")[0],
        nroJuegoDia: 1,
        duration: "HANCHAN",
        riichiFloating: 0,
        players: Array(playerCount)
          .fill(null)
          .map(() => ({
            player: null,
            wind: "",
            oorasuScore: 0,
            gameScore: 25000,
            uma: 0,
            chonbo: 0,
            oka: 0,
            finalScore: 0,
            finalPosition: 1,
          })),
      });
      setImageFile(null);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      handleError(error, "Enviar juego");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Handlers: cambios desde la sheet ----------
  const handleComputedChange = (c: any) => {
    // si tu sheet sigue calculando, lo reflejamos; si no, calc (useMemo) lo hará
    setComputedForSave(c);
    setForm((prev) => ({
      ...prev,
      players: prev.players.map((p, index) => ({
        ...p,
        finalScore: c.finals?.[index] ?? p.finalScore,
        uma: c.uma?.[index] ?? p.uma,
        oka: c.oka?.[index] ?? p.oka,
      })),
    }));
  };

  const onSave = async () => {
    const c = computedForSave ?? {
      finals: form.players.map((p) => p.finalScore),
      positions: form.players.map((p) => p.finalPosition),
      uma: form.players.map((p) => p.uma),
      oka: form.players.map((p) => p.oka),
    };
    const body = {
      player1_id: form.players[0]?.player?.id ?? null,
      player2_id: form.players[1]?.player?.id ?? null,
      player3_id: form.players[2]?.player?.id ?? null,
      player4_id: form.players[3]?.player?.id ?? null,

      player1_final_score: c?.finals?.[0] ?? null,
      player2_final_score: c?.finals?.[1] ?? null,
      player3_final_score: c?.finals?.[2] ?? null,
      player4_final_score: c?.finals?.[3] ?? null,

      player1_position: c?.positions?.[0] ?? null,
      player2_position: c?.positions?.[1] ?? null,
      player3_position: c?.positions?.[2] ?? null,
      player4_position: c?.positions?.[3] ?? null,

      player1_uma: c?.uma?.[0] ?? 0,
      player2_uma: c?.uma?.[1] ?? 0,
      player3_uma: c?.uma?.[2] ?? 0,
      player4_uma: c?.uma?.[3] ?? 0,

      player1_oka: c?.oka?.[0] ?? 0,
      player2_oka: c?.oka?.[1] ?? 0,
      player3_oka: c?.oka?.[2] ?? 0,
      player4_oka: c?.oka?.[3] ?? 0,
    };
    try {
      await gameService.computeGame(body);
      handleSuccess("Juego guardado exitosamente", "Guardado exitoso");
    } catch (error) {
      handleError(error, "Guardar juego");
    }
  };

  const canRenderSheet = !!selectedRuleset;
  const GameResultsSheetAny = GameResultsSheet as any;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitSuccess && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            ¡Juego enviado para validación exitosamente! Un administrador revisará y aprobará el
            juego antes de actualizar rankings.
          </AlertDescription>
        </Alert>
      )}

      {/* Datos básicos */}
      {/* Versión desktop con Card */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Información del Juego
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="date">Fecha</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="nroJuegoDia">Nro. de Juego del Día *</Label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                max="20"
                placeholder="Ej: 1, 2, 3..."
                value={form.nroJuegoDia ?? ""}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : 1;
                  setForm((p) => ({ ...p, nroJuegoDia: value }));

                  if (validateDebRef.current) window.clearTimeout(validateDebRef.current);
                  if (value && form.date) {
                    validateDebRef.current = window.setTimeout(
                      () => validateGameNumber(form.date, value),
                      500
                    ) as unknown as number;
                  }
                }}
                className={`${gameNumberValidation.isValidating
                  ? "border-yellow-400"
                  : gameNumberValidation.isValid
                    ? "border-green-400"
                    : "border-red-400"
                  }`}
                required
              />
              {gameNumberValidation.isValidating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            <div className="mt-1">
              {gameNumberValidation.message && (
                <p
                  className={`text-xs ${gameNumberValidation.isValid ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {gameNumberValidation.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Obligatorio. No puede repetirse el mismo número en la misma fecha.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="location">Ubicación</Label>
            <Select
              value={form.locationId ? availableLocations.find(loc => loc.id === form.locationId)?.name || "" : ""}
              onValueChange={(value) => {
                const selectedLocation = availableLocations.find(loc => loc.name === value);
                setForm((p) => ({ ...p, locationId: selectedLocation?.id || undefined }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ubicación" />
              </SelectTrigger>
              <SelectContent>
                {availableLocations.map((location) => (
                  <SelectItem key={location.id} value={location.name}>
                    {location.name}
                    {location.city && ` - ${location.city}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <div>
            <Label htmlFor="duration">Duración</Label>
            <Select
              value={form.duration}
              onValueChange={(value) => {
                setForm((p) => ({ ...p, duration: value as "HANCHAN" | "TONPUUSEN" }));
              }}
            >
              <SelectTrigger>
                <span>
                  {form.duration ? getGameDurationLabel(form.duration) : "Seleccionar duración"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {gameDurationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <div>
            <Label>Número de Jugadores</Label>
            <Button type="button" variant="outline" onClick={togglePlayerCount} className="w-full">
              {playerCount === 4 ? "4 Jugadores" : "3 Jugadores (Sanma)"}
            </Button>
          </div>

          <div>
            <Label htmlFor="ruleset">Reglas de Juego</Label>
            <Select
              value={selectedRuleset?.name ?? ""}
              onValueChange={(value) => {
                const r = availableRulesets.find((x) => x.name === value) || null;
                setSelectedRuleset(r);
                // Actualizar puntajes iniciales de los jugadores
                if (r) {
                  setForm(prev => ({
                    ...prev,
                    players: prev.players.map(p => ({
                      ...p,
                      gameScore: r.inPoints
                    }))
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar reglas..." />
              </SelectTrigger>
              <SelectContent>
                {availableRulesets.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name} {r.sanma ? "(Sanma)" : "(4 jugadores)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="season">Temporada (Opcional)</Label>
            <Select
              value={form.seasonId ? availableSeasons.find(s => s.id === form.seasonId)?.name ?? "" : ""}
              onValueChange={(value) => {
                if (value === "") {
                  setForm((p) => ({ ...p, seasonId: undefined }));
                } else {
                  const selectedSeason = availableSeasons.find(s => s.name === value);
                  setForm((p) => ({
                    ...p,
                    seasonId: selectedSeason?.id || undefined,
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin temporada específica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin temporada específica</SelectItem>
                {availableSeasons.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name} {s.isActive ? "(Activa)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Opcional. Si no se selecciona, el juego será casual y no actualizará rankings.
            </p>
          </div>

          <div>
            <Label htmlFor="tournament">Torneo (Opcional)</Label>
            <Select
              value={form.tournamentId ? availableTournaments.find(t => t.id === form.tournamentId)?.name ?? "" : ""}
              onValueChange={(value) => {
                if (value === "") {
                  setForm((p) => ({ ...p, tournamentId: undefined }));
                } else {
                  const selectedTournament = availableTournaments.find(t => t.name === value);
                  setForm((p) => ({
                    ...p,
                    tournamentId: selectedTournament?.id || undefined,
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin torneo específico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin torneo específico</SelectItem>
                {availableTournaments.map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    {t.name} ({t.type}) - {new Date(t.startDate).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Opcional. Solo se muestran torneos sin fecha de finalización.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Versión móvil sin Card */}
      <div className="md:hidden space-y-4">
        {/* Header compacto */}
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <Calendar className="h-4 w-4 text-gray-600" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Información del Juego</h2>
        </div>

        {/* Campos sin CardContent */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="date">Fecha</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="nroJuegoDia">Nro. de Juego del Día *</Label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                max="20"
                placeholder="Ej: 1, 2, 3..."
                value={form.nroJuegoDia ?? ""}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : 1;
                  setForm((p) => ({ ...p, nroJuegoDia: value }));

                  if (validateDebRef.current) window.clearTimeout(validateDebRef.current);
                  if (value && form.date) {
                    validateDebRef.current = window.setTimeout(
                      () => validateGameNumber(form.date, value),
                      500
                    ) as unknown as number;
                  }
                }}
                className={`${gameNumberValidation.isValidating
                  ? "border-yellow-400"
                  : gameNumberValidation.isValid
                    ? "border-green-400"
                    : "border-red-400"
                  }`}
                required
              />
              {gameNumberValidation.isValidating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            <div className="mt-1">
              {gameNumberValidation.message && (
                <p
                  className={`text-xs ${gameNumberValidation.isValid ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {gameNumberValidation.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Obligatorio. No puede repetirse el mismo número en la misma fecha.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="location">Ubicación</Label>
            <Select
              value={form.locationId ? availableLocations.find(loc => loc.id === form.locationId)?.name || "" : ""}
              onValueChange={(value) => {
                const selectedLocation = availableLocations.find(loc => loc.name === value);
                setForm((p) => ({ ...p, locationId: selectedLocation?.id || undefined }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ubicación" />
              </SelectTrigger>
              <SelectContent>
                {availableLocations.map((location) => (
                  <SelectItem key={location.id} value={location.name}>
                    {location.name}
                    {location.city && ` - ${location.city}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="duration">Duración</Label>
            <Select
              value={form.duration}
              onValueChange={(value) => {
                setForm((p) => ({ ...p, duration: value as "HANCHAN" | "TONPUUSEN" }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar duración" />
              </SelectTrigger>
              <SelectContent>
                {gameDurationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Número de Jugadores</Label>
            <Button type="button" variant="outline" onClick={togglePlayerCount} className="w-full">
              {playerCount === 4 ? "4 Jugadores" : "3 Jugadores (Sanma)"}
            </Button>
          </div>

          <div>
            <Label htmlFor="ruleset">Reglas de Juego</Label>
            <Select
              value={selectedRuleset?.name ?? ""}
              onValueChange={(value) => {
                const r = availableRulesets.find((x) => x.name === value) || null;
                setSelectedRuleset(r);
                // Actualizar puntajes iniciales de los jugadores
                if (r) {
                  setForm(prev => ({
                    ...prev,
                    players: prev.players.map(p => ({
                      ...p,
                      gameScore: r.inPoints
                    }))
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar reglas..." />
              </SelectTrigger>
              <SelectContent>
                {availableRulesets.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name} {r.sanma ? "(Sanma)" : "(4 jugadores)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="season">Temporada (Opcional)</Label>
            <Select
              value={form.seasonId ? availableSeasons.find(s => s.id === form.seasonId)?.name ?? "" : ""}
              onValueChange={(value) => {
                if (value === "") {
                  setForm((p) => ({ ...p, seasonId: undefined }));
                } else {
                  const selectedSeason = availableSeasons.find(s => s.name === value);
                  setForm((p) => ({
                    ...p,
                    seasonId: selectedSeason?.id || undefined,
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin temporada específica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin temporada específica</SelectItem>
                {availableSeasons.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name} {s.isActive ? "(Activa)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Opcional. Si no se selecciona, el juego será casual y no actualizará rankings.
            </p>
          </div>

          <div>
            <Label htmlFor="tournament">Torneo (Opcional)</Label>
            <Select
              value={form.tournamentId ? availableTournaments.find(t => t.id === form.tournamentId)?.name ?? "" : ""}
              onValueChange={(value) => {
                if (value === "") {
                  setForm((p) => ({ ...p, tournamentId: undefined }));
                } else {
                  const selectedTournament = availableTournaments.find(t => t.name === value);
                  setForm((p) => ({
                    ...p,
                    tournamentId: selectedTournament?.id || undefined,
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin torneo específico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin torneo específico</SelectItem>
                {availableTournaments.map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    {t.name} ({t.type}) - {new Date(t.startDate).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Opcional. Solo se muestran torneos sin fecha de finalización.
            </p>
          </div>
        </div>
      </div>

      {/* ✅ Planilla reutilizable */}
      {/* Versión desktop con Card */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Planilla de Juego</CardTitle>
        </CardHeader>
        <CardContent>
          {canRenderSheet ? (
            <>
              {/* Versión desktop - oculta en mobile */}
              <div className="hidden md:block">
                <GameResultsSheetAny
                  key={`${playerCount}-${selectedRuleset?.id ?? "none"}`} // fuerza recomputar al cambiar
                  ruleset={selectedRuleset!}
                  rows={form.players.map((p) => ({
                    id: p.player?.id ?? null, // null, nunca undefined
                    displayName: formatDisplayName(p.player),
                    wind: p.wind ?? "",
                    oorasuScore:
                      typeof p.oorasuScore === "number" ? p.oorasuScore : 0, // o null si prefieres
                    gameScore: typeof p.gameScore === "number" ? p.gameScore : 0,
                    chonbo: typeof p.chonbo === "number" ? p.chonbo : 0,
                  }))}
                  playerCount={playerCount}
                  editable={true}
                  showWind={true}
                  showOorasu={true}
                  riichiFloating={form.riichiFloating || 0}
                  onRiichiFloatingChange={(value: number) => {
                    setForm((prev) => ({ ...prev, riichiFloating: value }));
                  }}
                  searchPlayers={searchPlayers}
                  onRowsChange={(rows: any[]) => {
                    setForm((prev) => ({
                      ...prev,
                      players: rows.map((r, idx) => {
                        const prevP = prev.players[idx];
                        const id = r.id ? Number(r.id) : null;

                        // reconstruye o reutiliza el player
                        let player: GamePlayerSearch | null = null;
                        if (id) {
                          if (prevP.player && prevP.player.id === id) {
                            player = prevP.player;
                          } else {
                            const nickname = stripLeagueTag(r.displayName || "");
                            const playerId = Number(
                              r.displayName?.match(/\(L(\d+)\)/)?.[1] ?? 0
                            );
                            player = { id, nickname, playerNumber: playerId };
                          }
                        }

                        return {
                          ...prevP,
                          player,
                          wind: r.wind ?? "",
                          oorasuScore: r.oorasuScore ?? 0,
                          gameScore: r.gameScore ?? 0,
                          chonbo: r.chonbo ?? 0,
                        };
                      }),
                    }));
                  }}
                  onComputedChange={handleComputedChange}
                  onSave={onSave}
                />
              </div>

              {/* Versión mobile - visible solo en mobile */}
              <div className="md:hidden">
                <GameResultsSheetMobile
                  key={`mobile-${playerCount}-${selectedRuleset?.id ?? "none"}`}
                  ruleset={selectedRuleset!}
                  rows={form.players.map((p) => ({
                    id: p.player?.id ?? null,
                    displayName: formatDisplayName(p.player),
                    wind: p.wind ?? "",
                    oorasuScore: typeof p.oorasuScore === "number" ? p.oorasuScore : 0,
                    gameScore: typeof p.gameScore === "number" ? p.gameScore : 0,
                    chonbo: typeof p.chonbo === "number" ? p.chonbo : 0,
                  }))}
                  playerCount={playerCount}
                  editable={true}
                  showWind={true}
                  showOorasu={true}
                  riichiFloating={form.riichiFloating || 0}
                  onRiichiFloatingChange={(value: number) => {
                    setForm((prev) => ({ ...prev, riichiFloating: value }));
                  }}
                  searchPlayers={searchPlayers}
                  onRowsChange={(rows: any[]) => {
                    setForm((prev) => ({
                      ...prev,
                      players: rows.map((r, idx) => {
                        const prevP = prev.players[idx];
                        const id = r.id ? Number(r.id) : null;

                        let player: GamePlayerSearch | null = null;
                        if (id) {
                          if (prevP.player && prevP.player.id === id) {
                            player = prevP.player;
                          } else {
                            const nickname = stripLeagueTag(r.displayName || "");
                            const playerId = Number(
                              r.displayName?.match(/\(L(\d+)\)/)?.[1] ?? 0
                            );
                            player = { id, nickname, playerNumber: playerId };
                          }
                        }

                        return {
                          ...prevP,
                          player,
                          wind: r.wind ?? "",
                          oorasuScore: r.oorasuScore ?? 0,
                          gameScore: r.gameScore ?? 0,
                          chonbo: r.chonbo ?? 0,
                        };
                      }),
                    }));
                  }}
                  onComputedChange={handleComputedChange}
                  onSave={onSave}
                />
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Cargando reglas… seleccioná un ruleset para habilitar la planilla.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Versión móvil de planilla sin Card */}
      <div className="md:hidden space-y-4">
        {/* Header compacto */}
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Planilla de Juego</h2>
        </div>

        {/* Planilla sin CardContent */}
        {canRenderSheet ? (
          <div className="md:hidden">
            <GameResultsSheetMobile
              key={`mobile-${playerCount}-${selectedRuleset?.id ?? "none"}`}
              ruleset={selectedRuleset!}
              rows={form.players.map((p) => ({
                id: p.player?.id ?? null,
                displayName: formatDisplayName(p.player),
                wind: p.wind ?? "",
                oorasuScore: typeof p.oorasuScore === "number" ? p.oorasuScore : 0,
                gameScore: typeof p.gameScore === "number" ? p.gameScore : 0,
                chonbo: typeof p.chonbo === "number" ? p.chonbo : 0,
              }))}
              playerCount={playerCount}
              editable={true}
              showWind={true}
              showOorasu={true}
              riichiFloating={form.riichiFloating || 0}
              onRiichiFloatingChange={(value: number) => {
                setForm((prev) => ({ ...prev, riichiFloating: value }));
              }}
              searchPlayers={searchPlayers}
              onRowsChange={(rows: any[]) => {
                setForm((prev) => ({
                  ...prev,
                  players: rows.map((r, idx) => {
                    const prevP = prev.players[idx];
                    const id = r.id ? Number(r.id) : null;

                    let player: GamePlayerSearch | null = null;
                    if (id) {
                      if (prevP.player && prevP.player.id === id) {
                        player = prevP.player;
                      } else {
                        const nickname = stripLeagueTag(r.displayName || "");
                        const playerId = Number(
                          r.displayName?.match(/\(L(\d+)\)/)?.[1] ?? 0
                        );
                        player = { id, nickname, playerNumber: playerId };
                      }
                    }

                    return {
                      ...prevP,
                      player,
                      wind: r.wind ?? "",
                      oorasuScore: r.oorasuScore ?? 0,
                      gameScore: r.gameScore ?? 0,
                      chonbo: r.chonbo ?? 0,
                    };
                  }),
                }));
              }}
              onComputedChange={handleComputedChange}
              onSave={onSave}
            />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Cargando reglas… seleccioná un ruleset para habilitar la planilla.
          </div>
        )}
      </div>

      {/* Imagen opcional */}
      {/* Versión desktop con Card */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Imagen de Resultado *
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 sm:p-6">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer block">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                <div className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    Subir imagen *
                  </span>
                  <span className="hidden sm:inline"> o arrastra y suelta</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 10MB (obligatorio)</p>
              </div>
            </label>
            {imageFile && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Archivo seleccionado:</span>
                </div>
                <div className="mt-1 text-sm text-green-700 dark:text-green-300 truncate">
                  {imageFile.name}
                </div>
                <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                  {(imageFile.size / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Versión móvil de imagen sin Card */}
      <div className="md:hidden space-y-4">
        {/* Header compacto */}
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <Upload className="h-4 w-4 text-gray-600" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Imagen de Resultado *</h2>
        </div>

        {/* Upload sin CardContent */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="hidden"
            id="image-upload-mobile"
          />
          <label htmlFor="image-upload-mobile" className="cursor-pointer block">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Subir imagen *
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 10MB (obligatorio)</p>
            </div>
          </label>
          {imageFile && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Archivo seleccionado:</span>
              </div>
              <div className="mt-1 text-sm text-green-700 dark:text-green-300 truncate">
                {imageFile.name}
              </div>
              <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                {(imageFile.size / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Errores */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center sm:justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full sm:w-auto min-w-[150px] text-base py-3"
        >
          {loading ? "Procesando..." : "Anotar Juego"}
        </Button>
      </div>
    </form>
  );

}
