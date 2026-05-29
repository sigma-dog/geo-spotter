-- CreateEnum
CREATE TYPE "task_attempt_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "task_attempt_verdict" AS ENUM ('MATCH', 'NO_MATCH', 'UNCERTAIN');

-- CreateTable
CREATE TABLE "game_tasks" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_attempts" (
    "id" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL,
    "image_id" TEXT NOT NULL,
    "mapillary_image_url" TEXT,
    "selection_left" DOUBLE PRECISION NOT NULL,
    "selection_top" DOUBLE PRECISION NOT NULL,
    "selection_width" DOUBLE PRECISION NOT NULL,
    "selection_height" DOUBLE PRECISION NOT NULL,
    "world_lat" DOUBLE PRECISION NOT NULL,
    "world_lng" DOUBLE PRECISION NOT NULL,
    "source_image_width" INTEGER,
    "source_image_height" INTEGER,
    "crop_width_px" INTEGER,
    "crop_height_px" INTEGER,
    "status" "task_attempt_status" NOT NULL,
    "verdict" "task_attempt_verdict",
    "confidence" DOUBLE PRECISION,
    "reason" TEXT,
    "source" TEXT,
    "user_id" TEXT NOT NULL,
    "game_task_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_tasks_external_id_key" ON "game_tasks"("external_id");

-- CreateIndex
CREATE INDEX "task_attempts_user_id_created_at_idx" ON "task_attempts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "task_attempts_game_task_id_created_at_idx" ON "task_attempts"("game_task_id", "created_at");

-- AddForeignKey
ALTER TABLE "task_attempts" ADD CONSTRAINT "task_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attempts" ADD CONSTRAINT "task_attempts_game_task_id_fkey" FOREIGN KEY ("game_task_id") REFERENCES "game_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
