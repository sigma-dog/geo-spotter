export type VerificationVerdict = 'match' | 'no_match' | 'uncertain';

export type VerificationResponse = {
    attemptId: string;
    awardedXp?: number;
    confidence: number;
    currentLevel?: number;
    currentXp?: number;
    debug?: Record<string, unknown> | null;
    reason: string;
    source: 'mock' | 'ai';
    verdict: VerificationVerdict;
    sessionCompleted?: boolean;
    taskCompleted?: boolean;
};

export type VerificationProgressStage =
    | 'started'
    | 'preparing_asset'
    | 'sending_to_ai'
    | 'awaiting_ai_result'
    | 'applying_result'
    | 'syncing_session'
    | 'completed'
    | 'failed'
    | 'fallback_mock';

export type VerificationProgressEvent = {
    attemptId: string | null;
    message: string;
    progress: number;
    sessionId: string;
    sessionTaskId: string;
    stage: VerificationProgressStage;
};

export type PreparedSelectionAsset = {
    cropBuffer: Buffer;
    cropHeightPx: number;
    cropLeftPx: number;
    cropTopPx: number;
    cropWidthPx: number;
    imageUrl: string;
    sourceImageBuffer: Buffer;
    sourceImageHeight: number;
    sourceImagePngBuffer: Buffer;
    sourceImageWidth: number;
};

export type AiVerificationRequest = {
    attemptId: string;
    image: {
        cropBase64: string;
        cropHeightPx: number;
        cropMimeType: 'image/png';
        cropWidthPx: number;
        sourceImageHeight: number;
        sourceImageUrl: string;
        sourceImageWidth: number;
    };
    task: {
        id: string;
        target: string;
        title: string;
    };
};

export type AiVerificationResponse = Omit<VerificationResponse, 'attemptId'>;

export type GameSessionTaskView = {
    id: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY';
    title: string;
    description: string | null;
    target: string;
    orderIndex: number;
    status: 'PENDING' | 'COMPLETED';
    completedAt: string | null;
    xpReward: number;
};

export type MultiplayerPlayerProgressView = {
    avatarUrl: string | null;
    completedTasksCount: number;
    isCurrentUser: boolean;
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
    totalTasksCount: number;
    userId: string;
    username: string;
};

export type MultiplayerLobbyParticipantView = {
    avatarUrl: string | null;
    isHost: boolean;
    isCurrentUser: boolean;
    respondedAt: string | null;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    userId: string;
    username: string;
};

export type MultiplayerLobbyView = {
    createdAt: string;
    hostUserId: string;
    id: string;
    matchId: string | null;
    participants: MultiplayerLobbyParticipantView[];
    status: 'PENDING' | 'STARTED' | 'CANCELLED';
};

export type GameSessionView = {
    awardedXp: number;
    id: string;
    mode: 'SOLO' | 'MULTIPLAYER';
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
    startedAt: string;
    expiresAt: string | null;
    finishedAt: string | null;
    completedTasksCount: number;
    totalTasksCount: number;
    attemptsCount: number;
    multiplayerMatchId: string | null;
    winnerUserId: string | null;
    winnerUsername: string | null;
    players: MultiplayerPlayerProgressView[];
    tasks: GameSessionTaskView[];
};
