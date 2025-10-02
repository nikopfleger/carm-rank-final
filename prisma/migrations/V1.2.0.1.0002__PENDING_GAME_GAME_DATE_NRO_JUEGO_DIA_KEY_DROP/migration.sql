-- Migration: V1.2.0.1.0002__PENDING_GAME_GAME_DATE_NRO_JUEGO_DIA_KEY_DROP
-- Drop unique key/index on pending_game (game_date, nro_juego_dia)
-- Safe for repeated runs

BEGIN;

ALTER TABLE "pending_game"
  DROP CONSTRAINT IF EXISTS "pending_game_game_date_nro_juego_dia_key";

DROP INDEX IF EXISTS "pending_game_game_date_nro_juego_dia_key";

COMMIT;


