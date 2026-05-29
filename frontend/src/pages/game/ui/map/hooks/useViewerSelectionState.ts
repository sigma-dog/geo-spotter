import type React from 'react';
import { useCallback, useRef, useState } from 'react';

import type {
    GameLocation,
    GameTask,
    SelectionBox,
    SelectionPayload,
    SelectionPayloadDraft,
    SelectionPoint,
} from '../../../lib/types';
import { createSelectionBox } from '../utils';

interface UseViewerSelectionStateParams {
    canDrawSelection: boolean;
    imageId: string | null;
    imageThumbUrl?: string | null;
    onClearFeedback?: () => void;
    onSubmitSelection?: (
        selectionPayload: SelectionPayload,
        selectionDraft: SelectionPayloadDraft
    ) => void;
    sessionId: string | null;
    selectedLocation: GameLocation | null;
    task: GameTask | null;
}

export const useViewerSelectionState = ({
    canDrawSelection,
    imageId,
    imageThumbUrl,
    onClearFeedback,
    onSubmitSelection,
    sessionId,
    selectedLocation,
    task,
}: UseViewerSelectionStateParams) => {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectionStartPoint, setSelectionStartPoint] =
        useState<SelectionPoint | null>(null);
    const [draftSelection, setDraftSelection] = useState<SelectionBox | null>(
        null
    );
    const [selectionPayload, setSelectionPayload] =
        useState<SelectionPayload | null>(null);
    const [selectionDraft, setSelectionDraft] =
        useState<SelectionPayloadDraft | null>(null);
    const selectionLayerRef = useRef<HTMLDivElement | null>(null);

    const resetSelection = useCallback(() => {
        onClearFeedback?.();
        setSelectionStartPoint(null);
        setDraftSelection(null);
        setSelectionDraft(null);
        setSelectionPayload(null);
    }, [onClearFeedback]);

    const toggleSelectionMode = useCallback(() => {
        setIsSelectionMode((currentState) => {
            const nextState = !currentState;

            if (!nextState) {
                onClearFeedback?.();
                setSelectionStartPoint(null);
                setDraftSelection(null);
                setSelectionDraft(null);
                setSelectionPayload(null);
            }

            return nextState;
        });
    }, [onClearFeedback]);

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
        onClearFeedback?.();
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
        if (
            !selectionStartPoint ||
            !imageId ||
            !selectedLocation ||
            !task ||
            !sessionId
        ) {
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
            imageThumbUrl,
            sessionId,
            sessionTaskId: task.id,
            task: {
                id: task.id,
                title: task.title,
                target: task.target,
            },
            selection: {
                left: nextSelection.left / layer.clientWidth,
                top: nextSelection.top / layer.clientHeight,
                width: nextSelection.width / layer.clientWidth,
                height: nextSelection.height / layer.clientHeight,
            },
            worldLocation: selectedLocation,
        });
        setSelectionDraft({
            layerBounds: {
                height: layer.getBoundingClientRect().height,
                left: layer.getBoundingClientRect().left,
                top: layer.getBoundingClientRect().top,
                width: layer.getBoundingClientRect().width,
            },
            pixels: nextSelection,
            normalized: {
                left: nextSelection.left / layer.clientWidth,
                top: nextSelection.top / layer.clientHeight,
                width: nextSelection.width / layer.clientWidth,
                height: nextSelection.height / layer.clientHeight,
            },
        });
    };

    const submitSelection = useCallback(() => {
        if (!selectionPayload) {
            console.warn('submitSelection skipped: no selectionPayload');
            return;
        }

        if (!selectionDraft) {
            console.warn('submitSelection skipped: no selectionDraft');
            return;
        }

        console.info('submitSelection triggered', selectionPayload);
        onSubmitSelection?.(selectionPayload, selectionDraft);
    }, [onSubmitSelection, selectionDraft, selectionPayload]);

    return {
        draftSelection,
        handleSelectionPointerDown,
        handleSelectionPointerMove,
        handleSelectionPointerUp,
        isSelectionMode,
        resetSelection,
        selectionDraft,
        selectionLayerRef,
        selectionPayload,
        submitSelection,
        toggleSelectionMode,
    };
};
