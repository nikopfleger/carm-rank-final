"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import { Card } from "@/components/ui/card";
import { EditPlayerModal } from "@/components/ui/edit-player-modal";
import { HistoricalChart } from "@/components/ui/historical-chart";
import { PlayerProfileSkeleton } from "@/components/ui/loading-skeleton";
import { StickyPlayerHeader } from "@/components/ui/sticky-player-header";
import { UnifiedPlayerCard } from "@/components/ui/unified-player-card";
import { unifiedStyles } from "@/components/ui/unified-styles";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { DanConfig, getDanRank, getNextDanRank } from "@/lib/game-helpers-client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

// ===============================
// Helpers de formato
// ===============================
const formatArgentineNumber = (num: number, decimals: number = 0): string => {
  return num.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const formatPercentage = (num: number, decimals: number = 1): string => {
  return num.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }) + '%';
};

const formatPosition = (num: number, decimals: number = 2): string => {
  return num.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

interface PlayerData {
  id: number;
  playerId: number;
  nickname: string;
  fullname?: string;
  birthday?: string;
  isActive: boolean;
  country?: {
    fullName: string;
    isoCode: string;
  };
  onlineUsers: Array<{
    platform: string;
    username: string;
    idOnline?: string;
  }>;
  isLinked?: boolean;
}

interface PlayerStats {
  totalGames: number;
  firstPlaces: number;
  avgPosition: number;
  currentDan: number;
  currentDanYonma?: number;
  currentDanSanma?: number;
  currentRate: number;
  currentRateYonma?: number;
  currentRateSanma?: number;
  maxRate: number;
  maxRateYonma?: number;
  maxRateSanma?: number;
  seasonPoints: number;
  seasonPointsYonma?: number;
  seasonPointsSanma?: number;
  rankColorYonma?: string;
  rankColorSanma?: string;
  fourPlayerHanchan: {
    total: number;
    avgPosition: number;
    first: number;
    second: number;
    third: number;
    fourth: number;
    firstPercent: number;
    secondPercent: number;
    thirdPercent: number;
    fourthPercent: number;
    rentaiRate: number;
  };
  fourPlayerTonpuusen: {
    total: number;
    avgPosition: number;
    first: number;
    second: number;
    third: number;
    fourth: number;
    firstPercent: number;
    secondPercent: number;
    thirdPercent: number;
    fourthPercent: number;
    rentaiRate: number;
  };
  threePlayerHanchan: {
    total: number;
    avgPosition: number;
    first: number;
    second: number;
    third: number;
    fourth: number;
    firstPercent: number;
    secondPercent: number;
    thirdPercent: number;
    fourthPercent: number;
    rentaiRate: number;
  };
  threePlayerTonpuusen: {
    total: number;
    avgPosition: number;
    first: number;
    second: number;
    third: number;
    fourth: number;
    firstPercent: number;
    secondPercent: number;
    thirdPercent: number;
    fourthPercent: number;
    rentaiRate: number;
  };
}

interface PlayerRankings {
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
}

interface GamePlayer {
  name: string;
  position: number;
  finalScore: number;
}

interface ChartDataPoint {
  gameId: number;
  gameDate: string;
  createdAt?: string; // Timestamp cuando se creó el registro en Points
  position: number;
  gameType: string;
  sanma: boolean; // Campo para filtrar por cantidad de jugadores
  finalScore: number;
  danPoints: number;
  ratePoints: number;
  seasonPoints: number;
  danVariation: number;
  rateVariation: number;
  seasonVariation: number;
  players: GamePlayer[];
}

interface PlayerProfileProps {
  legajo: number;
}

export function PlayerProfileNew({ legajo }: PlayerProfileProps) {
  const { t, language, isReady } = useI18nContext();
  const { data: session, status } = useSession();
  const { handleError, handleSuccess } = useErrorHandler();







  // Función para obtener estadísticas generales filtradas
  const getFilteredGeneralStats = (currentPlayerCount: 'four' | 'three', currentGameTypeFilter: 'HANCHAN' | 'TONPUUSEN' | 'TOTAL') => {
    if (!stats) return null;

    // Obtener las estadísticas del modo seleccionado
    const hanchanKey = `${currentPlayerCount}PlayerHanchan` as keyof PlayerStats;
    const tonpuusenKey = `${currentPlayerCount}PlayerTonpuusen` as keyof PlayerStats;

    const hanchanStats = stats[hanchanKey] as any;
    const tonpuusenStats = stats[tonpuusenKey] as any;

    // Usar valores específicos según el modo (3p/4p)
    const maxRateForMode = isSanma ? (stats.maxRateSanma || 0) : (stats.maxRateYonma || stats.maxRate || 0);
    const seasonPointsForMode = isSanma ? (stats.seasonPointsSanma || 0) : (stats.seasonPointsYonma || stats.seasonPoints || 0);

    if (currentGameTypeFilter === 'HANCHAN') {
      return {
        maxRate: maxRateForMode,
        avgPosition: hanchanStats.avgPosition || 0,
        seasonPoints: seasonPointsForMode
      };
    } else if (currentGameTypeFilter === 'TONPUUSEN') {
      return {
        maxRate: maxRateForMode,
        avgPosition: tonpuusenStats.avgPosition || 0,
        seasonPoints: seasonPointsForMode
      };
    } else { // TOTAL
      return {
        maxRate: maxRateForMode,
        avgPosition: hanchanStats.total + tonpuusenStats.total > 0
          ? (hanchanStats.avgPosition * hanchanStats.total + tonpuusenStats.avgPosition * tonpuusenStats.total) / (hanchanStats.total + tonpuusenStats.total)
          : 0,
        seasonPoints: seasonPointsForMode
      };
    }
  };

  // Función para obtener estadísticas filtradas por tipo de juego
  const getFilteredStats = (currentPlayerCount: 'four' | 'three', currentGameTypeFilter: 'HANCHAN' | 'TONPUUSEN' | 'TOTAL') => {
    if (!stats) return null;

    const hanchanKey = `${currentPlayerCount}PlayerHanchan` as keyof PlayerStats;
    const tonpuusenKey = `${currentPlayerCount}PlayerTonpuusen` as keyof PlayerStats;

    const hanchanStats = stats[hanchanKey] as any;
    const tonpuusenStats = stats[tonpuusenKey] as any;

    if (currentGameTypeFilter === 'HANCHAN') {
      return hanchanStats;
    } else if (currentGameTypeFilter === 'TONPUUSEN') {
      return tonpuusenStats;
    } else { // TOTAL
      return {
        total: hanchanStats.total + tonpuusenStats.total,
        avgPosition: hanchanStats.total + tonpuusenStats.total > 0
          ? (hanchanStats.avgPosition * hanchanStats.total + tonpuusenStats.avgPosition * tonpuusenStats.total) / (hanchanStats.total + tonpuusenStats.total)
          : 0,
        first: hanchanStats.first + tonpuusenStats.first,
        second: hanchanStats.second + tonpuusenStats.second,
        third: hanchanStats.third + tonpuusenStats.third,
        fourth: hanchanStats.fourth + tonpuusenStats.fourth,
        firstPercent: hanchanStats.total + tonpuusenStats.total > 0
          ? ((hanchanStats.first + tonpuusenStats.first) / (hanchanStats.total + tonpuusenStats.total)) * 100
          : 0,
        secondPercent: hanchanStats.total + tonpuusenStats.total > 0
          ? ((hanchanStats.second + tonpuusenStats.second) / (hanchanStats.total + tonpuusenStats.total)) * 100
          : 0,
        thirdPercent: hanchanStats.total + tonpuusenStats.total > 0
          ? ((hanchanStats.third + tonpuusenStats.third) / (hanchanStats.total + tonpuusenStats.total)) * 100
          : 0,
        fourthPercent: hanchanStats.total + tonpuusenStats.total > 0
          ? ((hanchanStats.fourth + tonpuusenStats.fourth) / (hanchanStats.total + tonpuusenStats.total)) * 100
          : 0,
        rentaiRate: hanchanStats.total + tonpuusenStats.total > 0
          ? ((hanchanStats.first + tonpuusenStats.first + hanchanStats.second + tonpuusenStats.second) / (hanchanStats.total + tonpuusenStats.total)) * 100
          : 0
      };
    }
  };


  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [rankings, setRankings] = useState<PlayerRankings | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [seasonData, setSeasonData] = useState<ChartDataPoint[]>([]);
  const [danConfigsYonma, setDanConfigsYonma] = useState<DanConfig[]>([]);
  const [danConfigsSanma, setDanConfigsSanma] = useState<DanConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [gameTypeFilter, setGameTypeFilter] = useState<'HANCHAN' | 'TONPUUSEN' | 'TOTAL'>('TOTAL');
  const [isSanma, setIsSanma] = useState<boolean>(false); // false = 4 jugadores, true = 3 jugadores
  const [chartType, setChartType] = useState<'dan' | 'rate' | 'position' | 'season'>('dan');
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);


  // Estados para vinculación
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [linkedPlayerId, setLinkedPlayerId] = useState<number | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [userHasAnyLink, setUserHasAnyLink] = useState(false); // ✅ Nuevo estado para verificar si el usuario ya está vinculado a algún jugador
  const [userHasRejectedRequest, setUserHasRejectedRequest] = useState(false); // ✅ Nuevo estado para verificar si el usuario tiene solicitudes rechazadas
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Función para abrir modal de edición
  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  // Función para guardar cambios del perfil
  const handleSaveProfile = async (data: {
    fullname?: string;
    country?: string;
    birthday?: string;
  }) => {
    if (!playerData) return;

    try {
      const response = await fetch(`/api/players/${playerData.playerId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar perfil');
      }

      // Actualizar los datos del jugador localmente
      setPlayerData(prev => ({
        ...prev!,
        fullname: data.fullname || prev!.fullname,
        country: data.country ? { fullName: data.country, isoCode: data.country } : prev!.country,
        birthday: data.birthday || prev!.birthday,
      }));

      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Función para enviar solicitud de vinculación
  const handleLinkRequest = async () => {
    console.log('handleLinkRequest ejecutándose');
    console.log('playerData:', playerData);
    console.log('session?.user:', session?.user);

    if (!playerData || !session?.user) {
      console.log('No se puede enviar solicitud: falta playerData o session');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/link-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: playerData.id,
          note: `Solicitud de vinculación para el jugador ${playerData.nickname}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar solicitud');
      }

      const result = await response.json();
      setHasPendingRequest(true);
      setLinkMessage(t('player.profilePage.requestSent'));
      handleSuccess(t('player.profilePage.requestSent'));
    } catch (error) {
      console.error('Error enviando solicitud de vinculación:', error);
      setLinkMessage(error instanceof Error ? error.message : 'Error al enviar solicitud');
      handleError(error, 'Solicitud de vinculación');
    } finally {
      setSubmitting(false);
    }
  };

  // Función para desvincular usuario
  const handleUnlinkRequest = async () => {
    if (!playerData || !session?.user) {
      console.log('No se puede desvincular: falta playerData o session');
      return;
    }

    setIsUnlinking(true);
    try {
      const response = await fetch('/api/link-requests/unlink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: playerData.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al desvincular');
      }

      const result = await response.json();
      setLinkMessage('Vinculación eliminada exitosamente');
      setLinkedPlayerId(null);
      setPlayerData(prev => prev ? { ...prev, isLinked: false } : null);
      handleSuccess('Desvinculación exitosa');
    } catch (error) {
      console.error('Error desvinculando:', error);
      setLinkMessage(error instanceof Error ? error.message : 'Error al desvincular');
      handleError(error, 'Desvincular usuario');
    } finally {
      setIsUnlinking(false);
    }
  };

  // Limpiar estado de vinculación cuando el usuario se desloguea
  useEffect(() => {
    if (status === "unauthenticated") {
      setLinkedPlayerId(null);
      setPlayerData(prev => prev ? { ...prev, isLinked: false } : null);
      setHasPendingRequest(false);
      setUserHasAnyLink(false);
      setUserHasRejectedRequest(false);
      setLinkMessage(null);
    }
  }, [status]);

  // Cargar datos del perfil
  useEffect(() => {
    if (!isReady) return; // Esperar a que i18n esté listo

    // Cargando perfil...

    // ✅ Si no está autenticado, limpiar estado de vinculación pero seguir cargando datos del jugador
    if (status === "unauthenticated") {
      // Limpiando estado de vinculación para usuario no autenticado
      setLinkedPlayerId(null);
      setHasPendingRequest(false);
      setUserHasAnyLink(false);
      setUserHasRejectedRequest(false);
      setLinkMessage(null);
    }

    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null); // Limpiar error al empezar
        const response = await fetch(`/api/players/${legajo}/profile?t=${Date.now()}`, {
          signal: ac.signal,
          cache: 'no-store' // ✅ Evitar caché del navegador
        });
        if (!response.ok) {
          console.error('Error response:', response.status, response.statusText);
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Error parsing JSON:', jsonError);
          throw new Error('Error parsing server response');
        }

        // Datos cargados correctamente

        // Actualizar estados directamente
        setPlayerData({
          ...data.player,
          isLinked: status === "authenticated" ? (data.isLinked || false) : false // ✅ Forzar false si no está autenticado
        });
        setStats(data.stats);
        setRankings(data.rankings);
        setChartData(data.chartData);
        setSeasonData(data.seasonData || []);
        setHasPendingRequest(data.hasPendingRequest || false);

        // ✅ Si no hay sesión, forzar estados de vinculación a false
        if (status === "unauthenticated") {
          setUserHasAnyLink(false);
          setUserHasRejectedRequest(false);
          setLinkedPlayerId(null);
        } else {
          setUserHasAnyLink(data.userHasAnyLink || false); // ✅ Cargar si el usuario tiene alguna vinculación
          setUserHasRejectedRequest(data.userHasRejectedRequest || false); // ✅ Cargar si el usuario tiene solicitudes rechazadas
        }

        setError(null);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          const errorMessage = err instanceof Error ? err.message : t('common.error');
          setError(errorMessage);
          handleError(err, 'Cargar perfil de jugador');
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      ac.abort();
    };
  }, [legajo, isReady, t, status, handleError]);

  // Cargar configuraciones DAN para ambos modos una sola vez (evita flicker al cambiar)
  useEffect(() => {
    (async () => {
      try {
        const [resYonma, resSanma] = await Promise.all([
          fetch(`/api/config/dan-configs?sanma=false`),
          fetch(`/api/config/dan-configs?sanma=true`)
        ]);
        if (resYonma.ok) {
          setDanConfigsYonma(await resYonma.json());
        }
        if (resSanma.ok) {
          setDanConfigsSanma(await resSanma.json());
        }
      } catch (err) {
        console.error('Error loading DAN configs:', err);
      }
    })();
  }, []);

  // Verificar vinculación del usuario y solicitudes pendientes
  useEffect(() => {
    if (status !== "authenticated") return;

    const ac = new AbortController();

    (async () => {
      try {
        const [linkStatusRes, linkRequestsRes] = await Promise.all([
          fetch("/api/players/link-status", { signal: ac.signal }),
          fetch("/api/players/my-link-requests", { signal: ac.signal }),
        ]);

        const linkStatusData = linkStatusRes.ok ? await linkStatusRes.json() : { linked: false };
        const linkRequestsData = linkRequestsRes.ok ? await linkRequestsRes.json() : { requests: [] };

        setLinkedPlayerId(linkStatusData.linked ? linkStatusData.playerId : null);

        const pendingRequest = linkRequestsData.requests?.find((req: any) =>
          req.playerId === playerData?.id && req.status === 'PENDING'
        );
        setHasPendingRequest(!!pendingRequest);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleError(err, 'Verificar vinculación y solicitudes');
        }
      }
    })();

    return () => {
      ac.abort();
    };
  }, [status, playerData?.id, handleError]);




  // Filtrar datos del gráfico





  // Renderizar gráfico SVG

  // ===============================
  // UI states de carga/error
  // ===============================
  if (!isReady || loading || !playerData) {
    return <PlayerProfileSkeleton />;
  }

  if (error && !playerData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">{t("common.error")}: {error}</div>
      </div>
    );
  }


  // ===============================
  // Render principal
  // ===============================

  return (
    <div className="max-w-6xl mx-auto">
      {/* Sticky Header */}
      <StickyPlayerHeader
        nickname={playerData.nickname}
        playerId={playerData.playerId}
        isActive={playerData.isActive}
        country={typeof playerData.country === 'string' ? playerData.country : playerData.country?.isoCode}
        isSanma={isSanma}
        onSanmaChange={setIsSanma}
        gameTypeFilter={gameTypeFilter}
        setGameTypeFilter={setGameTypeFilter}
      />

      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        {stats && (() => {
          const currentDanForMode = isSanma ? stats.currentDanSanma ?? 0 : stats.currentDanYonma ?? stats.currentDan;
          // Usar rate específico por modo
          const currentRateForMode = isSanma
            ? (stats.currentRateSanma ?? stats.currentRate ?? 1500)
            : (stats.currentRateYonma ?? stats.currentRate ?? 1500);
          const cfg = isSanma ? danConfigsSanma : danConfigsYonma;
          const currentRank = getDanRank(currentDanForMode, cfg);
          const nextRank = getNextDanRank(currentDanForMode, cfg);

          // Usar el color correcto desde la base de datos
          const dbRankColor = isSanma ? stats.rankColorSanma : stats.rankColorYonma;
          const currentStats = getFilteredStats(isSanma ? "three" : "four", gameTypeFilter);
          const generalStats = getFilteredGeneralStats(isSanma ? "three" : "four", gameTypeFilter);

          // Calcular delta: traer últimos 30 días + 1 mes anterior para comparar
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const sixtyDaysAgo = new Date();
          sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

          // Filtrar últimos 60 días y ordenar cronológicamente
          const recentData = chartData
            .filter(point => point.sanma === isSanma && new Date(point.gameDate) >= sixtyDaysAgo)
            .sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime());

          // Encontrar el punto de comparación: el más antiguo dentro de la ventana de 30-60 días atrás
          const baseline = recentData.find(point => new Date(point.gameDate) < thirtyDaysAgo);

          const rateDelta = baseline
            ? currentRateForMode - baseline.ratePoints
            : 0;

          // Calcular delta del Dan usando el punto más antiguo dentro de la ventana
          const danDelta = baseline
            ? currentDanForMode - baseline.danPoints
            : 0;

          // Usar max rate del backend filtrado por sanma
          const maxRateForMode = isSanma ? (stats.maxRateSanma || stats.maxRate || 1500) : (stats.maxRateYonma || stats.maxRate || 1500);

          // Crear stats filtrados por sanma
          const filteredStats = {
            currentDan: currentDanForMode,
            currentRate: currentRateForMode,
            danDelta: danDelta,
            rateDelta: rateDelta,
            maxRate: maxRateForMode
          };

          return (
            <UnifiedPlayerCard
              playerData={{
                nickname: playerData.nickname,
                playerId: playerData.playerId,
                fullname: playerData.fullname,
                country: typeof playerData.country === 'string' ? playerData.country : playerData.country?.isoCode,
                isActive: playerData.isActive,
                birthday: playerData.birthday,
                onlineUsers: playerData.onlineUsers
              }}
              onEditProfile={playerData.isLinked ? handleEditProfile : undefined}
              submitting={submitting || isUnlinking}
              currentDan={currentDanForMode}
              currentRank={currentRank}
              nextRank={nextRank}
              dbRankColor={dbRankColor}
              stats={filteredStats}
              generalStats={generalStats}
              currentStats={currentStats}
              seasonStats={rankings}
              isSanma={isSanma}
              filteredChartData={chartData}
              // Props de vinculación
              isLinked={playerData.isLinked}
              isLinkedToCurrentUser={playerData.isLinked && linkedPlayerId === playerData.playerId}
              onLinkRequest={status === "authenticated" && !userHasAnyLink && !userHasRejectedRequest && linkedPlayerId === null ? handleLinkRequest : undefined}
              onUnlinkRequest={playerData.isLinked && linkedPlayerId === playerData.playerId ? handleUnlinkRequest : undefined}
              isLinkRequestPending={hasPendingRequest}
            />
          );
        })()}

        {/* Gráfico histórico */}
        {chartData.length > 0 && (
          <Card className={`p-6 ${unifiedStyles.card}`}>
            <HistoricalChart
              chartData={chartData}
              seasonData={seasonData}
              isSanma={isSanma}
              chartType={chartType}
              onChartTypeChange={setChartType}
              danConfigs={isSanma ? danConfigsSanma : danConfigsYonma}
            />
          </Card>
        )}
      </div>

      {/* Modal de edición de perfil */}
      {playerData && (
        <EditPlayerModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          playerData={{
            nickname: playerData.nickname,
            fullname: playerData.fullname,
            country: typeof playerData.country === 'string' ? playerData.country : playerData.country?.isoCode,
            birthday: playerData.birthday
          }}
          onSave={handleSaveProfile}
          submitting={submitting}
        />
      )}
    </div>
  );
}