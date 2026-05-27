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
    tasks: GameTask[];
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
