export type SelectionPoint = {
    x: number;
    y: number;
};

export type GameLocation = {
    lat: number;
    lng: number;
};

export type GameTask = {
    id: string;
    title: string;
    description: string | null;
    target: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY';
    orderIndex?: number;
    status?: 'PENDING' | 'COMPLETED';
    completedAt?: string | null;
    xpReward?: number;
};

export type GameSession = {
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
    players: MultiplayerPlayerProgress[];
    tasks: GameTask[];
};

export type MultiplayerPlayerProgress = {
    avatarUrl: string | null;
    attemptsCount: number;
    completedTasksCount: number;
    isCurrentUser: boolean;
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
    totalTasksCount: number;
    userId: string;
    username: string;
};

export type ViewerState = {
    imageId: string | null;
    imageThumbUrl: string | null;
    isLoading: boolean;
    panoramaAddress: string | null;
    panoramaLocation: GameLocation | null;
    message: string;
    status: 'idle' | 'loading' | 'ready' | 'error';
};

export type SelectionBox = {
    height: number;
    left: number;
    top: number;
    width: number;
};

export type SelectionPayload = {
    sessionId: string;
    sessionTaskId: string;
    capturedAt: string;
    debugInfo?: {
        basicCorners?: Array<{
            x: number;
            y: number;
        }>;
        basicSamplePoints?: Array<{
            x: number;
            y: number;
        }>;
        canvasBounds?: {
            height: number;
            width: number;
        };
        canvasSamplePoints?: Array<{
            x: number;
            y: number;
        }>;
        canvasPixels?: {
            height: number;
            width: number;
        };
        canvasSelectionCorners?: Array<{
            x: number;
            y: number;
        }>;
        overlaySelectionPixels?: SelectionBox;
        overlayBounds?: {
            height: number;
            left: number;
            top: number;
            width: number;
        };
        scale?: {
            x: number;
            y: number;
        };
        sampleGrid?: {
            columns: number;
            rows: number;
        };
        viewportCapture?: {
            height: number;
            source: 'viewer-canvas';
            width: number;
        };
    };
    imageId: string;
    imageThumbUrl?: string | null;
    sourceImageBase64?: string | null;
    task: {
        id: string;
        target: string;
        title: string;
    };
    selection: {
        height: number;
        left: number;
        top: number;
        width: number;
    };
    worldLocation: GameLocation;
};

export type SelectionPayloadDraft = {
    layerBounds: {
        height: number;
        left: number;
        top: number;
        width: number;
    };
    pixels: SelectionBox;
    normalized: SelectionPayload['selection'];
};

export type SelectionVerificationVerdict = 'match' | 'no_match' | 'uncertain';

export type SelectionVerificationResult = {
    attemptId: string;
    awardedXp?: number;
    confidence: number;
    currentLevel?: number;
    currentXp?: number;
    reason: string;
    sessionCompleted?: boolean;
    source: 'mock' | 'ai';
    taskCompleted?: boolean;
    verdict: SelectionVerificationVerdict;
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

export type MultiplayerSessionStartedEvent = {
    lobbyId?: string;
    matchId: string;
    startedAt: string;
};

export type MultiplayerProgressUpdatedEvent = {
    matchId: string;
    players: MultiplayerPlayerProgress[];
    sessionId: string;
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
    winnerUserId: string | null;
    winnerUsername: string | null;
};

export type MultiplayerLobbyParticipant = {
    avatarUrl: string | null;
    isCurrentUser: boolean;
    isHost: boolean;
    respondedAt: string | null;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    userId: string;
    username: string;
};

export type MultiplayerLobby = {
    createdAt: string;
    hostUserId: string;
    id: string;
    matchId: string | null;
    participants: MultiplayerLobbyParticipant[];
    status: 'PENDING' | 'STARTED' | 'CANCELLED';
};

export type MultiplayerLobbyEvent = {
    lobby: MultiplayerLobby;
};
