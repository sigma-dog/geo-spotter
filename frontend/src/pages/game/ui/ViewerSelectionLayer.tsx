import type React from 'react';
import { LuSend, LuX } from 'react-icons/lu';
import { Box, Button } from '@chakra-ui/react';

import type { SelectionBox, SelectionPayload } from '../lib/types';

type ViewerSelectionLayerProps = {
    draftSelection: SelectionBox | null;
    isInteractive: boolean;
    selectionPayload: SelectionPayload | null;
    selectionLayerRef: React.RefObject<HTMLDivElement | null>;
    onResetSelection: () => void;
    onSubmitSelection: () => void;
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
};

export const ViewerSelectionLayer = ({
    draftSelection,
    isInteractive,
    selectionPayload,
    selectionLayerRef,
    onResetSelection,
    onSubmitSelection,
    onPointerDown,
    onPointerMove,
    onPointerUp,
}: ViewerSelectionLayerProps) => {
    const stopPointerPropagation = (
        event: React.PointerEvent<HTMLButtonElement>
    ) => {
        event.stopPropagation();
    };

    return (
        <Box
            ref={selectionLayerRef}
            position="absolute"
            inset={0}
            zIndex={2}
            cursor={isInteractive ? 'crosshair' : 'default'}
            pointerEvents={isInteractive ? 'auto' : 'none'}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
        >
            {draftSelection && (
                <>
                    <Box
                        position="absolute"
                        left={`${draftSelection.left}px`}
                        top={`${draftSelection.top}px`}
                        w={`${draftSelection.width}px`}
                        h={`${draftSelection.height}px`}
                        borderWidth="2px"
                        borderColor="red.300"
                        boxShadow="0 0 0 9999px rgba(0, 0, 0, 0.428)"
                    />
                    {selectionPayload && (
                        <Button
                            position="absolute"
                            right="auto"
                            left={`${draftSelection.left + draftSelection.width}px`}
                            top={`${draftSelection.top - 12}px`}
                            transform="translate(-100%, -100%)"
                            zIndex={4}
                            // minW="32px"
                            // h="32px"
                            pointerEvents="auto"
                            onPointerDown={stopPointerPropagation}
                            onPointerUp={stopPointerPropagation}
                            onClick={onResetSelection}
                        >
                            <LuX />
                            Сбросить рамку
                        </Button>
                    )}

                    {selectionPayload && (
                        <Button
                            position="absolute"
                            left={`${draftSelection.left}px`}
                            top={`${draftSelection.top + draftSelection.height + 12}px`}
                            zIndex={4}
                            size="sm"
                            colorPalette="red"
                            pointerEvents="auto"
                            onPointerDown={stopPointerPropagation}
                            onPointerUp={stopPointerPropagation}
                            onClick={onSubmitSelection}
                        >
                            <LuSend />
                            Отправить фрагмент
                        </Button>
                    )}
                </>
            )}
        </Box>
    );
};
