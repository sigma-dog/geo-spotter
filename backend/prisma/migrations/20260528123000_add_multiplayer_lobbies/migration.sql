-- CreateEnum
CREATE TYPE "multiplayer_lobby_status" AS ENUM ('PENDING', 'STARTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "multiplayer_lobby_participant_status" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "multiplayer_lobbies" (
    "id" TEXT NOT NULL,
    "status" "multiplayer_lobby_status" NOT NULL,
    "host_id" TEXT NOT NULL,
    "match_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "multiplayer_lobbies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multiplayer_lobby_participants" (
    "id" TEXT NOT NULL,
    "status" "multiplayer_lobby_participant_status" NOT NULL,
    "responded_at" TIMESTAMP(3),
    "lobby_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "multiplayer_lobby_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "multiplayer_lobbies_match_id_key" ON "multiplayer_lobbies"("match_id");

-- CreateIndex
CREATE INDEX "multiplayer_lobbies_host_id_status_idx" ON "multiplayer_lobbies"("host_id", "status");

-- CreateIndex
CREATE INDEX "multiplayer_lobby_participants_user_id_status_idx" ON "multiplayer_lobby_participants"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "multiplayer_lobby_participants_lobby_id_user_id_key" ON "multiplayer_lobby_participants"("lobby_id", "user_id");

-- AddForeignKey
ALTER TABLE "multiplayer_lobbies"
ADD CONSTRAINT "multiplayer_lobbies_host_id_fkey"
FOREIGN KEY ("host_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multiplayer_lobbies"
ADD CONSTRAINT "multiplayer_lobbies_match_id_fkey"
FOREIGN KEY ("match_id") REFERENCES "multiplayer_matches"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multiplayer_lobby_participants"
ADD CONSTRAINT "multiplayer_lobby_participants_lobby_id_fkey"
FOREIGN KEY ("lobby_id") REFERENCES "multiplayer_lobbies"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multiplayer_lobby_participants"
ADD CONSTRAINT "multiplayer_lobby_participants_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
