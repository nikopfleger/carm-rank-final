"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { RankBadge } from "./ui/rank-badge";

type PlayerProfileProps = {
  legajo: number;
};

interface PlayerData {
  playerId: number;
  nickname: string;
  fullname?: string;
  isActive: boolean;
  rankings?: Array<{
    totalGames: number;
    averagePosition: number;
    danPoints: number;
    ratePoints: number;
    maxRate: number;
    seasonPoints: number;
    firstPlaceH: number;
    secondPlaceH: number;
    thirdPlaceH: number;
    fourthPlaceH: number;
    firstPlaceT: number;
    secondPlaceT: number;
    thirdPlaceT: number;
    fourthPlaceT: number;
  }>;
  gameResults?: Array<{ finalPosition: number }>;
}

interface HistoryGame {
  gameId?: number;
  tournamentId?: number;
  gameDate: string;
  position?: number;
  gameType?: 'HANCHAN' | 'TONPUUSEN';
  finalScore?: number;
  danPoints?: number;
  ratePoints?: number;
  seasonPoints?: number;
  tournamentName?: string;
}

interface PlayerStats {
  totalGames: number;
  firstPlaces: number;
  avgPosition: number;
  currentDan: number;
  currentRate: number;
  dateRange: { from: string; to: string } | null;
}

