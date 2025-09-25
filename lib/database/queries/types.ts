// Types for player data
export interface Player {
  id: number;
  nickname: string;
  fullname: string | null;
  countryId: number;
  playerId: number; // legajo
  birthday: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

// Additional types for common.ts
export interface Country {
  id: number;
  iso_code: string;
  name_es: string;
  name_en?: string;
}

export interface Location {
  id: number;
  name: string;
  address?: string;
  online_platform?: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface Ruleset {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date | null;
  // Real fields from schema
  umaId: number;
  oka: number;
  chonbo: number;
  aka: boolean;
  inPoints: number;
  outPoints: number;
  sanma: boolean;
  extraData?: any;
}

export interface Uma {
  id: number;
  name: string;
  first_place: number;
  second_place: number;
  third_place: number;
  fourth_place: number | null; // Corregido: puede ser null
  createdAt: Date;
  updatedAt: Date | null;
}

export interface OnlineApp {
  id: number;
  platform: string;
  name: string;
  createdAt: Date;
  updatedAt: Date | null;
}

// Type for player with full ranking information
export interface PlayerWithRanking {
  id: number;
  nickname: string;
  fullname: string | null;
  country_id: number;
  player_id: number; // legajo
  birthday: Date | null;
  country_iso: string;
  country_name: string;
  createdAt: Date;
  updatedAt: Date | null;

  // Ranking fields
  position: number;
  total_games: number;
  average_position: number;
  dan_points: number;
  rate_points: number;
  max_rate: number;
  win_rate: number;
  rank: string; // Ranking en japonés (段, 級)
  rank_spanish?: string; // Ranking en español para tooltip
  rank_color?: string; // Color del rango desde la base de datos

  // Season fields
  season_points?: number;
  season_average_position?: number;

  // Datos para progreso de rango
  rank_min_points?: number;
  rank_max_points?: number | null;
  next_rank?: string;
  first_place_h: number;
  second_place_h: number;
  third_place_h: number;
  fourth_place_h: number;
  first_place_t: number;
  second_place_t: number;
  third_place_t: number;
  fourth_place_t: number;

  // Tendencias
  trend_dan_delta10?: number;
  trend_season_delta10?: number;
}
