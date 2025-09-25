-- CreateEnum
CREATE TYPE "game_type" AS ENUM ('HANCHAN', 'TONPUUSEN');

-- CreateEnum
CREATE TYPE "tournament_type" AS ENUM ('INDIVIDUAL', 'TEAM', 'LEAGUE');

-- CreateEnum
CREATE TYPE "online_platform" AS ENUM ('TENHOU', 'MAHJONG_SOUL');

-- CreateEnum
CREATE TYPE "points_type" AS ENUM ('DAN', 'RATE', 'SEASON');

-- CreateEnum
CREATE TYPE "link_request_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "pending_game_status" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER');

-- CreateTable
CREATE TABLE "country" (
    "id" SERIAL NOT NULL,
    "iso_code" VARCHAR(3) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "nationality" VARCHAR(255) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player" (
    "id" SERIAL NOT NULL,
    "nickname" VARCHAR(255) NOT NULL,
    "fullname" VARCHAR(255),
    "country_id" INTEGER NOT NULL,
    "player_number" INTEGER NOT NULL,
    "birthday" DATE,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uma" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "first_place" INTEGER NOT NULL,
    "second_place" INTEGER NOT NULL,
    "third_place" INTEGER NOT NULL,
    "fourth_place" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "uma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ruleset" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "uma_id" INTEGER NOT NULL,
    "oka" INTEGER NOT NULL,
    "chonbo" INTEGER NOT NULL,
    "aka" BOOLEAN NOT NULL DEFAULT false,
    "in_points" INTEGER NOT NULL,
    "out_points" INTEGER NOT NULL,
    "sanma" BOOLEAN NOT NULL DEFAULT false,
    "extra_data" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "ruleset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "extra_data" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(255),
    "country" VARCHAR(255),
    "extra_data" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_game" (
    "id" SERIAL NOT NULL,
    "game_date" DATE NOT NULL,
    "nro_juego_dia" INTEGER,
    "location_id" INTEGER,
    "duration" "game_type" NOT NULL,
    "sanma" BOOLEAN NOT NULL DEFAULT false,
    "season_id" INTEGER,
    "tournament_id" INTEGER,
    "ruleset_id" INTEGER NOT NULL,
    "image_url" TEXT,
    "image_file_name" TEXT,
    "image_format" TEXT,
    "player1_id" INTEGER NOT NULL,
    "player1_wind" VARCHAR(1),
    "player1_oorasu_score" INTEGER,
    "player1_game_score" INTEGER NOT NULL,
    "player1_chonbos" INTEGER NOT NULL DEFAULT 0,
    "player1_final_score" DECIMAL(10,1),
    "player2_id" INTEGER NOT NULL,
    "player2_wind" VARCHAR(1),
    "player2_oorasu_score" INTEGER,
    "player2_game_score" INTEGER NOT NULL,
    "player2_chonbos" INTEGER NOT NULL DEFAULT 0,
    "player2_final_score" DECIMAL(10,1),
    "player3_id" INTEGER NOT NULL,
    "player3_wind" VARCHAR(1),
    "player3_oorasu_score" INTEGER,
    "player3_game_score" INTEGER NOT NULL,
    "player3_chonbos" INTEGER NOT NULL DEFAULT 0,
    "player3_final_score" DECIMAL(10,1),
    "player4_id" INTEGER,
    "player4_wind" VARCHAR(1),
    "player4_oorasu_score" INTEGER,
    "player4_game_score" INTEGER,
    "player4_chonbos" INTEGER DEFAULT 0,
    "player4_final_score" DECIMAL(10,1),
    "status" "pending_game_status" NOT NULL DEFAULT 'PENDING',
    "submitted_by" TEXT,
    "validated_by" TEXT,
    "validated_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "game_id" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "pending_game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER,
    "ruleset_id" INTEGER NOT NULL,
    "location_id" INTEGER,
    "tournament_id" INTEGER,
    "game_type" "game_type" NOT NULL,
    "game_date" DATE NOT NULL,
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "extra_data" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_result" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "final_position" INTEGER NOT NULL,
    "final_score" DECIMAL(10,1) NOT NULL,
    "dan_points_earned" DECIMAL(10,4) NOT NULL,
    "rate_change" DECIMAL(10,4) NOT NULL,
    "season_points_earned" DECIMAL(10,4),
    "extra_data" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "game_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER,
    "location_id" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "tournament_type" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "max_players" INTEGER,
    "entry_fee" MONEY,
    "prize_pool" MONEY,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "sanma" BOOLEAN NOT NULL DEFAULT false,
    "extra_data" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_result" (
    "id" SERIAL NOT NULL,
    "tournament_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "points_won" INTEGER NOT NULL,
    "prize_won" MONEY,
    "extra_data" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "tournament_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "season_id" INTEGER NOT NULL,
    "points_value" DECIMAL(15,10) NOT NULL,
    "description" TEXT,
    "extra_data" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),
    "points_type" "points_type" NOT NULL DEFAULT 'DAN',
    "game_id" INTEGER,
    "tournament_id" INTEGER,
    "is_sanma" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_ranking" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "is_sanma" BOOLEAN NOT NULL DEFAULT false,
    "total_games" INTEGER NOT NULL DEFAULT 0,
    "average_position" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "dan_points" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "rate_points" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "season_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "season_total_games" INTEGER NOT NULL DEFAULT 0,
    "season_average_position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "season_first_place_h" INTEGER NOT NULL DEFAULT 0,
    "season_second_place_h" INTEGER NOT NULL DEFAULT 0,
    "season_third_place_h" INTEGER NOT NULL DEFAULT 0,
    "season_fourth_place_h" INTEGER NOT NULL DEFAULT 0,
    "season_first_place_t" INTEGER NOT NULL DEFAULT 0,
    "season_second_place_t" INTEGER NOT NULL DEFAULT 0,
    "season_third_place_t" INTEGER NOT NULL DEFAULT 0,
    "season_fourth_place_t" INTEGER NOT NULL DEFAULT 0,
    "max_rate" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "first_place_h" INTEGER NOT NULL DEFAULT 0,
    "second_place_h" INTEGER NOT NULL DEFAULT 0,
    "third_place_h" INTEGER NOT NULL DEFAULT 0,
    "fourth_place_h" INTEGER NOT NULL DEFAULT 0,
    "first_place_t" INTEGER NOT NULL DEFAULT 0,
    "second_place_t" INTEGER NOT NULL DEFAULT 0,
    "third_place_t" INTEGER NOT NULL DEFAULT 0,
    "fourth_place_t" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "player_ranking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'USER',
    "authorities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "session_invalidated_at" TIMESTAMP(3),
    "receive_game_notifications" BOOLEAN NOT NULL DEFAULT true,
    "receive_link_notifications" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_token" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "online_user" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "id_online" VARCHAR(255),
    "user_id" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "online_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_player_link" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "player_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "user_player_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_player_link_request" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "player_id" INTEGER NOT NULL,
    "status" "link_request_status" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "approved_by" VARCHAR(255),
    "approved_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "user_player_link_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_account" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "origin" VARCHAR(255) NOT NULL,
    "from_address" VARCHAR(255) NOT NULL,
    "reply_address" VARCHAR(255),
    "organization" VARCHAR(255),
    "server" VARCHAR(255) NOT NULL,
    "port" INTEGER NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "connection_security" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "email_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dan_config" (
    "id" SERIAL NOT NULL,
    "rank" VARCHAR(50) NOT NULL,
    "sanma" BOOLEAN NOT NULL DEFAULT false,
    "min_points" INTEGER NOT NULL,
    "max_points" INTEGER,
    "first_place" INTEGER NOT NULL,
    "second_place" INTEGER NOT NULL,
    "third_place" INTEGER NOT NULL,
    "fourth_place" INTEGER,
    "is_protected" BOOLEAN NOT NULL DEFAULT false,
    "color" VARCHAR(7) NOT NULL,
    "css_class" VARCHAR(50) NOT NULL,
    "is_last_rank" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "dan_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_config" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sanma" BOOLEAN NOT NULL DEFAULT false,
    "first_place" INTEGER NOT NULL,
    "second_place" INTEGER NOT NULL,
    "third_place" INTEGER NOT NULL,
    "fourth_place" INTEGER,
    "adjustment_rate" DOUBLE PRECISION NOT NULL,
    "adjustment_limit" INTEGER NOT NULL,
    "min_adjustment" DOUBLE PRECISION NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "rate_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_config" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sanma" BOOLEAN NOT NULL DEFAULT false,
    "first_place" INTEGER NOT NULL,
    "second_place" INTEGER NOT NULL,
    "third_place" INTEGER NOT NULL,
    "fourth_place" INTEGER,
    "season_id" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "season_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_result" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "is_sanma" BOOLEAN NOT NULL DEFAULT false,
    "season_total_games" INTEGER NOT NULL DEFAULT 0,
    "season_avg_position" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "season_first_h" INTEGER NOT NULL DEFAULT 0,
    "season_second_h" INTEGER NOT NULL DEFAULT 0,
    "season_third_h" INTEGER NOT NULL DEFAULT 0,
    "season_fourth_h" INTEGER NOT NULL DEFAULT 0,
    "season_first_t" INTEGER NOT NULL DEFAULT 0,
    "season_second_t" INTEGER NOT NULL DEFAULT 0,
    "season_third_t" INTEGER NOT NULL DEFAULT 0,
    "season_fourth_t" INTEGER NOT NULL DEFAULT 0,
    "season_points" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "extra_data" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "created_ip" VARCHAR(45),
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(255),
    "updated_ip" VARCHAR(45),

    CONSTRAINT "season_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "country_iso_code_key" ON "country"("iso_code");

-- CreateIndex
CREATE UNIQUE INDEX "player_nickname_key" ON "player"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "player_player_number_key" ON "player"("player_number");

-- CreateIndex
CREATE UNIQUE INDEX "game_result_game_id_player_id_key" ON "game_result"("game_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_result_tournament_id_player_id_key" ON "tournament_result"("tournament_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_ranking_player_id_is_sanma_key" ON "player_ranking"("player_id", "is_sanma");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_provider_account_id_key" ON "account"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_session_token_key" ON "session"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_token_key" ON "verification_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_identifier_token_key" ON "verification_token"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "user_player_link_user_id_key" ON "user_player_link"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_player_link_player_id_key" ON "user_player_link"("player_id");

-- CreateIndex
CREATE INDEX "user_player_link_request_player_id_idx" ON "user_player_link_request"("player_id");

-- CreateIndex
CREATE INDEX "user_player_link_request_user_id_idx" ON "user_player_link_request"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "dan_config_rank_sanma_key" ON "dan_config"("rank", "sanma");

-- CreateIndex
CREATE UNIQUE INDEX "rate_config_name_sanma_key" ON "rate_config"("name", "sanma");

-- CreateIndex
CREATE INDEX "season_config_name_sanma_season_id_idx" ON "season_config"("name", "sanma", "season_id");

-- CreateIndex
CREATE INDEX "season_config_name_sanma_is_default_idx" ON "season_config"("name", "sanma", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "season_result_season_id_player_id_is_sanma_key" ON "season_result"("season_id", "player_id", "is_sanma");

-- AddForeignKey
ALTER TABLE "player" ADD CONSTRAINT "player_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ruleset" ADD CONSTRAINT "ruleset_uma_id_fkey" FOREIGN KEY ("uma_id") REFERENCES "uma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_game" ADD CONSTRAINT "pending_game_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_game" ADD CONSTRAINT "pending_game_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_game" ADD CONSTRAINT "pending_game_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_game" ADD CONSTRAINT "pending_game_player3_id_fkey" FOREIGN KEY ("player3_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_game" ADD CONSTRAINT "pending_game_player4_id_fkey" FOREIGN KEY ("player4_id") REFERENCES "player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_game" ADD CONSTRAINT "pending_game_ruleset_id_fkey" FOREIGN KEY ("ruleset_id") REFERENCES "ruleset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_game" ADD CONSTRAINT "pending_game_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_game" ADD CONSTRAINT "pending_game_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_game" ADD CONSTRAINT "pending_game_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game" ADD CONSTRAINT "game_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game" ADD CONSTRAINT "game_ruleset_id_fkey" FOREIGN KEY ("ruleset_id") REFERENCES "ruleset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game" ADD CONSTRAINT "game_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game" ADD CONSTRAINT "game_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_result" ADD CONSTRAINT "game_result_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_result" ADD CONSTRAINT "game_result_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament" ADD CONSTRAINT "tournament_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament" ADD CONSTRAINT "tournament_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_result" ADD CONSTRAINT "tournament_result_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_result" ADD CONSTRAINT "tournament_result_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points" ADD CONSTRAINT "fk_points_player_id" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "points" ADD CONSTRAINT "fk_points_game_id" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "points" ADD CONSTRAINT "fk_points_tournament_id" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "player_ranking" ADD CONSTRAINT "player_ranking_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_user" ADD CONSTRAINT "online_user_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_player_link" ADD CONSTRAINT "user_player_link_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_player_link" ADD CONSTRAINT "user_player_link_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_player_link_request" ADD CONSTRAINT "user_player_link_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_player_link_request" ADD CONSTRAINT "user_player_link_request_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_config" ADD CONSTRAINT "season_config_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_result" ADD CONSTRAINT "season_result_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_result" ADD CONSTRAINT "season_result_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
