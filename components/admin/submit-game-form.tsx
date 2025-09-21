"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnumI18n } from "@/hooks/use-enum-i18n";
import { commonApi, gamesApi, seasonsApi } from "@/lib/api/client";
import { Calculator, Calendar, CheckCircle, Upload, Users } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PlayerScore {
  playerId: string;
  nickname: string;
  score: number;
  finalScore?: number;
  position?: number;
  chonbo: number;
}

interface GameSubmission {
  gameType: "HANCHAN" | "TONPUUSEN";
  date: string;
  locationId: string;
  seasonId?: string;
  tournamentId?: string;
  rulesetId: string;
  players: PlayerScore[];
  image?: File;
}

export function SubmitGameForm() {
  const { gameDurationOptions, getGameDurationLabel } = useEnumI18n();

  const [gameData, setGameData] = useState<GameSubmission>({
    gameType: "HANCHAN",
    date: new Date().toISOString().split('T')[0],
    locationId: "",
    rulesetId: "",
    players: [
      { playerId: "", nickname: "", score: 0, chonbo: 0 },
      { playerId: "", nickname: "", score: 0, chonbo: 0 },
      { playerId: "", nickname: "", score: 0, chonbo: 0 },
      { playerId: "", nickname: "", score: 0, chonbo: 0 },
    ],
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSanmaOption, setShowSanmaOption] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Reference data
  const [locations, setLocations] = useState<any[]>([]);
  const [rulesets, setRulesets] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [activeSeason, setActiveSeason] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load reference data on mount
  useEffect(() => {
    async function loadReferenceData() {
      try {
        setLoading(true);
        const [locationsRes, rulesetsRes, seasonsRes, activeSeasonRes] = await Promise.all([
          commonApi.getLocations(),
          commonApi.getRulesets(),
          seasonsApi.getAll(),
          seasonsApi.getActive()
        ]);

        if (locationsRes.success) setLocations(locationsRes.data || []);
        if (rulesetsRes.success) setRulesets(rulesetsRes.data || []);
        if (seasonsRes.success) setSeasons(seasonsRes.data || []);
        if (activeSeasonRes.success && activeSeasonRes.data) {
          setActiveSeason(activeSeasonRes.data);
          setGameData(prev => ({ ...prev, seasonId: activeSeasonRes.data.id.toString() }));
        }
      } catch (error) {
        console.error('Error loading reference data:', error);
        setErrors(['Error al cargar datos de configuración']);
      } finally {
        setLoading(false);
      }
    }

    loadReferenceData();
  }, []);

  // Validate scores sum to zero
  const validateScores = () => {
    const totalScore = gameData.players.reduce((sum, player) => sum + player.score, 0);
    const newErrors: string[] = [];

    if (totalScore !== 0) {
      newErrors.push(`La suma de puntajes debe ser 0. Actual: ${totalScore}`);
    }

    // Check for empty player IDs
    gameData.players.forEach((player, index) => {
      if (!player.playerId) {
        newErrors.push(`Jugador ${index + 1} debe tener un ID válido`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Calculate positions and final scores based on scores and uma
  const calculatePositionsAndFinalScores = () => {
    // TODO: Implement position calculation logic based on scores + uma
    // This should integrate with the ruleset uma values
    const sortedPlayers = [...gameData.players].sort((a, b) => b.score - a.score);

    sortedPlayers.forEach((player, index) => {
      player.position = index + 1;
      // TODO: Apply uma and oka calculations here
      player.finalScore = player.score; // Placeholder
    });

    return sortedPlayers;
  };

  const handlePlayerChange = (index: number, field: keyof PlayerScore, value: string | number) => {
    const updatedAtPlayers = [...gameData.players];
    updatedAtPlayers[index] = { ...updatedAtPlayers[index], [field]: value };
    setGameData({ ...gameData, players: updatedAtPlayers });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setGameData({ ...gameData, image: file });
    }
  };

  const toggleSanma = () => {
    const newPlayerCount = showSanmaOption ? 4 : 3;
    const players = gameData.players.slice(0, newPlayerCount);

    if (newPlayerCount === 4 && players.length === 3) {
      players.push({ playerId: "", nickname: "", score: 0, chonbo: 0 });
    }

    setGameData({ ...gameData, players });
    setShowSanmaOption(!showSanmaOption);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateScores()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      const submitData = {
        game_length: gameData.gameType,
        date_played: gameData.date,
        location_id: parseInt(gameData.locationId),
        ruleset_id: parseInt(gameData.rulesetId),
        season_id: gameData.seasonId ? parseInt(gameData.seasonId) : undefined,
        tournament_id: gameData.tournamentId ? parseInt(gameData.tournamentId) : undefined,
        players: gameData.players.map(p => ({
          player_id: parseInt(p.playerId),
          score: p.score,
          chonbo: p.chonbo
        })),
        image_url: gameData.image?.name || undefined // TODO: Implement image upload
      };

      const response = await gamesApi.submit(submitData);

      if (response.success) {
        setSubmitSuccess(true);
        setErrors([]);

        // Reset form after successful submission
        setGameData({
          gameType: "HANCHAN",
          date: new Date().toISOString().split('T')[0],
          locationId: "",
          rulesetId: "",
          seasonId: activeSeason?.id.toString() || "",
          tournamentId: "",
          players: [
            { playerId: "", nickname: "", score: 0, chonbo: 0 },
            { playerId: "", nickname: "", score: 0, chonbo: 0 },
            { playerId: "", nickname: "", score: 0, chonbo: 0 },
            { playerId: "", nickname: "", score: 0, chonbo: 0 },
          ],
        });

        // Clear success message after 5 seconds
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        setErrors([response.error || 'Error al enviar el juego']);
      }

    } catch (error) {
      setErrors([`Error de conexión: ${error}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400">Cargando formulario...</div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {submitSuccess && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            ¡Juego enviado exitosamente! Está pendiente de validación por otro administrador.
          </AlertDescription>
        </Alert>
      )}

      {/* Game Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Información del Juego
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="gameType">Tipo de Juego</Label>
            <Select value={gameData.gameType} onValueChange={(value) =>
              setGameData({ ...gameData, gameType: value as "HANCHAN" | "TONPUUSEN" })}>
              <SelectTrigger>
                <span>
                  {getGameDurationLabel(gameData.gameType) || "Seleccionar tipo"}
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
            <Label htmlFor="date">Fecha</Label>
            <Input
              type="date"
              value={gameData.date}
              onChange={(e) => setGameData({ ...gameData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Número de Jugadores</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleSanma}
              >
                {showSanmaOption ? "4 Jugadores" : "3 Jugadores (Sanma)"}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="location">Ubicación</Label>
            <Select value={gameData.locationId} onValueChange={(value) =>
              setGameData({ ...gameData, locationId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ubicación" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="ruleset">Reglas de Juego</Label>
            <Select value={gameData.rulesetId} onValueChange={(value) =>
              setGameData({ ...gameData, rulesetId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar reglas" />
              </SelectTrigger>
              <SelectContent>
                {rulesets.map((ruleset) => (
                  <SelectItem key={ruleset.id} value={ruleset.id.toString()}>
                    {ruleset.name} ({ruleset.uma_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="season">Temporada</Label>
            <Select value={gameData.seasonId || ""} onValueChange={(value) =>
              setGameData({ ...gameData, seasonId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar temporada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin temporada (casual)</SelectItem>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id.toString()}>
                    {season.name} {season.is_active && "(Activa)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Players Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Puntajes de Jugadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {gameData.players.map((player, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                <div>
                  <Label>Jugador {index + 1}</Label>
                  <Input
                    placeholder="ID del jugador"
                    value={player.playerId}
                    onChange={(e) => handlePlayerChange(index, "playerId", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Nickname</Label>
                  <Input
                    placeholder="Nickname"
                    value={player.nickname}
                    onChange={(e) => handlePlayerChange(index, "nickname", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Puntaje Final</Label>
                  <Input
                    type="number"
                    placeholder="Ej: 25000"
                    value={player.score || ""}
                    onChange={(e) => handlePlayerChange(index, "score", parseInt(e.target.value) || 0)}
                    required
                  />
                </div>

                <div>
                  <Label>Chonbo</Label>
                  <Input
                    type="number"
                    min="0"
                    value={player.chonbo}
                    onChange={(e) => handlePlayerChange(index, "chonbo", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="flex items-end">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>Pos: {player.position || "—"}</div>
                    <div>Final: {player.finalScore || "—"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Calculator className="h-4 w-4" />
              <span>Suma total: {gameData.players.reduce((sum, p) => sum + p.score, 0)}</span>
              {gameData.players.reduce((sum, p) => sum + p.score, 0) === 0 ? (
                <span className="text-green-600 dark:text-green-400">✓ Válido</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">✗ Debe ser 0</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Imagen de Resultado (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    Subir imagen
                  </span>
                  {" "}o arrastra y suelta
                </div>
                <p className="text-xs text-gray-500">PNG, JPG hasta 10MB</p>
              </div>
            </label>
            {gameData.image && (
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                ✓ {gameData.image.name}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || errors.length > 0}
          className="min-w-[150px]"
        >
          {isSubmitting ? "Enviando..." : "Enviar Juego"}
        </Button>
      </div>
    </form>
  );
}
