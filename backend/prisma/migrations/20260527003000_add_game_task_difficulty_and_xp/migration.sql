-- AlterTable
ALTER TABLE "game_tasks"
ADD COLUMN "difficulty" "difficulty_enum" NOT NULL DEFAULT 'EASY',
ADD COLUMN "xp_reward" INTEGER NOT NULL DEFAULT 0;
