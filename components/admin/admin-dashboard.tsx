"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoChip } from "@/components/ui/info-chip";
import { PlayerResultCard } from "@/components/ui/player-result-card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  AlertTriangle,
  BarChart3,
  CheckSquare,
  Clock,
  Plus,
  TrendingUp,
  Trophy
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Tipos para los datos del dashboard
interface DashboardData {
  pendingGames: number;
  activeSeason: string;
  totalPlayers: number;
  gamesThisMonth: number;
  percentageChange: number;
  recentActivity: Array<{
    id: number;
    type: string;
    description: string;
    time: string;
  }>;
  topPlayers: Array<{
    nickname: string;
    playerNumber: number;
    position: number;
    points: number;
    trend: string;
  }>;
}

export function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard-stats');
      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError('Error al cargar datos del dashboard');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Skeleton para las 4 cards principales */}
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skeleton para las 2 cards grandes */}
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error || !dashboardData) {
    return (
      <div className="py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">
              {error || 'Error al cargar datos del dashboard'}
            </span>
          </div>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const {
    pendingGames,
    activeSeason,
    totalPlayers,
    gamesThisMonth,
    percentageChange,
    recentActivity,
    topPlayers
  } = dashboardData;

  return (
    <div className="py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Panel de Administración
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona el sistema de ranking CAMR desde aquí
          </p>
        </div>
        <Button
          onClick={fetchDashboardData}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          {loading ? (
            <Skeleton className="h-4 w-4 mr-2" />
          ) : (
            <TrendingUp className="h-4 w-4 mr-2" />
          )}
          Actualizar
        </Button>
      </div>

      {/* System Alerts */}
      {pendingGames > 0 && (
        <div className="space-y-2">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <span className="text-yellow-800 dark:text-yellow-200">
                  {pendingGames} juego{pendingGames > 1 ? 's' : ''} pendiente{pendingGames > 1 ? 's' : ''} de validación
                </span>
              </div>
              <InfoChip
                icon={CheckSquare}
                label="Juegos pendientes"
                value={pendingGames}
                variant="brand"
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Jugadores Activos"
          value={totalPlayers}
          subtitle={`En ${activeSeason} o último año`}
          color="blue"
        />

        <StatCard
          title="Juegos Este Mes"
          value={gamesThisMonth}
          subtitle={`${percentageChange >= 0 ? '+' : ''}${percentageChange}% vs mes anterior`}
          color={percentageChange >= 0 ? "green" : "red"}
        />

        <StatCard
          title="Temporada Activa"
          value={activeSeason}
          color="purple"
        >
          <div className="mt-4">
            <Link href={`/admin/abm/seasons`}>
              <Button size="sm" variant="outline" className="w-full">
                Gestionar
              </Button>
            </Link>
          </div>
        </StatCard>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href={`/admin/games/submit`}>
            <StatCard
              title="Cargar Juego"
              value="Nuevo"
              subtitle="Ingresar resultado"
              color="blue"
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
            >
              <div className="flex justify-center mt-2">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
            </StatCard>
          </Link>

          <Link href={`/admin/games/validate`}>
            <StatCard
              title="Validar Juegos"
              value={pendingGames}
              subtitle={`${pendingGames} pendientes`}
              color="orange"
              badge={pendingGames > 0 ? "Requiere atención" : "Al día"}
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
            >
              <div className="flex justify-center mt-2">
                <CheckSquare className="h-6 w-6 text-orange-600" />
              </div>
            </StatCard>
          </Link>

          <Link href={`/admin/abm/tournaments`}>
            <StatCard
              title="Crear Torneo"
              value="Nuevo"
              subtitle="Organizar competencia"
              color="green"
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
            >
              <div className="flex justify-center mt-2">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
            </StatCard>
          </Link>

          <Link href={`/admin/statistics`}>
            <StatCard
              title="Ver Estadísticas"
              value="Analytics"
              subtitle="Reportes y métricas"
              color="purple"
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
            >
              <div className="flex justify-center mt-2">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </StatCard>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${activity.type === 'game_submitted' ? 'bg-blue-500' :
                      activity.type === 'game_approved' ? 'bg-green-500' :
                        activity.type === 'player_registered' ? 'bg-purple-500' :
                          'bg-orange-500'
                      }`} />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {activity.description}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    hace {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPlayers.map((player, index) => (
                <Link key={player.nickname} href={`/player/${player.playerNumber}`}>
                  <PlayerResultCard
                    position={player.position}
                    player={{
                      id: player.playerNumber, // Usar el legajo como ID
                      nickname: player.nickname,
                      fullname: player.nickname
                    }}
                    stats={{
                      danPoints: player.points,
                      trend: player.trend as 'up' | 'down' | 'stable'
                    }}
                    variant="main"
                    showTrend={true}
                    showRank={false}
                    showCountry={false}
                  // ✅ Removido href para evitar <a> anidados
                  />
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <Link href={`/`}>
                <Button variant="outline" size="sm" className="w-full">
                  Ver Ranking Completo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
