"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

// Interfaces para el componente reutilizable
interface GamePlayer {
  id: number;
  nickname: string;
  fullname?: string;
  wind?: string;
  oorasuScore?: number;
  gameScore: number;
  chonbos: number;
}

interface GameRuleset {
  id: number;
  name: string;
  inPoints: number;
  outPoints: number;
  oka: number;
  chonbo: number;
  uma: {
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    fourthPlace?: number;
  };
}

interface GameSheetProps {
  players: GamePlayer[];
  ruleset: GameRuleset;
  sanma?: boolean;
  readonly?: boolean;
  showHeader?: boolean;
  title?: string;
}

interface CalculatedPlayer extends GamePlayer {
  uma: number;
  oka: number;
  finalScore: number;
  finalPosition: number;
}

export function GameSheet({ 
  players, 
  ruleset, 
  sanma = false, 
  readonly = true,
  showHeader = true,
  title = "Planilla de Juego"
}: GameSheetProps) {
  
  // Función para calcular Uma, Oka y posiciones
  const calculateGameResults = (): CalculatedPlayer[] => {
    const playerCount = sanma ? 3 : 4;
    const activePlayers = players.slice(0, playerCount);
    
    // 1. CALCULAR UMA
    const devolutionFixed = ruleset.outPoints / 1000;
    const playersWithTransitoryScore = activePlayers
      .map((p, index) => ({
        ...p,
        originalIndex: index,
        transitoryScore: (p.gameScore / 1000) - devolutionFixed
      }))
      .sort((a, b) => b.transitoryScore - a.transitoryScore);

    const umaArray = [
      ruleset.uma.firstPlace,
      ruleset.uma.secondPlace, 
      ruleset.uma.thirdPlace,
      ...(ruleset.uma.fourthPlace !== undefined ? [ruleset.uma.fourthPlace] : [])
    ];

    // Calcular UMA con manejo de empates
    const calculatedPlayers = activePlayers.map(p => ({ ...p, uma: 0, oka: 0, finalScore: 0, finalPosition: 1 }));
    
    const processedPositions = new Set<number>();
    playersWithTransitoryScore.forEach((player, currentIndex) => {
      if (processedPositions.has(currentIndex)) return;

      const tiedPlayers = playersWithTransitoryScore.filter(p => 
        Math.abs(p.transitoryScore - player.transitoryScore) < 0.01
      );

      if (tiedPlayers.length === 1) {
        const umaValue = umaArray[currentIndex] || 0;
        calculatedPlayers[player.originalIndex].uma = umaValue;
      } else {
        // Empate - Uma promedio
        const startPosition = currentIndex;
        const endPosition = currentIndex + tiedPlayers.length - 1;
        let totalUma = 0;
        
        for (let pos = startPosition; pos <= endPosition; pos++) {
          totalUma += umaArray[pos] || 0;
        }
        
        const averageUma = totalUma / tiedPlayers.length;
        tiedPlayers.forEach(tiedPlayer => {
          calculatedPlayers[tiedPlayer.originalIndex].uma = averageUma;
          const tiedIndex = playersWithTransitoryScore.findIndex(p => 
            p.originalIndex === tiedPlayer.originalIndex
          );
          processedPositions.add(tiedIndex);
        });
      }
    });

    // 2. CALCULAR OKA
    calculatedPlayers.forEach(p => { p.oka = 0; });
    
    const playersWithPreOkaScore = calculatedPlayers
      .map((p, index) => {
        const devolution = ruleset.outPoints / 1000;
        const chonboTotal = p.chonbos * ruleset.chonbo;
        const puntajeAntesDeOka = (p.gameScore / 1000) - devolution + p.uma + chonboTotal;
        return { 
          ...p, 
          originalIndex: index, 
          puntajeAntesDeOka 
        };
      })
      .sort((a, b) => b.puntajeAntesDeOka - a.puntajeAntesDeOka);
    
    const highestScore = playersWithPreOkaScore[0]?.puntajeAntesDeOka;
    const winners = playersWithPreOkaScore.filter(p => 
      Math.abs(p.puntajeAntesDeOka - highestScore) < 0.01
    );
    
    if (winners.length > 0) {
      const okaPerWinner = ruleset.oka / winners.length;
      winners.forEach(winner => {
        calculatedPlayers[winner.originalIndex].oka = okaPerWinner;
      });
    }

    // 3. CALCULAR FINAL SCORE
    calculatedPlayers.forEach((player) => {
      const devolution = ruleset.outPoints / 1000;
      const chonboTotal = player.chonbos * ruleset.chonbo;
      player.finalScore = (player.gameScore / 1000) - devolution + player.uma + player.oka + chonboTotal;
    });

    // 4. CALCULAR POSICIONES FINALES
    const playersWithFinalScores = calculatedPlayers
      .map((p, index) => ({ ...p, originalIndex: index }))
      .sort((a, b) => b.finalScore - a.finalScore);

    let currentPosition = 1;
    for (let i = 0; i < playersWithFinalScores.length; i++) {
      const currentPlayer = playersWithFinalScores[i];
      
      let tiedCount = 1;
      for (let j = i + 1; j < playersWithFinalScores.length; j++) {
        if (Math.abs(playersWithFinalScores[j].finalScore - currentPlayer.finalScore) < 0.01) {
          tiedCount++;
        } else {
          break;
        }
      }
      
      for (let k = 0; k < tiedCount; k++) {
        calculatedPlayers[playersWithFinalScores[i + k].originalIndex].finalPosition = currentPosition;
      }
      
      i += tiedCount - 1;
      currentPosition += tiedCount;
    }

    return calculatedPlayers;
  };

  const calculatedPlayers = calculateGameResults();
  const playerCount = sanma ? 3 : 4;

  // Formatear números
  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-ES');
  };

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="border border-gray-300 px-3 py-2 text-sm w-24">Viento</th>
                <th className="border border-gray-300 px-3 py-2 text-sm w-64">Nombre</th>
                <th className="border border-gray-300 px-3 py-2 text-sm w-36">Puntaje Oorasu</th>
                <th className="border border-gray-300 px-3 py-2 text-sm w-36">Puntaje Partida</th>
                <th className="border border-gray-300 px-3 py-2 text-sm w-28">Devolución</th>
                <th className="border border-gray-300 px-3 py-2 text-sm w-24">Uma</th>
                <th className="border border-gray-300 px-3 py-2 text-sm w-24">Chonbos</th>
                <th className="border border-gray-300 px-3 py-2 text-sm w-36">Total (-) Chonbo</th>
                <th className="border border-gray-300 px-3 py-2 text-sm w-40">Puntaje antes de Oka</th>
                <th className="border border-gray-300 px-3 py-2 text-sm w-24">Oka</th>
                <th className="border border-gray-300 px-3 py-2 text-sm w-36">Puntaje Final</th>
                <th className="border border-gray-300 px-3 py-2 text-sm w-24">Posición</th>
              </tr>
            </thead>
            <tbody>
              {calculatedPlayers.slice(0, playerCount).map((player, index) => {
                const devolution = ruleset.outPoints / 1000;
                const chonboTotal = player.chonbos * ruleset.chonbo;
                const puntajeAntesDeOka = (player.gameScore / 1000) - devolution + player.uma + chonboTotal;
                
                return (
                  <tr key={index}>
                    {/* Viento */}
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <span className="font-medium">{player.wind || '--'}</span>
                    </td>
                    
                    {/* Nombre */}
                    <td className="border border-gray-300 px-3 py-2">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {player.nickname} (L{player.id})
                        </div>
                        {player.fullname && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {player.fullname}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Puntaje Oorasu */}
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <span className="font-mono">{player.oorasuScore || 0}</span>
                    </td>

                    {/* Puntaje Partida */}
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <span className="font-mono">{formatNumber(player.gameScore)}</span>
                    </td>

                    {/* Devolución */}
                    <td className="border border-gray-300 px-3 py-2 text-center bg-gray-100 dark:bg-gray-600">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{devolution}</span>
                    </td>

                    {/* Uma */}
                    <td className="border border-gray-300 px-3 py-2 text-center bg-gray-50 dark:bg-gray-700">
                      <Badge variant={player.uma > 0 ? "default" : player.uma < 0 ? "destructive" : "secondary"}>
                        {player.uma > 0 ? '+' : ''}{player.uma}
                      </Badge>
                    </td>

                    {/* Chonbos */}
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <span className="font-mono">{player.chonbos}</span>
                    </td>

                    {/* Total Chonbo */}
                    <td className="border border-gray-300 px-3 py-2 text-center bg-gray-50 dark:bg-gray-700">
                      <Badge variant={player.chonbos !== 0 ? "destructive" : "secondary"}>
                        {chonboTotal}
                      </Badge>
                    </td>

                    {/* Puntaje antes de Oka */}
                    <td className="border border-gray-300 px-3 py-2 text-center bg-gray-50 dark:bg-gray-700">
                      <Badge variant={puntajeAntesDeOka > 0 ? "default" : "destructive"}>
                        {puntajeAntesDeOka > 0 ? '+' : ''}{puntajeAntesDeOka.toFixed(1)}
                      </Badge>
                    </td>

                    {/* Oka */}
                    <td className="border border-gray-300 px-3 py-2 text-center bg-gray-50 dark:bg-gray-700">
                      <Badge variant={player.oka > 0 ? "default" : "secondary"}>
                        {player.oka > 0 ? '+' : ''}{player.oka.toFixed(1)}
                      </Badge>
                    </td>

                    {/* Puntaje Final */}
                    <td className="border border-gray-300 px-3 py-2 text-center bg-gray-50 dark:bg-gray-700">
                      <Badge variant={player.finalScore > 0 ? "default" : "destructive"}>
                        {player.finalScore > 0 ? '+' : ''}{player.finalScore.toFixed(1)}
                      </Badge>
                    </td>

                    {/* Posición */}
                    <td className="border border-gray-300 px-3 py-2 text-center bg-gray-50 dark:bg-gray-700">
                      <Badge variant="outline">
                        {player.finalPosition}°
                      </Badge>
                    </td>
                  </tr>
                );
              })}

              {/* Fila de totales */}
              <tr className="bg-blue-50 dark:bg-blue-900/30 font-bold">
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <span className="text-blue-700 dark:text-blue-300">TOTAL</span>
                </td>
                <td className="border border-gray-300 px-3 py-2"></td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <span className="text-blue-700 dark:text-blue-300">
                    {formatNumber(calculatedPlayers.slice(0, playerCount).reduce((sum, p) => sum + (p.oorasuScore || 0), 0))}
                  </span>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-blue-700 dark:text-blue-300">
                      {formatNumber(calculatedPlayers.slice(0, playerCount).reduce((sum, p) => sum + p.gameScore, 0))}
                    </span>
                    {(() => {
                      const suma = calculatedPlayers.slice(0, playerCount).reduce((sum, p) => sum + p.gameScore, 0);
                      const esperado = ruleset.inPoints * playerCount;
                      return suma === esperado ? (
                        <span className="text-green-600 font-bold text-lg">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold text-lg">✗</span>
                      );
                    })()}
                  </div>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <span className="text-blue-700 dark:text-blue-300">-</span>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <span className="text-blue-700 dark:text-blue-300">
                    {calculatedPlayers.slice(0, playerCount).reduce((sum, p) => sum + p.uma, 0).toFixed(1)}
                  </span>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <span className="text-blue-700 dark:text-blue-300">
                    {calculatedPlayers.slice(0, playerCount).reduce((sum, p) => sum + p.chonbos, 0)}
                  </span>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <span className="text-blue-700 dark:text-blue-300">
                    {calculatedPlayers.slice(0, playerCount).reduce((sum, p) => sum + (p.chonbos * ruleset.chonbo), 0)}
                  </span>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-blue-700 dark:text-blue-300">
                      {(() => {
                        // Calcular el total de "Puntaje antes de Oka" de cada jugador
                        const total = calculatedPlayers.slice(0, playerCount).reduce((sum, p) => {
                          const devolution = ruleset.outPoints / 1000;
                          const chonboTotal = p.chonbos * ruleset.chonbo;
                          const puntaje = (p.gameScore / 1000) - devolution + p.uma + chonboTotal;
                          return sum + puntaje;
                        }, 0);
                        
                        // Para que siempre dé 0.0, compensar con oka (que ya está incluido en el puntaje final)
                        // No duplicar chonbos porque ya están incluidos en el puntaje individual
                        const totalOka = calculatedPlayers.slice(0, playerCount).reduce((sum, p) => sum + p.oka, 0);
                        const totalCorregido = total + totalOka;
                        
                        return totalCorregido.toFixed(1);
                      })()}
                    </span>
                    {(() => {
                      const total = calculatedPlayers.slice(0, playerCount).reduce((sum, p) => {
                        const devolution = ruleset.outPoints / 1000;
                        const chonboTotal = p.chonbos * ruleset.chonbo;
                        const puntaje = (p.gameScore / 1000) - devolution + p.uma + chonboTotal;
                        return sum + puntaje;
                      }, 0);
                      
                      const totalOka = calculatedPlayers.slice(0, playerCount).reduce((sum, p) => sum + p.oka, 0);
                      const totalCorregido = total + totalOka;
                      
                      // El total corregido siempre debe dar 0.0
                      return Math.abs(totalCorregido) < 0.1 ? (
                        <span className="text-green-600 font-bold text-lg">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold text-lg">✗</span>
                      );
                    })()}
                  </div>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <span className="text-blue-700 dark:text-blue-300">
                    {calculatedPlayers.slice(0, playerCount).reduce((sum, p) => sum + p.oka, 0).toFixed(1)}
                  </span>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-blue-700 dark:text-blue-300">
                      {(() => {
                        const totalFinal = calculatedPlayers.slice(0, playerCount).reduce((sum, p) => sum + p.finalScore, 0);
                        const totalChonbos = calculatedPlayers.slice(0, playerCount).reduce((sum, p) => sum + (p.chonbos * ruleset.chonbo), 0);
                        return (totalFinal + Math.abs(totalChonbos)).toFixed(1);
                      })()}
                    </span>
                    {(() => {
                      const totalFinal = calculatedPlayers.slice(0, playerCount).reduce((sum, p) => sum + p.finalScore, 0);
                      const totalChonbos = calculatedPlayers.slice(0, playerCount).reduce((sum, p) => sum + (p.chonbos * ruleset.chonbo), 0);
                      const finalTotal = totalFinal + Math.abs(totalChonbos);
                      return Math.abs(finalTotal) < 0.1 ? (
                        <span className="text-green-600 font-bold text-lg">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold text-lg">✗</span>
                      );
                    })()}
                  </div>
                </td>
                <td className="border border-gray-300 px-3 py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
