import type { GameSessionView } from './game.types';

export type StoredGameSession = GameSessionView & {
    expiresAt: string;
    userId: string;
};
