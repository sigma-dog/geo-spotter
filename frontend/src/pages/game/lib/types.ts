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
    imageId: string;
    spot: {
        id: string;
        target: string;
        title: string;
    };
    viewerSelection: {
        normalized: {
            height: number;
            left: number;
            top: number;
            width: number;
        };
        pixels: SelectionBox;
    };
    worldLocation: GameLocation;
};
