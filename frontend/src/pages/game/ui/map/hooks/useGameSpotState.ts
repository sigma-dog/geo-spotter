import { useCallback, useState } from 'react';

import type { GameLocation } from '../../../lib/types';

export const useGameSpotState = () => {
    const [selectedLocation, setSelectedLocation] =
        useState<GameLocation | null>(null);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

    const selectLocation = useCallback((location: GameLocation) => {
        setSelectedLocation(location);
        setSelectedImageId(null);
    }, []);

    const selectScene = useCallback(
        (location: GameLocation, imageId: string) => {
            setSelectedLocation(location);
            setSelectedImageId(imageId);
        },
        []
    );

    const resetSelectedSpot = useCallback(() => {
        setSelectedLocation(null);
        setSelectedImageId(null);
    }, []);

    return {
        hasSelectedSpot: !!selectedLocation || !!selectedImageId,
        resetSelectedSpot,
        selectedImageId,
        selectedLocation,
        selectLocation,
        selectScene,
    };
};
