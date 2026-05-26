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

export type GameSessionView = {
    awardedXp: number;
    id: string;
    mode: 'SOLO' | 'MULTIPLAYER';
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
    startedAt: string;
    finishedAt: string | null;
    completedTasksCount: number;
    totalTasksCount: number;
    attemptsCount: number;
    tasks: GameSessionTaskView[];
};
