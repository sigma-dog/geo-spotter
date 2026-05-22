export type VerificationVerdict = 'match' | 'no_match' | 'uncertain';

export type VerificationResponse = {
    attemptId: string;
    confidence: number;
    debug?: Record<string, unknown> | null;
    reason: string;
    source: 'mock' | 'ai';
    verdict: VerificationVerdict;
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
