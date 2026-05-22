export type SelectionPoint = {
    x: number;
    y: number;
};

export type GameLocation = {
    lat: number;
    lng: number;
};

export type MockPanoramaSpot = {
    id: string;
    title: string;
    description: string;
    target: string;
    location: GameLocation;
};

export type ViewerState = {
    imageId: string | null;
    imageThumbUrl: string | null;
    isLoading: boolean;
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
    confidence: number;
    reason: string;
    source: 'mock' | 'ai';
    verdict: SelectionVerificationVerdict;
};
