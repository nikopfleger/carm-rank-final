"use client";

import { useGameService } from "@/components/providers/services-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useErrorHandler } from "@/hooks/use-error-handler";
import {
  BarChart3,
  Calendar,
  Download,
  PieChart,
  Target,
  TrendingUp,
  Trophy,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";

interface PlayerStats {
  nickname: string;
  legajo: number;
  totalGames: number;
  winRate: number;
  averagePosition: number;
  currentRate: number;
  maxRate: number;
  danPoints: number;
  rank: string;
  hanchangames: number;
  tonpuGames: number;
  recentTrend: "up" | "down" | "stable";
}

interface GameStats {
  month: string;
  hanchanGames: number;
  tonpuGames: number;
  totalPlayers: number;
  averageRate: number;
}

// Nota: Datos mock removidos - ahora usa datos reales del endpoint /api/admin/statistics

export function StatisticsAnalytics() {
  const { handleError, handleSuccess } = useErrorHandler();
  const gameService = useGameService();
  const [selectedPeriod, setSelectedPeriod] = useState("current_season");
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);

  // Cargar estadísticas reales
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/statistics');
        const result = await response.json();

        if (result.success) {
          setStatistics(result.data);
        } else {
          handleError(new Error('Error cargando estadísticas'), 'Cargar estadísticas');
        }
      } catch (error) {
        handleError(error, 'Cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [selectedPeriod, handleError]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando estadísticas...</div>;
  }

  if (!statistics) {
    return <div className="text-center text-red-600">Error cargando estadísticas</div>;
  }

  const { summary, topPlayers, gameStats } = statistics;

  const exportData = async () => {
    try {
      await gameService.exportData('csv');
      handleSuccess('Datos exportados exitosamente', 'Exportación exitosa');
    } catch (error) {
      handleError(error, 'Exportar datos');
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_season">Temporada Actual</SelectItem>
              <SelectItem value="last_season">Temporada Anterior</SelectItem>
              <SelectItem value="all_time">Histórico Completo</SelectItem>
              <SelectItem value="last_3months">Últimos 3 Meses</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Métricas</SelectItem>
              <SelectItem value="rate">Solo Rate</SelectItem>
              <SelectItem value="dan">Solo Dan</SelectItem>
              <SelectItem value="games">Solo Juegos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportData} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar Datos
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Juegos
                </p>
                <p className="text-3xl font-bold text-blue-600">{summary.totalGames}</p>
              </div>
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Promedio: {summary.activePlayersCount > 0 ? (summary.totalGames / summary.activePlayersCount).toFixed(1) : 0} por jugador
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Win Rate Promedio
                </p>
                <p className="text-3xl font-bold text-green-600">{summary.avgWinRate}%</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Posición prom: {summary.avgPosition}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Rate Promedio
                </p>
                <p className="text-3xl font-bold text-purple-600">{summary.avgRate}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Temporada: {summary.currentSeason}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Jugadores Activos
                </p>
                <p className="text-3xl font-bold text-orange-600">{summary.activePlayersCount}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total registrados: {summary.totalPlayers}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Player Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estadísticas Detalladas por Jugador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2">Jugador</th>
                  <th className="text-right py-3 px-2">Juegos</th>
                  <th className="text-right py-3 px-2">Win Rate</th>
                  <th className="text-right py-3 px-2">Pos. Prom.</th>
                  <th className="text-right py-3 px-2">Rate Actual</th>
                  <th className="text-right py-3 px-2">Rate Máx.</th>
                  <th className="text-center py-3 px-2">Rank</th>
                  <th className="text-right py-3 px-2">Puntos Dan</th>
                  <th className="text-center py-3 px-2">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {topPlayers.map((player: any) => (
                  <tr key={player.legajo} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {player.nickname}
                        </div>
                        <div className="text-xs text-gray-500">#{player.legajo}</div>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2 font-mono">
                      <div>{player.totalGames}</div>
                      <div className="text-xs text-gray-500">
                        H:{player.hanchangames} T:{player.tonpuGames}
                      </div>
                    </td>
                    <td className="text-right py-3 px-2 font-mono">
                      <span className={`${player.winRate >= 30 ? 'text-green-600' :
                        player.winRate >= 25 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {player.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-2 font-mono">
                      <span className={`${player.averagePosition <= 2.3 ? 'text-green-600' :
                        player.averagePosition <= 2.7 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {player.averagePosition.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-2 font-mono font-medium">
                      {player.currentRate}
                    </td>
                    <td className="text-right py-3 px-2 font-mono text-gray-600 dark:text-gray-400">
                      {player.maxRate}
                    </td>
                    <td className="text-center py-3 px-2">
                      <Badge variant="outline" className="text-xs">
                        {player.rank}
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-2 font-mono">
                      {player.danPoints}
                    </td>
                    <td className="text-center py-3 px-2">
                      {player.recentTrend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mx-auto" />
                      ) : player.recentTrend === 'down' ? (
                        <TrendingUp className="h-4 w-4 text-red-500 mx-auto rotate-180" />
                      ) : (
                        <div className="h-4 w-4 bg-gray-400 rounded-full mx-auto"></div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Game Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tendencia de Juegos por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gameStats.map((month: any, index: number) => (
                <div key={month.month} className="flex items-center justify-between">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {month.month}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">H: </span>
                      <span className="font-mono">{month.hanchanGames}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">T: </span>
                      <span className="font-mono">{month.tonpuGames}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total: </span>
                      <span className="font-mono font-medium">{month.hanchanGames + month.tonpuGames}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribución de Tipos de Juego
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Hanchan</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {summary.totalGames > 0 ? Math.round((summary.hanchanCount / summary.totalGames) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div className="bg-blue-600 h-2 rounded-full" style={{
                    width: `${summary.totalGames > 0 ? Math.round((summary.hanchanCount / summary.totalGames) * 100) : 0}%`
                  }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Tonpuusen</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {summary.totalGames > 0 ? Math.round((summary.tonpuusenCount / summary.totalGames) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div className="bg-green-600 h-2 rounded-full" style={{
                    width: `${summary.totalGames > 0 ? Math.round((summary.tonpuusenCount / summary.totalGames) * 100) : 0}%`
                  }}></div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Estadísticas por Ubicación</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Biblioteca Sudestada</span>
                    <span className="font-mono">245 juegos</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MahjongSoul</span>
                    <span className="font-mono">89 juegos</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tenhou</span>
                    <span className="font-mono">34 juegos</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
