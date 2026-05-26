-- CreateEnum
CREATE TYPE "game_session_mode" AS ENUM ('SOLO', 'MULTIPLAYER');

-- CreateEnum
CREATE TYPE "game_session_status" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "game_session_task_status" AS ENUM ('PENDING', 'COMPLETED');

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" TEXT NOT NULL,
    "mode" "game_session_mode" NOT NULL,
    "status" "game_session_status" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_session_tasks" (
    "id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "status" "game_session_task_status" NOT NULL,
    "completed_at" TIMESTAMP(3),
    "session_id" TEXT NOT NULL,
    "game_task_id" TEXT NOT NULL,
    "completed_by_attempt_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_session_tasks_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "task_attempts"
ADD COLUMN "session_id" TEXT,
ADD COLUMN "session_task_id" TEXT;

-- CreateIndex
CREATE INDEX "game_sessions_user_id_status_mode_idx" ON "game_sessions"("user_id", "status", "mode");

-- CreateIndex
CREATE UNIQUE INDEX "game_session_tasks_session_id_order_index_key" ON "game_session_tasks"("session_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "game_session_tasks_completed_by_attempt_id_key" ON "game_session_tasks"("completed_by_attempt_id");

-- CreateIndex
CREATE INDEX "game_session_tasks_session_id_status_idx" ON "game_session_tasks"("session_id", "status");

-- CreateIndex
CREATE INDEX "task_attempts_session_id_created_at_idx" ON "task_attempts"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "task_attempts_session_task_id_created_at_idx" ON "task_attempts"("session_task_id", "created_at");

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_session_tasks" ADD CONSTRAINT "game_session_tasks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_session_tasks" ADD CONSTRAINT "game_session_tasks_game_task_id_fkey" FOREIGN KEY ("game_task_id") REFERENCES "game_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_session_tasks" ADD CONSTRAINT "game_session_tasks_completed_by_attempt_id_fkey" FOREIGN KEY ("completed_by_attempt_id") REFERENCES "task_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attempts" ADD CONSTRAINT "task_attempts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attempts" ADD CONSTRAINT "task_attempts_session_task_id_fkey" FOREIGN KEY ("session_task_id") REFERENCES "game_session_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
