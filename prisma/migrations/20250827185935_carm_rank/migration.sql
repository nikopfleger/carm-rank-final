-- CreateEnum
CREATE TYPE "public"."game_type" AS ENUM ('HANCHAN', 'TONPUUSEN');

-- CreateEnum
CREATE TYPE "public"."tournament_type" AS ENUM ('INDIVIDUAL', 'TEAM', 'LEAGUE');

-- CreateEnum
CREATE TYPE "public"."online_platform" AS ENUM ('TENHOU', 'MAHJONG_SOUL');

-- CreateEnum
CREATE TYPE "public"."points_type" AS ENUM ('DAN_POINTS', 'RATE_POINTS');

-- CreateTable
CREATE TABLE "public"."country" (
    "id" SERIAL NOT NULL,
    "iso_code" VARCHAR(3) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "nationality" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."player" (
    "id" SERIAL NOT NULL,
    "nickname" VARCHAR(255) NOT NULL,
    "fullname" VARCHAR(255),
    "country_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "birthday" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."uma" (
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
CREATE TABLE "public"."ruleset" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "uma_id" INTEGER NOT NULL,
    "oka" INTEGER NOT NULL,
    "chonbo" INTEGER NOT NULL,
    "game_length" VARCHAR(50) NOT NULL,
    "aka" VARCHAR(50),
    "in_points" INTEGER NOT NULL,
    "out_points" INTEGER NOT NULL,
    "sanma" BOOLEAN NOT NULL DEFAULT false,
    "extra_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ruleset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."season" (
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
CREATE TABLE "public"."location" (
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
CREATE TABLE "public"."game" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "ruleset_id" INTEGER NOT NULL,
    "location_id" INTEGER,
    "game_type" "public"."game_type" NOT NULL,
    "game_date" DATE NOT NULL,
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "extra_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."game_result" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "final_position" INTEGER NOT NULL,
    "final_score" INTEGER NOT NULL,
    "dan_points_earned" INTEGER NOT NULL,
    "rate_change" INTEGER NOT NULL,
    "extra_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."online_user" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "platform" "public"."online_platform" NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "extra_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "online_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tournament" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "location_id" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "public"."tournament_type" NOT NULL,
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
CREATE TABLE "public"."tournament_result" (
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
CREATE TABLE "public"."points" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "season_id" INTEGER NOT NULL,
    "points_type" "public"."points_type" NOT NULL,
    "points_value" INTEGER NOT NULL,
    "description" TEXT,
    "extra_data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "country_iso_code_key" ON "public"."country"("iso_code");

-- CreateIndex
CREATE UNIQUE INDEX "player_nickname_key" ON "public"."player"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "player_player_id_key" ON "public"."player"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_result_game_id_player_id_key" ON "public"."game_result"("game_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "online_user_player_id_platform_key" ON "public"."online_user"("player_id", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_result_tournament_id_player_id_key" ON "public"."tournament_result"("tournament_id", "player_id");

-- AddForeignKey
ALTER TABLE "public"."player" ADD CONSTRAINT "player_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ruleset" ADD CONSTRAINT "ruleset_uma_id_fkey" FOREIGN KEY ("uma_id") REFERENCES "public"."uma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."game" ADD CONSTRAINT "game_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."game" ADD CONSTRAINT "game_ruleset_id_fkey" FOREIGN KEY ("ruleset_id") REFERENCES "public"."ruleset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."game" ADD CONSTRAINT "game_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."game_result" ADD CONSTRAINT "game_result_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."game_result" ADD CONSTRAINT "game_result_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."online_user" ADD CONSTRAINT "online_user_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament" ADD CONSTRAINT "tournament_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament" ADD CONSTRAINT "tournament_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_result" ADD CONSTRAINT "tournament_result_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_result" ADD CONSTRAINT "tournament_result_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
