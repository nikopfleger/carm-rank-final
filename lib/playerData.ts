export type FullPlayerData = {
  legajo: number;
  position: number;
  nickname: string;
  country: string;
  tenhou: string;
  mahjongSoul: string;
  average: number;
  rank: string;
  games: number;
  nombre: string;
  puntos: number;
  puntosNextRank: number;
  maxRate: number;
  currentRate: number;
  primerosHanchan: number;
  segundosHanchan: number;
  tercerosHanchan: number;
  cuartosHanchan: number;
  primerosTonpu: number;
  segundosTonpu: number;
  tercerosTonpu: number;
  cuartosTonpu: number;
  winRate: number; // <- agregado para cálculo
};

// Generating mock full player data
export const mockFullPlayerData: FullPlayerData[] = Array.from(
  { length: 5 },
  (_, i) => {
    const totalGames = 100 - i * 5;
    const wins = 30 + i * 2; // solo ejemplo
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    return {
      legajo: i + 1,
      position: i + 1,
      nickname: `Player${i + 1}`,
      country: ["AR", "BR", "CL", "UY", "PY"][i],
      tenhou: `TenhouP${i + 1}`,
      mahjongSoul: `MjSoulP${i + 1}`,
      average: parseFloat((2 + i * 0.2).toFixed(2)),
      rank: `${5 - i} Dan`,
      games: totalGames,
      nombre: `Tito Player${i + 1}`,
      puntos: 1000 + i * 100,
      puntosNextRank: 2000 + i * 100,
      maxRate: 2000 + i * 50,
      currentRate: 1500 + i * 50,
      primerosHanchan: 10 + i,
      segundosHanchan: 20 + i,
      tercerosHanchan: 30 + i,
      cuartosHanchan: 40 + i,
      primerosTonpu: 50 + i,
      segundosTonpu: 60 + i,
      tercerosTonpu: 70 + i,
      cuartosTonpu: 80 + i,
      winRate: parseFloat(winRate.toFixed(2)), // agregado
    };
  }
);

// Derive BasicPlayerData from FullPlayerData
export type BasicPlayerData = Pick<
  FullPlayerData,
  | "legajo"
  | "position"
  | "nickname"
  | "country"
  | "tenhou"
  | "mahjongSoul"
  | "average"
  | "rank"
  | "games"
  | "winRate" // <- agregado también acá
>;

export function getBasicPlayerDataFromFull(
  fullData: FullPlayerData[]
): BasicPlayerData[] {
  return fullData.map(
    ({
      legajo,
      position,
      nickname,
      country,
      tenhou,
      mahjongSoul,
      average,
      rank,
      games,
      winRate,
    }) => ({
      legajo,
      position,
      nickname,
      country,
      tenhou,
      mahjongSoul,
      average,
      rank,
      games,
      winRate,
    })
  );
}

// Automatically generate basic player data from the full data for demonstration
export const basicPlayerData = getBasicPlayerDataFromFull(mockFullPlayerData);

// Export the full data as the default export if needed
export const fullPlayerData = mockFullPlayerData;

// Debug log automático
console.log("FullPlayerData:", fullPlayerData);
console.log("BasicPlayerData:", basicPlayerData);
