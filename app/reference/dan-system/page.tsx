'use client';

import { useI18nContext } from '@/components/providers/i18n-provider';
import { useNotifications } from '@/components/providers/notification-provider';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSkeleton } from '@/components/ui/loading-skeleton';
import { RankBadge } from '@/components/ui/rank-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { unifiedStyles } from '@/components/ui/unified-styles';
import { Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DanSystemReference() {
  const { t, language } = useI18nContext();
  const [sanma, setSanma] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const fetchRows = async (isSanma: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/config/dan?sanma=${isSanma}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json?.success) throw new Error('No se pudieron cargar las configuraciones');
      const data = Array.isArray(json.data) ? json.data : [];
      console.log('[DanSystem] api/config/dan', { isSanma, count: data.length, sample: data[0] });
      // Normalizar al formato que usa la tabla
      const mapped = (Array.isArray(data) ? data : []).map((c: any) => {
        const h1 = c.firstPlace ?? 0;
        const h2 = c.secondPlace ?? 0;
        const h3 = c.thirdPlace ?? 0;
        const h4 = c.fourthPlace ?? 0;
        const t1 = Math.round((h1 * 2) / 3);
        const t2 = Math.round((h2 * 2) / 3);
        const t3 = Math.round((h3 * 2) / 3);
        const t4 = Math.round((h4 * 2) / 3);
        const minRaw = (c.minPoints ?? 0);
        const maxRaw = (c.maxPoints ?? 0);
        const isLast = !!c.isLastRank;
        const min = Math.max(0, Number(minRaw) || 0);
        const max = Math.max(min, Number(maxRaw) || 0);
        return {
          kanji: c.rank,
          traduccion: t(`ranks.${c.rank}`, c.rank),
          puntosParaSubir: isLast ? '-' : (max - min || '-'),
          caeDeRank: c.isProtected ? 'NO' : 'SI',
          puntosAcumuladosProximo: isLast ? '-' : (max || '-'),
          puntosMinimosSinCaer: (c.isProtected || isLast) ? '-' : (min || '-'),
          sortKey: isLast ? Number.POSITIVE_INFINITY : min,
          variacionHanchan: { primero: h1, segundo: h2, tercero: h3, cuarto: h4 },
          variacionTonpuusen: { primero: t1, segundo: t2, tercero: t3, cuarto: t4 },
        };
      }).sort((a: any, b: any) => (a.sortKey ?? 0) - (b.sortKey ?? 0));
      console.log('[DanSystem] mapped rows', mapped.length);
      if (mapped.length === 0) {
        setError('No hay configuraciones Dan disponibles.');
        addNotification({ type: 'warning', title: 'Sin datos', message: 'No hay configuraciones Dan para mostrar.' });
      }
      setRows(mapped);
    } catch (e: any) {
      setError(e?.message || 'Error de conexión');
      setRows([]);
      addNotification({ type: 'error', title: 'Error cargando sistema Dan', message: e?.message || 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(sanma); }, [sanma]);

  const danSystemData = rows;

  // En japonés no mostrar la columna de traducción
  const showTranslationColumn = language !== 'ja';

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <PageHeader
        icon={Trophy}
        title={t('danSystem.title')}
        subtitle={t('danSystem.description')}
        variant="players"
      />

      {/* Toggle 3p / 4p */}
      <div className="flex items-center justify-end mb-4">
        <div className={unifiedStyles.card}>
          <button
            className={`h-8 px-3 rounded-lg text-sm font-medium ${!sanma ? unifiedStyles.primaryButton : unifiedStyles.secondaryButton}`}
            onClick={() => setSanma(false)}
          >
            4p
          </button>
          <button
            className={`h-8 px-3 rounded-lg text-sm font-medium ml-1 ${sanma ? unifiedStyles.primaryButton : unifiedStyles.secondaryButton}`}
            onClick={() => setSanma(true)}
          >
            3p
          </button>
        </div>
      </div>

      {loading && <PageSkeleton />}

      {error && (
        <div className={`${unifiedStyles.card} p-4 mb-4 text-red-600 dark:text-red-400`}>{error}</div>
      )}

      {/* Explicación del sistema */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className={unifiedStyles.card}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 ¿Cómo funciona?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p><strong>{t('danSystem.columns.pointsNeeded')}</strong></p>
            <p><strong>{t('danSystem.columns.canDropRank')}</strong></p>
            <p><strong>{t('danSystem.columns.accumulatedPoints')}</strong></p>
            <p><strong>{t('danSystem.columns.ties')}</strong></p>
          </CardContent>
        </Card>

        <Card className={unifiedStyles.card}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎮 Tipos de juego
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p><strong>{t('danSystem.gameTypes.hanchan')}</strong></p>
            <p><strong>{t('danSystem.gameTypes.tonpuusen')}</strong></p>
            <p><strong>Posiciones:</strong> 1º/2º/3º/4º según puntuación final.</p>
            <p><strong>{t('danSystem.initialRate')}</strong></p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla principal */}
      <Card className={`mt-4 ${unifiedStyles.card}`}>
        <CardHeader>
          <CardTitle>{t('danSystem.tableTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Kanji</TableHead>
                  {showTranslationColumn && <TableHead>Traducción</TableHead>}
                  <TableHead className="text-center">Puntos<br />necesarios para<br />subir al<br />próximo rank</TableHead>
                  <TableHead className="text-center">Cae de rank al<br />bajar de 0<br />puntos</TableHead>
                  <TableHead className="text-center">Puntos<br />acumulados<br />necesarios para<br />próximo rank</TableHead>
                  <TableHead className="text-center">Puntos<br />mínimos<br />acumulados<br />para no caer de<br />rank</TableHead>
                  <TableHead className="text-center" colSpan={4}>Variación de puntos por posición<br />en Hanchan</TableHead>
                  <TableHead className="text-center" colSpan={4}>Variación de puntos por posición<br />en Tonpuusen</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead></TableHead>
                  {showTranslationColumn && <TableHead></TableHead>}
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-center">1ro</TableHead>
                  <TableHead className="text-center">2do</TableHead>
                  <TableHead className="text-center">3ro</TableHead>
                  <TableHead className="text-center">4to</TableHead>
                  <TableHead className="text-center">1ro</TableHead>
                  <TableHead className="text-center">2do</TableHead>
                  <TableHead className="text-center">3ro</TableHead>
                  <TableHead className="text-center">4to</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {danSystemData.map((rank, index) => (
                  <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 odd:bg-white/50 dark:odd:bg-white/5">
                    <TableCell className="text-center">
                      <RankBadge rank={rank.kanji} variant="default" />
                    </TableCell>
                    {showTranslationColumn && (
                      <TableCell className="font-medium">{rank.traduccion}</TableCell>
                    )}
                    <TableCell className="text-center font-mono tabular-nums">{rank.puntosParaSubir}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${rank.caeDeRank === 'SI' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
                        {rank.caeDeRank}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums">{rank.puntosAcumuladosProximo}</TableCell>
                    <TableCell className="text-center font-mono tabular-nums">{rank.puntosMinimosSinCaer}</TableCell>

                    {/* Hanchan */}
                    <TableCell className="text-center font-mono tabular-nums">
                      <span className="text-green-600">+{rank.variacionHanchan.primero}</span>
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums">
                      <span className="text-green-600">+{rank.variacionHanchan.segundo}</span>
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums">
                      <span className={rank.variacionHanchan.tercero >= 0 ? "text-green-600" : "text-red-600"}>
                        {rank.variacionHanchan.tercero >= 0 ? `+${rank.variacionHanchan.tercero}` : rank.variacionHanchan.tercero}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums">
                      <span className={rank.variacionHanchan.cuarto >= 0 ? "text-green-600" : "text-red-600"}>
                        {rank.variacionHanchan.cuarto >= 0 ? `+${rank.variacionHanchan.cuarto}` : rank.variacionHanchan.cuarto}
                      </span>
                    </TableCell>

                    {/* Tonpuusen */}
                    <TableCell className="text-center font-mono tabular-nums">
                      <span className="text-green-600">+{rank.variacionTonpuusen.primero}</span>
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums">
                      <span className="text-green-600">+{rank.variacionTonpuusen.segundo}</span>
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums">
                      <span className={rank.variacionTonpuusen.tercero >= 0 ? "text-green-600" : "text-red-600"}>
                        {rank.variacionTonpuusen.tercero >= 0 ? `+${rank.variacionTonpuusen.tercero}` : rank.variacionTonpuusen.tercero}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums">
                      <span className={rank.variacionTonpuusen.cuarto >= 0 ? "text-green-600" : "text-red-600"}>
                        {rank.variacionTonpuusen.cuarto >= 0 ? `+${rank.variacionTonpuusen.cuarto}` : rank.variacionTonpuusen.cuarto}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Ejemplos prácticos */}
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <Card className={unifiedStyles.card}>
          <CardHeader>
            <CardTitle>🎯 Ejemplo: Jugador 7mo Dan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Situación:</strong> Tienes 5200 puntos Dan (7mo dan)</p>
              <p><strong>En Hanchan:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• 1er lugar: +60 → 5260 puntos</li>
                <li>• 2do lugar: +30 → 5230 puntos</li>
                <li>• 3er lugar: -30 → 5170 puntos</li>
                <li>• 4to lugar: -60 → 5140 puntos</li>
              </ul>
              <p className="mt-2"><strong>Para subir a 8vo dan:</strong> Necesitas llegar a 6000 puntos</p>
              <p><strong>Para no bajar a 6to dan:</strong> No puedes bajar de 5000 puntos</p>
            </div>
          </CardContent>
        </Card>

        <Card className={unifiedStyles.card}>
          <CardHeader>
            <CardTitle>🤝 Ejemplo: Empates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Situación:</strong> Empate en 2do lugar (posiciones: 1-2-2-4)</p>
              <p><strong>Cálculo normal:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• 2do lugar: +30 puntos</li>
                <li>• 3er lugar: -30 puntos</li>
              </ul>
              <p><strong>Con empate:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Ambos empatados: (30 + (-30)) ÷ 2 = 0 puntos</li>
              </ul>
              <p className="mt-2 text-blue-600"><strong>Resultado:</strong> {t('danSystem.examples.ties')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
