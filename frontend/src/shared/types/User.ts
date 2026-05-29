import type { TypeOrNull } from './utility';

export type User = {
    id: string;
    username: string;
    birthDate: string;
    avatarUrl: TypeOrNull<string>;
    email: string;
    level: number;
    xp: number;
    isFriendRequestSent?: boolean;
};
