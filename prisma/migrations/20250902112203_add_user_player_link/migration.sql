/*
  Warnings:

  - You are about to drop the column `extra_data` on the `online_user` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `game_result` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `platform` on the `online_user` table. No cast exists, the column would be dropped and recreatedAt, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `points` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `tournament_result` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "carm"."link_request_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "carm"."user_role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER');

-- DropForeignKey
ALTER TABLE "carm"."online_user" DROP CONSTRAINT "online_user_player_id_fkey";

-- DropIndex
DROP INDEX "carm"."online_user_player_id_platform_key";

-- AlterTable
ALTER TABLE "carm"."country" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "carm"."game" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "carm"."game_result" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "carm"."location" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "carm"."online_user" DROP COLUMN "extra_data",
ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "user_id" VARCHAR(255),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
DROP COLUMN "platform",
ADD COLUMN     "platform" VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE "carm"."player" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "carm"."player_ranking" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "carm"."points" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "carm"."ruleset" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "carm"."season" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "carm"."tournament" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "carm"."tournament_result" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "carm"."uma" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "carm"."account" (
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
CREATE TABLE "carm"."session" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "role" "carm"."user_role" NOT NULL DEFAULT 'USER',
    "authorities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."verification_token" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "carm"."user_player_link" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "player_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_player_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carm"."user_player_link_request" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "player_id" INTEGER NOT NULL,
    "status" "carm"."link_request_status" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "approved_by" VARCHAR(255),
    "approved_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_player_link_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_provider_account_id_key" ON "carm"."account"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_session_token_key" ON "carm"."session"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "carm"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_token_key" ON "carm"."verification_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_identifier_token_key" ON "carm"."verification_token"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "user_player_link_user_id_key" ON "carm"."user_player_link"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_player_link_player_id_key" ON "carm"."user_player_link"("player_id");

-- CreateIndex
CREATE INDEX "user_player_link_request_player_id_idx" ON "carm"."user_player_link_request"("player_id");

-- CreateIndex
CREATE INDEX "user_player_link_request_user_id_idx" ON "carm"."user_player_link_request"("user_id");

-- AddForeignKey
ALTER TABLE "carm"."account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "carm"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "carm"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."online_user" ADD CONSTRAINT "online_user_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "carm"."player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."user_player_link" ADD CONSTRAINT "user_player_link_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "carm"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."user_player_link" ADD CONSTRAINT "user_player_link_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "carm"."player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."user_player_link_request" ADD CONSTRAINT "user_player_link_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "carm"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carm"."user_player_link_request" ADD CONSTRAINT "user_player_link_request_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "carm"."player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
