-- game
CREATE INDEX IF NOT EXISTS idx_game_season_id         ON game (season_id);
CREATE INDEX IF NOT EXISTS idx_game_game_date         ON game (game_date);
CREATE INDEX IF NOT EXISTS idx_game_season_id_inc_id  ON game (season_id) INCLUDE (id);
CREATE INDEX IF NOT EXISTS idx_game_game_date_inc_id  ON game (game_date) INCLUDE (id);

-- game_result
CREATE INDEX IF NOT EXISTS idx_game_result_game_id            ON game_result (game_id);
CREATE INDEX IF NOT EXISTS idx_game_result_player_id          ON game_result (player_id);
CREATE INDEX IF NOT EXISTS idx_game_result_game_id_player_id  ON game_result (game_id, player_id);