export function PlayerProfile(props: PlayerProfileProps) {
  const { legajo } = props;
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [historyData, setHistoryData] = useState<HistoryGame[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'dan' | 'rate' | 'season'>('dan');
  const { data: session, status } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [linkedPlayerId, setLinkedPlayerId] = useState<number | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [fullname, setFullname] = useState("");
  const [birthday, setBirthday] = useState("");

  useEffect(() => {
    async function fetchPlayerData() {
      try {
        setLoading(true);

        // Obtener datos básicos del jugador
        const playerResponse = await fetch(`/api/players/${legajo}`);
        if (!playerResponse.ok) {
          throw new Error('Error cargando datos del jugador');
        }
        const playerResult = await playerResponse.json();

        if (playerResult.success) {
          setPlayerData(playerResult.data);
        }

        // Obtener historial de puntos
        const historyResponse = await fetch(`/api/players/${legajo}/history`);
        if (!historyResponse.ok) {
          throw new Error('Error cargando historial');
        }
        const historyResult = await historyResponse.json();

        if (historyResult.success) {
          setHistoryData(historyResult.data.games);

          // Si no hay historial, usar datos básicos del player
          if (historyResult.data.games.length === 0 && playerResult.success) {
            const playerData = playerResult.data;
            setStats({
              totalGames: playerData.total_games,
              firstPlaces: playerData.first_place_h + playerData.first_place_t,
              avgPosition: playerData.average_position,
              currentDan: playerData.dan_points,
              currentRate: playerData.rate_points,
              dateRange: null
            });
          } else {
            setStats(historyResult.data.stats);
          }
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    fetchPlayerData();
  }, [legajo]);

  useEffect(() => {
    (async () => {
      if (status !== "authenticated") return;
      const res = await fetch(`/api/players/link-status`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLinkedPlayerId(data.linked ? data.playerId : null);
      }
    })();
  }, [status]);

  async function handleRequestLink() {
    setSubmitting(true);
    setMessage(null);
    try {
      const playerRes = await fetch(`/api/players/by-legajo/${legajo}`);
      if (!playerRes.ok) {
        setMessage("Jugador no encontrado");
        return;
      }
      const player = await playerRes.json();
      const res = await fetch(`/api/link-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id }),
      });
      if (res.ok) setMessage("Solicitud enviada. Un admin deberá aprobarla.");
      else {
        const err = await res.json().catch(() => ({}));
        setMessage(err?.error || "No se pudo crear la solicitud");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSelfEdit() {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/abm/players/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, birthday }),
      });
      if (res.ok) setMessage("Datos actualizados");
      else {
        const err = await res.json().catch(() => ({}));
        setMessage(err?.error || "No se pudo actualizar");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Función para obtener el rango Dan en japonés
  const obtenerDan = (puntos: number): string => {
    if (puntos < 50) return "新人";       // Principiante
    if (puntos < 100) return "9級";      // 9 Kyu
    if (puntos < 150) return "8級";      // 8 Kyu  
    if (puntos < 200) return "7級";      // 7 Kyu
    if (puntos < 300) return "6級";      // 6 Kyu
    if (puntos < 400) return "5級";      // 5 Kyu
    if (puntos < 500) return "4級";      // 4 Kyu
    if (puntos < 600) return "3級";      // 3 Kyu
    if (puntos < 700) return "2級";      // 2 Kyu
    if (puntos < 800) return "1級";      // 1 Kyu
    if (puntos < 1000) return "初段";    // 1 Dan
    if (puntos < 1200) return "二段";    // 2 Dan
    if (puntos < 1500) return "三段";    // 3 Dan
    if (puntos < 2000) return "四段";    // 4 Dan
    if (puntos < 2600) return "五段";    // 5 Dan
    if (puntos < 3200) return "六段";    // 6 Dan
    if (puntos < 4000) return "七段";    // 7 Dan
    if (puntos < 5000) return "八段";    // 8 Dan
    if (puntos < 6000) return "九段";    // 9 Dan
    return "十段";                      // 10 Dan
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Cargando perfil del jugador...</div>
      </div>
    );
  }

  if (error || !playerData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">Error: {error || 'Jugador no encontrado'}</div>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Perfil de Jugador
          </h2>
        </div>

        {/* Información básica del jugador */}
        <Card className="p-6 bg-white dark:bg-gray-800">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {playerData.nickname} (L{playerData.playerId})
              </h3>
              {playerData.fullname && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {playerData.fullname}
                </p>
              )}
              <div className="mt-4 flex justify-center gap-4">
                <Badge variant={playerData.isActive ? "default" : "secondary"}>
                  {playerData.isActive ? "Activo" : "Inactivo"}
                </Badge>
                {stats && (
                  <RankBadge rank={obtenerDan(stats.currentDan)} variant="detailed" />
                )}
              </div>
            </div>

            {/* Estadísticas */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.totalGames}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Juegos Totales
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {((stats.firstPlaces / stats.totalGames) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Win Rate
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.floor(stats.currentDan)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Puntos Dan
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(stats.currentRate)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Rate
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Estadísticas detalladas de PlayerRanking */}
        {playerData?.rankings && playerData.rankings.length > 0 && (
          <Card className="p-6 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
              📊 Estadísticas Detalladas
            </h3>

            <div className="space-y-6">
              {/* Rate Máximo y Promedio de Posición */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {playerData.rankings[0].maxRate}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Rate Máximo
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {playerData.rankings[0].averagePosition.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Posición Promedio
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {playerData.rankings[0].seasonPoints}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Puntos Temporada
                  </div>
                </div>
              </div>

              {/* Distribución de posiciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                  <h5 className="font-semibold text-green-800 dark:text-green-200 mb-3 text-center">
                    🀄 Hanchan (4 jugadores)
                  </h5>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { pos: '1°', count: playerData.rankings[0].firstPlaceH, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
                      { pos: '2°', count: playerData.rankings[0].secondPlaceH, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' },
                      { pos: '3°', count: playerData.rankings[0].thirdPlaceH, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
                      { pos: '4°', count: playerData.rankings[0].fourthPlaceH, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' }
                    ].map((item) => (
                      <div key={`h-${item.pos}`} className={`text-center p-2 rounded ${item.bg}`}>
                        <div className={`text-lg font-bold ${item.color}`}>
                          {item.count}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {item.pos}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {(playerData.rankings?.[0]?.totalGames ?? 0) > 0 ?
                            `${((item.count / (playerData.rankings?.[0]?.totalGames ?? 1)) * 100).toFixed(1)}% (${item.count})`
                            : '0% (0)'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 text-center">
                    ⚡ Tonpuusen (4 jugadores)
                  </h5>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { pos: '1°', count: playerData.rankings[0].firstPlaceT, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
                      { pos: '2°', count: playerData.rankings[0].secondPlaceT, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' },
                      { pos: '3°', count: playerData.rankings[0].thirdPlaceT, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
                      { pos: '4°', count: playerData.rankings[0].fourthPlaceT, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' }
                    ].map((item) => (
                      <div key={`t-${item.pos}`} className={`text-center p-2 rounded ${item.bg}`}>
                        <div className={`text-lg font-bold ${item.color}`}>
                          {item.count}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {item.pos}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {(playerData.rankings?.[0]?.totalGames ?? 0) > 0 ?
                            `${((item.count / (playerData.rankings?.[0]?.totalGames ?? 1)) * 100).toFixed(1)}% (${item.count})`
                            : '0% (0)'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Gráfico histórico */}
        {historyData.length > 0 && (
          <Card className="p-6 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              📈 Evolución Histórica
            </h3>

            {/* Gráfico de líneas SVG */}
            <div className="space-y-6">
              {/* Selector de tipo de gráfico */}
              <div className="flex justify-center gap-4">
                <Badge
                  variant={chartType === 'dan' ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setChartType('dan')}
                >
                  Dan Points
                </Badge>
                <Badge
                  variant={chartType === 'rate' ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setChartType('rate')}
                >
                  Rate Points
                </Badge>
                <Badge
                  variant={chartType === 'season' ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setChartType('season')}
                >
                  Puntos Temporada
                </Badge>
              </div>

              {/* Gráfico de líneas SVG */}
              <div className="relative">
                <div className="h-64 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  {(() => {
                    // Últimos 30 juegos para más contexto
                    const recentGames = historyData.slice(-30);
                    if (recentGames.length === 0) return null;

                    // Datos según el tipo de gráfico seleccionado
                    const values = recentGames.map(g => {
                      if (chartType === 'dan') return g.danPoints || 0;
                      if (chartType === 'rate') return g.ratePoints || 0;
                      if (chartType === 'season') return g.seasonPoints || 0;
                      return 0;
                    });

                    // Rango dinámico ±20 del min/max
                    const minVal = Math.min(...values);
                    const maxVal = Math.max(...values);
                    const padding = 20;
                    const yMin = Math.max(0, minVal - padding);
                    const yMax = maxVal + padding;
                    const yRange = yMax - yMin;

                    // Dimensiones del SVG
                    const width = 600;
                    const height = 200;
                    const margin = 40;

                    // Función para convertir coordenadas
                    const getX = (index: number) => margin + (index * (width - 2 * margin)) / (recentGames.length - 1);
                    const getY = (value: number) => height - margin - ((value - yMin) / yRange) * (height - 2 * margin);

                    // Crear path de la línea
                    const pathData = recentGames.map((game, index) => {
                      const x = getX(index);
                      let value = 0;
                      if (chartType === 'dan') value = game.danPoints || 0;
                      else if (chartType === 'rate') value = game.ratePoints || 0;
                      else if (chartType === 'season') value = game.seasonPoints || 0;
                      const y = getY(value);
                      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ');

                    return (
                      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                          const y = margin + ratio * (height - 2 * margin);
                          return (
                            <line
                              key={ratio}
                              x1={margin}
                              y1={y}
                              x2={width - margin}
                              y2={y}
                              stroke="currentColor"
                              strokeOpacity="0.1"
                              strokeWidth="1"
                            />
                          );
                        })}

                        {/* Línea principal */}
                        <path
                          d={pathData}
                          fill="none"
                          stroke={chartType === 'dan' ? '#8b5cf6' : chartType === 'rate' ? '#f97316' : '#10b981'}
                          strokeWidth="2"
                          className="drop-shadow-sm"
                        />

                        {/* Puntos interactivos */}
                        {recentGames.map((game, index) => {
                          const x = getX(index);
                          let value = 0;
                          if (chartType === 'dan') value = game.danPoints || 0;
                          else if (chartType === 'rate') value = game.ratePoints || 0;
                          else if (chartType === 'season') value = game.seasonPoints || 0;
                          const y = getY(value);

                          const key = game.gameId ? `game-${game.gameId}` : `tournament-${game.tournamentId}`;
                          const color = chartType === 'dan' ? '#8b5cf6' : chartType === 'rate' ? '#f97316' : '#10b981';

                          return (
                            <g key={key}>
                              <circle
                                cx={x}
                                cy={y}
                                r="4"
                                fill={color}
                                stroke="white"
                                strokeWidth="2"
                                className="cursor-pointer hover:r-6 transition-all"
                              />
                              {/* Área invisible más grande para hover */}
                              <circle
                                cx={x}
                                cy={y}
                                r="12"
                                fill="transparent"
                                className="cursor-pointer"
                              >
                                <title>
                                  {game.gameId ?
                                    `Juego #${game.gameId} - ${game.gameDate}
${game.position}° lugar ${game.gameType}
Dan: ${Math.floor(game.danPoints || 0)} | Rate: ${Math.round(game.ratePoints || 0)}
Score: ${game.finalScore || 0}` :
                                    `Torneo: ${game.tournamentName} - ${game.gameDate}
Puntos Temporada: ${game.seasonPoints || 0}`
                                  }
                                </title>
                              </circle>
                            </g>
                          );
                        })}

                        {/* Etiquetas del eje Y */}
                        {[yMax, (yMax + yMin) / 2, yMin].map((value, index) => (
                          <text
                            key={index}
                            x={margin - 10}
                            y={margin + index * (height - 2 * margin) / 2}
                            textAnchor="end"
                            dominantBaseline="central"
                            fontSize="12"
                            fill="currentColor"
                            opacity="0.6"
                          >
                            {Math.round(value)}
                          </text>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
              </div>

              {/* Leyenda inferior */}
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Últimos 30 juegos - Hover sobre los puntos para ver detalles | Rango dinámico ±20
              </div>
            </div>
          </Card>
        )}

        {/* Lista de juegos recientes */}
        {historyData.length > 0 && (
          <Card className="p-6 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              🎮 Actividad Reciente
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {historyData.slice(-10).reverse().map((item) => {
                const key = item.gameId ? `game-${item.gameId}` : `tournament-${item.tournamentId}`;

                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.gameId ? (
                        <>
                          <Badge variant={item.position === 1 ? "default" : "outline"}>
                            {item.position}°
                          </Badge>
                          <span className="text-sm font-medium">
                            {item.gameType}
                          </span>
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary">
                            🏆
                          </Badge>
                          <span className="text-sm font-medium">
                            {item.tournamentName}
                          </span>
                        </>
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.gameDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {item.gameId ? (
                        <>
                          <span className="text-purple-600 dark:text-purple-400">
                            Dan: {Math.floor(item.danPoints || 0)}
                          </span>
                          <span className="text-orange-600 dark:text-orange-400">
                            Rate: {Math.round(item.ratePoints || 0)}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            Score: {item.finalScore || 0}
                          </span>
                        </>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">
                          Temporada: {item.seasonPoints || 0}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Botón para solicitar vinculación */}
        {status === "authenticated" && (
          <div className="mt-4 flex items-center gap-3">
            <Button disabled={submitting} onClick={handleRequestLink}>
              {submitting ? "Enviando..." : "Solicitar vinculación"}
            </Button>
            {message && <span className="text-sm text-gray-600">{message}</span>}
          </div>
        )}

        {linkedPlayerId === playerData?.playerId && (
          <div className="border rounded-md p-4">
            <h3 className="font-semibold mb-2">Mis datos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="block text-gray-600 mb-1">Nombre completo</span>
                <input className="border rounded-md h-10 px-3 w-full" value={fullname} onChange={(e) => setFullname(e.target.value)} />
              </label>
              <label className="text-sm">
                <span className="block text-gray-600 mb-1">Fecha de nacimiento</span>
                <input className="border rounded-md h-10 px-3 w-full" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
              </label>
            </div>
            <div className="mt-3">
              <Button disabled={submitting} onClick={handleSelfEdit}>{submitting ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}