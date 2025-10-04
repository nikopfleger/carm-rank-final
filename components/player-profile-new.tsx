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
  initial?: {
    player: PlayerData;
    stats: PlayerStats;
    rankings: PlayerRankings;
    chartData: ChartDataPoint[];
    seasonData: ChartDataPoint[];
    danConfigsYonma: DanConfig[];
    danConfigsSanma: DanConfig[];
    isLinked?: boolean;
    hasPendingRequest?: boolean;
    userHasAnyLink?: boolean;
    userHasRejectedRequest?: boolean;
  };
}

export function PlayerProfileNew({ legajo, initial }: PlayerProfileProps) {
  const { t, isReady } = useI18nContext();
  const { data: session, status } = useSession();
  const { handleError, handleSuccess } = useErrorHandler();

  const [playerData, setPlayerData] = useState<PlayerData | null>(initial?.player ?? null);
  const [stats, setStats] = useState<PlayerStats | null>(initial?.stats ?? null);
  const [rankings, setRankings] = useState<PlayerRankings | null>(initial?.rankings ?? null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>(initial?.chartData ?? []);
  const [seasonData, setSeasonData] = useState<ChartDataPoint[]>(initial?.seasonData ?? []);
  const [danConfigsYonma, setDanConfigsYonma] = useState<DanConfig[]>(initial?.danConfigsYonma ?? []);
  const [danConfigsSanma, setDanConfigsSanma] = useState<DanConfig[]>(initial?.danConfigsSanma ?? []);
  const [loading, setLoading] = useState(false);
  const [gameTypeFilter, setGameTypeFilter] = useState<'HANCHAN' | 'TONPUUSEN' | 'TOTAL'>('TOTAL');
  const [isSanma, setIsSanma] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'dan' | 'rate' | 'position' | 'season'>('dan');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vinculación
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [linkedPlayerId, setLinkedPlayerId] = useState<number | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(initial?.hasPendingRequest ?? false);
  const [userHasAnyLink, setUserHasAnyLink] = useState(initial?.userHasAnyLink ?? false);
  const [userHasRejectedRequest, setUserHasRejectedRequest] = useState(initial?.userHasRejectedRequest ?? false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const getFilteredGeneralStats = (
    currentPlayerCount: 'four' | 'three',
    currentGameTypeFilter: 'HANCHAN' | 'TONPUUSEN' | 'TOTAL',
  ) => {
    if (!stats) return null;

    const hanchanKey = `${currentPlayerCount}PlayerHanchan` as keyof PlayerStats;
    const tonpuusenKey = `${currentPlayerCount}PlayerTonpuusen` as keyof PlayerStats;

    const hanchanStats = stats[hanchanKey] as any;
    const tonpuusenStats = stats[tonpuusenKey] as any;

    const maxRateForMode = isSanma ? stats.maxRateSanma || 0 : stats.maxRateYonma || stats.maxRate || 0;
    const seasonPointsForMode = isSanma ? stats.seasonPointsSanma || 0 : stats.seasonPointsYonma || stats.seasonPoints || 0;

    if (currentGameTypeFilter === 'HANCHAN') {
      return { maxRate: maxRateForMode, avgPosition: hanchanStats?.avgPosition || 0, seasonPoints: seasonPointsForMode };
    } else if (currentGameTypeFilter === 'TONPUUSEN') {
      return { maxRate: maxRateForMode, avgPosition: tonpuusenStats?.avgPosition || 0, seasonPoints: seasonPointsForMode };
    }
    // TOTAL
    const total = (hanchanStats?.total || 0) + (tonpuusenStats?.total || 0);
    const avg =
      total > 0
        ? ((hanchanStats?.avgPosition || 0) * (hanchanStats?.total || 0) +
          (tonpuusenStats?.avgPosition || 0) * (tonpuusenStats?.total || 0)) /
        total
        : 0;

    return { maxRate: maxRateForMode, avgPosition: avg, seasonPoints: seasonPointsForMode };
  };

  const getFilteredStats = (
    currentPlayerCount: 'four' | 'three',
    currentGameTypeFilter: 'HANCHAN' | 'TONPUUSEN' | 'TOTAL',
  ) => {
    if (!stats) return null;

    const hanchanKey = `${currentPlayerCount}PlayerHanchan` as keyof PlayerStats;
    const tonpuusenKey = `${currentPlayerCount}PlayerTonpuusen` as keyof PlayerStats;

    const hanchanStats = stats[hanchanKey] as any;
    const tonpuusenStats = stats[tonpuusenKey] as any;

    if (currentGameTypeFilter === 'HANCHAN') return hanchanStats;
    if (currentGameTypeFilter === 'TONPUUSEN') return tonpuusenStats;

    // TOTAL
    const total = (hanchanStats?.total || 0) + (tonpuusenStats?.total || 0);
    const avg =
      total > 0
        ? ((hanchanStats?.avgPosition || 0) * (hanchanStats?.total || 0) +
          (tonpuusenStats?.avgPosition || 0) * (tonpuusenStats?.total || 0)) /
        total
        : 0;

    return {
      total,
      avgPosition: avg,
      first: (hanchanStats?.first || 0) + (tonpuusenStats?.first || 0),
      second: (hanchanStats?.second || 0) + (tonpuusenStats?.second || 0),
      third: (hanchanStats?.third || 0) + (tonpuusenStats?.third || 0),
      fourth: (hanchanStats?.fourth || 0) + (tonpuusenStats?.fourth || 0),
      firstPercent: total > 0 ? (((hanchanStats?.first || 0) + (tonpuusenStats?.first || 0)) / total) * 100 : 0,
      secondPercent: total > 0 ? (((hanchanStats?.second || 0) + (tonpuusenStats?.second || 0)) / total) * 100 : 0,
      thirdPercent: total > 0 ? (((hanchanStats?.third || 0) + (tonpuusenStats?.third || 0)) / total) * 100 : 0,
      fourthPercent: total > 0 ? (((hanchanStats?.fourth || 0) + (tonpuusenStats?.fourth || 0)) / total) * 100 : 0,
      rentaiRate:
        total > 0
          ? (((hanchanStats?.first || 0) +
            (tonpuusenStats?.first || 0) +
            (hanchanStats?.second || 0) +
            (tonpuusenStats?.second || 0)) /
            total) *
          100
          : 0,
    };
  };

  // Limpiar estado de vinculación cuando el usuario se desloguea
  useEffect(() => {
    if (status === "unauthenticated") {
      setLinkedPlayerId(null);
      setPlayerData((prev) => (prev ? { ...prev, isLinked: false } : null));
      setHasPendingRequest(false);
      setUserHasAnyLink(false);
      setUserHasRejectedRequest(false);
      setLinkMessage(null);
    }
  }, [status]);

  // Cargar datos del perfil (si no vinieron por SSR)
  useEffect(() => {
    if (!isReady) return;
    if (initial?.player && initial?.stats) return;

    if (status === "unauthenticated") {
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
        setError(null);
        const response = await fetch(`/api/players/${legajo}/profile`, {
          signal: ac.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

        const data = await response.json();

        setPlayerData({
          ...data.player,
          isLinked: status === "authenticated" ? data.isLinked || false : false,
        });
        setStats(data.stats);
        setRankings(data.rankings);
        setChartData(data.chartData);
        setSeasonData(data.seasonData || []);
        setHasPendingRequest(data.hasPendingRequest || false);

        if (status === "unauthenticated") {
          setUserHasAnyLink(false);
          setUserHasRejectedRequest(false);
          setLinkedPlayerId(null);
        } else {
          setUserHasAnyLink(data.userHasAnyLink || false);
          setUserHasRejectedRequest(data.userHasRejectedRequest || false);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err instanceof Error ? err.message : t('common.error'));
          handleError(err, 'Cargar perfil de jugador');
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [legajo, isReady, status, handleError, initial, t]);

  // Cargar DAN configs si no vinieron en SSR
  useEffect(() => {
    if (initial?.danConfigsYonma && initial?.danConfigsSanma) return;
    (async () => {
      try {
        const res = await fetch("/api/config/cache", { cache: "force-cache" });
        if (!res.ok) return;
        const json = await res.json();
        const dan: DanConfig[] = json?.data?.dan ?? [];
        setDanConfigsYonma(dan.filter((d) => !d.sanma));
        setDanConfigsSanma(dan.filter((d) => d.sanma));
      } catch (err) {
        console.error("Error loading DAN configs:", err);
      }
    })();
  }, [initial]);

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

        const pendingRequest = linkRequestsData.requests?.find(
          (req: any) => req.playerId === playerData?.id && req.status === "PENDING",
        );
        setHasPendingRequest(!!pendingRequest);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleError(err, "Verificar vinculación y solicitudes");
        }
      }
    })();

    return () => ac.abort();
  }, [status, playerData?.id, handleError]);

  const handleEditProfile = () => setIsEditModalOpen(true);

  const handleSaveProfile = async (data: { fullname?: string; country?: string; birthday?: string }) => {
    if (!playerData) return;
    try {
      const response = await fetch(`/api/players/${playerData.playerId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar perfil");
      }
      setPlayerData((prev) =>
        prev
          ? {
            ...prev,
            fullname: data.fullname ?? prev.fullname,
            country: data.country ? { fullName: data.country, isoCode: data.country } : prev.country,
            birthday: data.birthday ?? prev.birthday,
          }
          : prev,
      );
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const handleLinkRequest = async () => {
    if (!playerData || !session?.user) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/link-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: playerData.id, note: `Solicitud de vinculación para el jugador ${playerData.nickname}` }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al enviar solicitud");
      }
      await response.json();
      setHasPendingRequest(true);
      setLinkMessage(t("player.profilePage.requestSent"));
      handleSuccess(t("player.profilePage.requestSent"));
    } catch (error) {
      console.error("Error enviando solicitud de vinculación:", error);
      setLinkMessage(error instanceof Error ? error.message : "Error al enviar solicitud");
      handleError(error, "Solicitud de vinculación");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlinkRequest = async () => {
    if (!playerData || !session?.user) return;
    setIsUnlinking(true);
    try {
      const response = await fetch("/api/link-requests/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: playerData.id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al desvincular");
      }
      await response.json();
      setLinkMessage("Vinculación eliminada exitosamente");
      setLinkedPlayerId(null);
      setPlayerData((prev) => (prev ? { ...prev, isLinked: false } : null));
      handleSuccess("Desvinculación exitosa");
    } catch (error) {
      console.error("Error desvinculando:", error);
      setLinkMessage(error instanceof Error ? error.message : "Error al desvincular");
      handleError(error, "Desvincular usuario");
    } finally {
      setIsUnlinking(false);
    }
  };

  // ===============================
  // UI states de carga/error
  // ===============================
  if (!isReady || loading || !playerData) {
    return <PlayerProfileSkeleton />;
  }

  if (error && !playerData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">
          {t("common.error")}: {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      </div>
    );
  }

  // ===============================
  // Render principal
  // ===============================
  return (
    <div className="max-w-6xl mx-auto">
      <StickyPlayerHeader
        nickname={playerData.nickname}
        playerId={playerData.playerId}
        isActive={playerData.isActive}
        country={typeof playerData.country === "string" ? playerData.country : playerData.country?.isoCode}
        isSanma={isSanma}
        onSanmaChange={setIsSanma}
        gameTypeFilter={gameTypeFilter}
        setGameTypeFilter={setGameTypeFilter}
      />

      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {stats &&
          (() => {
            const currentDanForMode = isSanma ? stats.currentDanSanma ?? 0 : stats.currentDanYonma ?? stats.currentDan;
            const currentRateForMode = isSanma ? stats.currentRateSanma ?? stats.currentRate ?? 1500 : stats.currentRateYonma ?? stats.currentRate ?? 1500;
            const cfg = isSanma ? danConfigsSanma : danConfigsYonma;
            const currentRank = getDanRank(currentDanForMode, cfg);
            const nextRank = getNextDanRank(currentDanForMode, cfg);

            const dbRankColor = isSanma ? stats.rankColorSanma : stats.rankColorYonma;
            const currentStats = getFilteredStats(isSanma ? "three" : "four", gameTypeFilter);
            const generalStats = getFilteredGeneralStats(isSanma ? "three" : "four", gameTypeFilter);

            // Delta 30 días (usar datos del cliente/SSR indistinto)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

            const recentData = chartData
              .filter((p) => p.sanma === isSanma && new Date(p.gameDate) >= sixtyDaysAgo)
              .sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime());

            const baseline = recentData.find((p) => new Date(p.gameDate) < thirtyDaysAgo);
            const rateDelta = baseline ? currentRateForMode - baseline.ratePoints : 0;
            const danDelta = baseline ? currentDanForMode - baseline.danPoints : 0;

            const maxRateForMode = isSanma ? stats.maxRateSanma || stats.maxRate || 1500 : stats.maxRateYonma || stats.maxRate || 1500;

            const filteredStats = {
              currentDan: currentDanForMode,
              currentRate: currentRateForMode,
              danDelta,
              rateDelta,
              maxRate: maxRateForMode,
            };

            return (
              <UnifiedPlayerCard
                playerData={{
                  nickname: playerData.nickname,
                  playerId: playerData.playerId,
                  fullname: playerData.fullname,
                  country: typeof playerData.country === "string" ? playerData.country : playerData.country?.isoCode,
                  isActive: playerData.isActive,
                  birthday: playerData.birthday,
                  onlineUsers: playerData.onlineUsers,
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
                // Vinculación
                isLinked={playerData.isLinked}
                isLinkedToCurrentUser={playerData.isLinked && linkedPlayerId === playerData.playerId}
                onLinkRequest={
                  status === "authenticated" && !userHasAnyLink && !userHasRejectedRequest && linkedPlayerId === null
                    ? handleLinkRequest
                    : undefined
                }
                onUnlinkRequest={playerData.isLinked && linkedPlayerId === playerData.playerId ? handleUnlinkRequest : undefined}
                isLinkRequestPending={hasPendingRequest}
              />
            );
          })()}

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

      {playerData && (
        <EditPlayerModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          playerData={{
            nickname: playerData.nickname,
            fullname: playerData.fullname,
            country: typeof playerData.country === "string" ? playerData.country : playerData.country?.isoCode,
            birthday: playerData.birthday,
          }}
          onSave={handleSaveProfile}
          submitting={submitting}
        />
      )}
    </div>
  );
}
