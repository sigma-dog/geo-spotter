import type React from 'react';
import { useCallback, useRef, useState } from 'react';

import type {
    GameLocation,
    MockPanoramaSpot,
    SelectionBox,
    SelectionPayload,
    SelectionPoint,
} from '../../../lib/types';
import { createSelectionBox } from '../utils';

interface UseViewerSelectionStateParams {
    activeSpot: MockPanoramaSpot;
    canDrawSelection: boolean;
    imageId: string | null;
    selectedLocation: GameLocation | null;
}

export const useViewerSelectionState = ({
    activeSpot,
    canDrawSelection,
    imageId,
    selectedLocation,
}: UseViewerSelectionStateParams) => {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectionStartPoint, setSelectionStartPoint] =
        useState<SelectionPoint | null>(null);
    const [draftSelection, setDraftSelection] = useState<SelectionBox | null>(
        null
    );
    const [selectionPayload, setSelectionPayload] =
        useState<SelectionPayload | null>(null);
    const selectionLayerRef = useRef<HTMLDivElement | null>(null);

    const resetSelection = useCallback(() => {
        setSelectionStartPoint(null);
        setDraftSelection(null);
        setSelectionPayload(null);
    }, []);

    const toggleSelectionMode = useCallback(() => {
        setIsSelectionMode((currentState) => {
            const nextState = !currentState;

            if (!nextState) {
                setSelectionStartPoint(null);
                setDraftSelection(null);
                setSelectionPayload(null);
            }

            return nextState;
        });
    }, []);

    const getRelativePointerPoint = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        const layer = selectionLayerRef.current;

        if (!layer) {
            return null;
        }

        const bounds = layer.getBoundingClientRect();

        return {
            x: Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width),
            y: Math.min(Math.max(event.clientY - bounds.top, 0), bounds.height),
        };
    };

    const handleSelectionPointerDown = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        if (!isSelectionMode || !canDrawSelection) {
            return;
        }

        const point = getRelativePointerPoint(event);

        if (!point) {
            return;
        }

        event.preventDefault();
        setSelectionPayload(null);
        setSelectionStartPoint(point);
        setDraftSelection({
            left: point.x,
            top: point.y,
            width: 0,
            height: 0,
        });
    };

    const handleSelectionPointerMove = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        if (!selectionStartPoint) {
            return;
        }

        const point = getRelativePointerPoint(event);

        if (!point) {
            return;
        }

        event.preventDefault();
        setDraftSelection(createSelectionBox(selectionStartPoint, point));
    };

    const handleSelectionPointerUp = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        if (!selectionStartPoint || !imageId || !selectedLocation) {
            return;
        }

        const point = getRelativePointerPoint(event);
        const layer = selectionLayerRef.current;

        if (!point || !layer) {
            setSelectionStartPoint(null);
            return;
        }

        event.preventDefault();

        const nextSelection = createSelectionBox(selectionStartPoint, point);
        const isTooSmall =
            nextSelection.width < 12 || nextSelection.height < 12;

        setSelectionStartPoint(null);

        if (isTooSmall) {
            setDraftSelection(null);
            setSelectionPayload(null);
            return;
        }

        setDraftSelection(nextSelection);
        setSelectionPayload({
            capturedAt: new Date().toISOString(),
            imageId,
            spot: {
                id: activeSpot.id,
                title: activeSpot.title,
                target: activeSpot.target,
            },
            viewerSelection: {
                pixels: nextSelection,
                normalized: {
                    left: nextSelection.left / layer.clientWidth,
                    top: nextSelection.top / layer.clientHeight,
                    width: nextSelection.width / layer.clientWidth,
                    height: nextSelection.height / layer.clientHeight,
                },
            },
            worldLocation: selectedLocation,
        });
    };

    const submitSelection = useCallback(() => {
        if (!selectionPayload) {
            return;
        }

        console.info('Selected viewer fragment payload', selectionPayload);
    }, [selectionPayload]);

    return {
        draftSelection,
        handleSelectionPointerDown,
        handleSelectionPointerMove,
        handleSelectionPointerUp,
        isSelectionMode,
        resetSelection,
        selectionLayerRef,
        selectionPayload,
        submitSelection,
        toggleSelectionMode,
    };
};
