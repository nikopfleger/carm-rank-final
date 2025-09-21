-- CreateEnum
CREATE TYPE "carm"."game_type" AS ENUM ('HANCHAN', 'TONPUUSEN');

-- CreateEnum
CREATE TYPE "carm"."tournament_type" AS ENUM ('INDIVIDUAL', 'TEAM', 'LEAGUE');

-- CreateEnum
CREATE TYPE "carm"."online_platform" AS ENUM ('TENHOU', 'MAHJONG_SOUL');

-- CreateEnum
CREATE TYPE "carm"."points_type" AS ENUM ('DAN', 'RATE', 'SEASON');

-- CreateEnum
CREATE TYPE "carm"."pending_game_status" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');

-- CreateTable
CREATE TABLE "carm"."country" (
    "id" SERIAL NOT NULL,
    "iso_code" VARCHAR(3) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "nationality" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."player" (
    "id" SERIAL NOT NULL,
    "nickname" VARCHAR(255) NOT NULL,
    "fullname" VARCHAR(255),
    "country_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "birthday" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_game_date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."uma" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "first_place" INTEGER NOT NULL,
    "second_place" INTEGER NOT NULL,
    "third_place" INTEGER NOT NULL,
    "fourth_place" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."ruleset" (
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ruleset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."season" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "extra_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."location" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(255),
    "country" VARCHAR(255),
    "extra_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."pending_game" (
    "id" SERIAL NOT NULL,
    "game_date" DATE NOT NULL,
    "nro_juego_dia" INTEGER,
    "venue" VARCHAR(255),
    "duration" "carm"."game_type" NOT NULL,
    "sanma" BOOLEAN NOT NULL DEFAULT false,
    "season_id" INTEGER,
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
    "status" "carm"."pending_game_status" NOT NULL DEFAULT 'PENDING',
    "submitted_by" INTEGER,
    "validated_by" INTEGER,
    "validated_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "game_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."game" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER,
    "ruleset_id" INTEGER NOT NULL,
    "location_id" INTEGER,
    "game_type" "carm"."game_type" NOT NULL,
    "game_date" DATE NOT NULL,
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "extra_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."game_result" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "final_position" INTEGER NOT NULL,
    "final_score" DECIMAL(10,1) NOT NULL,
    "dan_points_earned" DECIMAL(10,4) NOT NULL,
    "rate_change" DECIMAL(10,4) NOT NULL,
    "extra_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."online_user" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "platform" "carm"."online_platform" NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "extra_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "online_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."tournament" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "location_id" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "carm"."tournament_type" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "max_players" INTEGER,
    "entry_fee" MONEY,
    "prize_pool" MONEY,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "extra_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."tournament_result" (
    "id" SERIAL NOT NULL,
    "tournament_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "final_rank" INTEGER NOT NULL,
    "prize_won" MONEY,
    "extra_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."points" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "season_id" INTEGER NOT NULL,
    "points_value" DECIMAL(10,4) NOT NULL,
    "description" TEXT,
    "extra_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "points_type" "carm"."points_type" NOT NULL DEFAULT 'DAN',
    "game_id" INTEGER,

    CONSTRAINT "points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."player_ranking" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "season_id" INTEGER,
    "total_games" INTEGER NOT NULL DEFAULT 0,
    "average_position" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "dan_points" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "rate_points" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "season_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_rate" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "first_place_h" INTEGER NOT NULL DEFAULT 0,
    "second_place_h" INTEGER NOT NULL DEFAULT 0,
    "third_place_h" INTEGER NOT NULL DEFAULT 0,
    "fourth_place_h" INTEGER NOT NULL DEFAULT 0,
    "first_place_t" INTEGER NOT NULL DEFAULT 0,
    "second_place_t" INTEGER NOT NULL DEFAULT 0,
    "third_place_t" INTEGER NOT NULL DEFAULT 0,
    "fourth_place_t" INTEGER NOT NULL DEFAULT 0,
    "sanma" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_ranking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "country_iso_code_key" ON "carm"."country"("iso_code");

-- CreateIndex
CREATE UNIQUE INDEX "player_nickname_key" ON "carm"."player"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "player_player_id_key" ON "carm"."player"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "pending_game_game_date_nro_juego_dia_key" ON "carm"."pending_game"("game_date", "nro_juego_dia");

-- CreateIndex
CREATE UNIQUE INDEX "game_result_game_id_player_id_key" ON "carm"."game_result"("game_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "online_user_player_id_platform_key" ON "carm"."online_user"("player_id", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_result_tournament_id_player_id_key" ON "carm"."tournament_result"("tournament_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_ranking_player_id_type_season_id_key" ON "carm"."player_ranking"("player_id", "type", "season_id");

-- AddForeignKey
ALTER TABLE "carm"."player" ADD CONSTRAINT "player_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "carm"."country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."ruleset" ADD CONSTRAINT "ruleset_uma_id_fkey" FOREIGN KEY ("uma_id") REFERENCES "carm"."uma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."pending_game" ADD CONSTRAINT "pending_game_ruleset_id_fkey" FOREIGN KEY ("ruleset_id") REFERENCES "carm"."ruleset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."pending_game" ADD CONSTRAINT "pending_game_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "carm"."season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."pending_game" ADD CONSTRAINT "pending_game_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "carm"."player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."pending_game" ADD CONSTRAINT "pending_game_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "carm"."player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."pending_game" ADD CONSTRAINT "pending_game_player3_id_fkey" FOREIGN KEY ("player3_id") REFERENCES "carm"."player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."pending_game" ADD CONSTRAINT "pending_game_player4_id_fkey" FOREIGN KEY ("player4_id") REFERENCES "carm"."player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."pending_game" ADD CONSTRAINT "pending_game_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "carm"."player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."pending_game" ADD CONSTRAINT "pending_game_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "carm"."player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."pending_game" ADD CONSTRAINT "pending_game_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "carm"."game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."game" ADD CONSTRAINT "game_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "carm"."location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."game" ADD CONSTRAINT "game_ruleset_id_fkey" FOREIGN KEY ("ruleset_id") REFERENCES "carm"."ruleset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."game" ADD CONSTRAINT "game_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "carm"."season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."game_result" ADD CONSTRAINT "game_result_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "carm"."game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."game_result" ADD CONSTRAINT "game_result_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "carm"."player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."online_user" ADD CONSTRAINT "online_user_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "carm"."player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."tournament" ADD CONSTRAINT "tournament_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "carm"."location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."tournament" ADD CONSTRAINT "tournament_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "carm"."season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."tournament_result" ADD CONSTRAINT "tournament_result_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "carm"."player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."tournament_result" ADD CONSTRAINT "tournament_result_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "carm"."tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."points" ADD CONSTRAINT "fk_points_game_id" FOREIGN KEY ("game_id") REFERENCES "carm"."game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "carm"."player_ranking" ADD CONSTRAINT "player_ranking_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "carm"."player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."player_ranking" ADD CONSTRAINT "player_ranking_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "carm"."season"("id") ON DELETE SET NULL ON UPDATE CASCADE;
