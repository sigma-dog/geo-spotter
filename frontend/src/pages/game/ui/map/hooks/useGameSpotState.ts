import { useCallback, useMemo, useState } from 'react';

import type { GameLocation, MockPanoramaSpot } from '../../../lib/types';

export const useGameSpotState = (spots: MockPanoramaSpot[]) => {
    const [activeSpotId, setActiveSpotId] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] =
        useState<GameLocation | null>(null);

    const activeSpot = useMemo(
        () => spots.find((spot) => spot.id === activeSpotId) ?? spots[0],
        [activeSpotId, spots]
    );

    const selectSpot = useCallback((spot: MockPanoramaSpot) => {
        setActiveSpotId(spot.id);
        setSelectedLocation(spot.location);
    }, []);

    const selectLocation = useCallback((location: GameLocation) => {
        setSelectedLocation(location);
    }, []);

    const resetSelectedSpot = useCallback(() => {
        setActiveSpotId(null);
        setSelectedLocation(null);
    }, []);

    return {
        activeSpot,
        activeSpotId,
        hasSelectedSpot: !!selectedLocation,
        resetSelectedSpot,
        selectedLocation,
        selectLocation,
        selectSpot,
    };
};
