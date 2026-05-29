-- CreateEnum
CREATE TYPE "multiplayer_match_status" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- DropForeignKey
ALTER TABLE "task_attempts" DROP CONSTRAINT "task_attempts_session_id_fkey";

-- DropForeignKey
ALTER TABLE "task_attempts" DROP CONSTRAINT "task_attempts_session_task_id_fkey";

-- AlterTable
ALTER TABLE "game_sessions" ADD COLUMN "multiplayer_match_id" TEXT;

-- CreateTable
CREATE TABLE "multiplayer_matches" (
    "id" TEXT NOT NULL,
    "status" "multiplayer_match_status" NOT NULL,
    "host_id" TEXT NOT NULL,
    "winner_user_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "multiplayer_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "multiplayer_matches_host_id_status_idx" ON "multiplayer_matches"("host_id", "status");

-- CreateIndex
CREATE INDEX "multiplayer_matches_winner_user_id_idx" ON "multiplayer_matches"("winner_user_id");

-- CreateIndex
CREATE INDEX "game_sessions_multiplayer_match_id_status_idx" ON "game_sessions"("multiplayer_match_id", "status");

-- AddForeignKey
ALTER TABLE "game_sessions"
ADD CONSTRAINT "game_sessions_multiplayer_match_id_fkey"
FOREIGN KEY ("multiplayer_match_id") REFERENCES "multiplayer_matches"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multiplayer_matches"
ADD CONSTRAINT "multiplayer_matches_host_id_fkey"
FOREIGN KEY ("host_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multiplayer_matches"
ADD CONSTRAINT "multiplayer_matches_winner_user_id_fkey"
FOREIGN KEY ("winner_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attempts"
ADD CONSTRAINT "task_attempts_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attempts"
ADD CONSTRAINT "task_attempts_session_task_id_fkey"
FOREIGN KEY ("session_task_id") REFERENCES "game_session_tasks"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
