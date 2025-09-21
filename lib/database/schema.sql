-- CAMR Ranking Database Schema
-- Based on the DBML design provided

-- Enable UUID extension if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Countries table
CREATE TABLE IF NOT EXISTS country (
    id SERIAL PRIMARY KEY,
    iso_code VARCHAR(3) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    nationality VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Players table
CREATE TABLE IF NOT EXISTS player (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(255) NOT NULL UNIQUE,
    fullname VARCHAR(255),
    country_id INTEGER NOT NULL REFERENCES country(id),
    player_id INTEGER NOT NULL UNIQUE, -- legajo
    birthday DATE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uma configurations
CREATE TABLE IF NOT EXISTS uma (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    first_place INTEGER NOT NULL,
    second_place INTEGER NOT NULL,
    third_place INTEGER NOT NULL,
    fourth_place INTEGER, -- NULL for sanma
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ruleset configurations
CREATE TABLE IF NOT EXISTS ruleset (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    uma_id INTEGER NOT NULL REFERENCES uma(id),
    oka INTEGER NOT NULL,
    chonbo INTEGER NOT NULL,
    game_length VARCHAR(50) NOT NULL, -- 'HANCHAN' or 'TONPUUSEN'
    aka VARCHAR(50),
    in_points INTEGER NOT NULL,
    out_points INTEGER NOT NULL,
    sanma BOOLEAN NOT NULL DEFAULT FALSE,
    extra_data JSONB,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seasons
CREATE TABLE IF NOT EXISTS season (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    ranked_games_count BOOLEAN DEFAULT TRUE,
    ruleset_id INTEGER REFERENCES ruleset(id),
    is_active BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Online platforms
CREATE TABLE IF NOT EXISTS online_app (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations
CREATE TABLE IF NOT EXISTS location (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    country_id INTEGER REFERENCES country(id),
    online_app_id INTEGER REFERENCES online_app(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournaments
CREATE TABLE IF NOT EXISTS tournament (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    season_id INTEGER REFERENCES season(id),
    ruleset_id INTEGER REFERENCES ruleset(id),
    location_id INTEGER REFERENCES location(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games
CREATE TABLE IF NOT EXISTS game (
    id SERIAL PRIMARY KEY,
    game_length VARCHAR(50) NOT NULL, -- 'HANCHAN' or 'TONPUUSEN'
    date_played DATE NOT NULL,
    location_id INTEGER NOT NULL REFERENCES location(id),
    ruleset_id INTEGER NOT NULL REFERENCES ruleset(id),
    season_id INTEGER REFERENCES season(id),
    tournament_id INTEGER REFERENCES tournament(id),
    is_validated BOOLEAN DEFAULT FALSE,
    validated_by INTEGER REFERENCES player(id),
    validated_at TIMESTAMP,
    image_url VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game results
CREATE TABLE IF NOT EXISTS player_game_result (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES player(id),
    game_id INTEGER NOT NULL REFERENCES game(id),
    score INTEGER NOT NULL, -- raw score
    final_score INTEGER NOT NULL, -- after uma and oka
    starting_wind VARCHAR(10),
    final_position INTEGER NOT NULL,
    chonbo INTEGER DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, game_id)
);

-- Points tracking (Rate, Dan, Season points)
CREATE TABLE IF NOT EXISTS points (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES player(id),
    points DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'SEASON', 'RATE', 'DAN'
    season_id INTEGER REFERENCES season(id),
    game_id INTEGER REFERENCES game(id),
    date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player ranking (denormalized for performance)
CREATE TABLE IF NOT EXISTS player_ranking (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES player(id),
    type VARCHAR(50) NOT NULL, -- 'GENERAL' or 'TEMPORADA'
    season_id INTEGER REFERENCES season(id),
    total_games INTEGER DEFAULT 0,
    average_position DECIMAL(4,2),
    dan_points DECIMAL(10,2) DEFAULT 0,
    rate_points DECIMAL(10,2) DEFAULT 1500,
    season_points DECIMAL(10,2) DEFAULT 0,
    max_rate DECIMAL(10,2) DEFAULT 1500,
    first_place_h INTEGER DEFAULT 0,
    second_place_h INTEGER DEFAULT 0,
    third_place_h INTEGER DEFAULT 0,
    fourth_place_h INTEGER DEFAULT 0,
    first_place_t INTEGER DEFAULT 0,
    second_place_t INTEGER DEFAULT 0,
    third_place_t INTEGER DEFAULT 0,
    fourth_place_t INTEGER DEFAULT 0,
    sanma BOOLEAN DEFAULT FALSE,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, type, season_id)
);

-- Online user accounts
CREATE TABLE IF NOT EXISTS online_user (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES player(id),
    online_app_id INTEGER NOT NULL REFERENCES online_app(id),
    nickname VARCHAR(255) NOT NULL,
    online_id VARCHAR(255) NOT NULL,
    extra_data JSONB,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(online_app_id, online_id)
);

-- Tournament results
CREATE TABLE IF NOT EXISTS tournament_result (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES player(id),
    tournament_id INTEGER NOT NULL REFERENCES tournament(id),
    season_id INTEGER NOT NULL REFERENCES season(id),
    placement INTEGER NOT NULL,
    points INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users for authentication (future)
CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255), -- will be replaced with OAuth
    player_id INTEGER REFERENCES player(id),
    email VARCHAR(255) UNIQUE,
    is_admin BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_ranking_type_season ON player_ranking(type, season_id);
CREATE INDEX IF NOT EXISTS idx_player_game_result_player ON player_game_result(player_id);
CREATE INDEX IF NOT EXISTS idx_player_game_result_game ON player_game_result(game_id);
CREATE INDEX IF NOT EXISTS idx_points_player_type ON points(player_id, type);
CREATE INDEX IF NOT EXISTS idx_game_season ON game(season_id);
CREATE INDEX IF NOT EXISTS idx_game_date ON game(date_played);

-- Sample data inserts
INSERT INTO country (iso_code, full_name, nationality) VALUES 
('AR', 'Argentina', 'Argentino'),
('BR', 'Brasil', 'Brasileño'),
('CL', 'Chile', 'Chileno'),
('UY', 'Uruguay', 'Uruguayo'),
('PY', 'Paraguay', 'Paraguayo')
ON CONFLICT (iso_code) DO NOTHING;

INSERT INTO online_app (name) VALUES 
('Tenhou'),
('MahjongSoul'),
('Presencial')
ON CONFLICT DO NOTHING;

INSERT INTO uma (name, first_place, second_place, third_place, fourth_place) VALUES 
('EMA Standard', 15, 5, -5, -15),
('EMA Sanma', 15, 0, -15, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO location (name, address, country_id) VALUES 
('Biblioteca Sudestada', 'Buenos Aires, Argentina', 1),
('Online - Tenhou', 'Virtual', 1),
('Online - MahjongSoul', 'Virtual', 1)
ON CONFLICT DO NOTHING;
