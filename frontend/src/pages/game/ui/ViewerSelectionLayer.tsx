import type React from 'react';
import { LuSend, LuX } from 'react-icons/lu';
import {
    Box,
    Button,
    createListCollection,
    Portal,
    Select,
    Text,
    VStack,
} from '@chakra-ui/react';
import { Spoiler } from 'spoiled';

import type { GameTask, SelectionBox, SelectionPayload } from '../lib/types';

type ViewerSelectionLayerProps = {
    draftSelection: SelectionBox | null;
    isInteractive: boolean;
    isSubmittingSelection: boolean;
    selectedTaskId: string | null;
    selectionPayload: SelectionPayload | null;
    selectionLayerRef: React.RefObject<HTMLDivElement | null>;
    taskOptions: GameTask[];
    onChangeTask: (taskId: string) => void;
    onResetSelection: () => void;
    onSubmitSelection: () => void;
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
};

export const ViewerSelectionLayer = ({
    draftSelection,
    isInteractive,
    isSubmittingSelection,
    selectedTaskId,
    selectionPayload,
    selectionLayerRef,
    taskOptions,
    onChangeTask,
    onResetSelection,
    onSubmitSelection,
    onPointerDown,
    onPointerMove,
    onPointerUp,
}: ViewerSelectionLayerProps) => {
    const stopPointerPropagation = (event: React.PointerEvent<HTMLElement>) => {
        event.stopPropagation();
    };
    const taskCollection = createListCollection({
        items: taskOptions.map((task) => ({
            label: task.title,
            value: task.id,
        })),
    });

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
                        overflow="hidden"
                        borderWidth="2px"
                        borderColor="red.300"
                        boxShadow="0 0 0 9999px rgba(0, 0, 0, 0.428)"
                    >
                        {isSubmittingSelection && (
                            <Box
                                position="absolute"
                                inset={0}
                                borderRadius="inherit"
                                bg="rgba(14, 18, 26, 0.58)"
                                backdropFilter="auto"
                                backdropBlur="18px"
                                backdropSaturate="0.62"
                                pointerEvents="none"
                            >
                                <Spoiler
                                    asChild
                                    hidden
                                    revealOn={false}
                                    transition={false}
                                    theme="dark"
                                    fps={18}
                                    density={0.14}
                                    noiseFadeDuration={0.18}
                                    accentColor={[
                                        'rgba(255, 255, 255, 0.92)',
                                        'rgba(255, 255, 255, 0.92)',
                                    ]}
                                >
                                    <Box
                                        position="absolute"
                                        inset={0}
                                        borderRadius="inherit"
                                        bg="rgba(255, 255, 255, 0.04)"
                                        opacity={0.92}
                                    />
                                </Spoiler>
                            </Box>
                        )}
                    </Box>
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
                            disabled={isSubmittingSelection}
                            onPointerDown={stopPointerPropagation}
                            onPointerUp={stopPointerPropagation}
                            onClick={onResetSelection}
                        >
                            <LuX />
                            Сбросить рамку
                        </Button>
                    )}

                    {selectionPayload && (
                        <VStack
                            position="absolute"
                            left={`${draftSelection.left}px`}
                            top={`${draftSelection.top + draftSelection.height + 12}px`}
                            zIndex={4}
                            align="stretch"
                            gap={2}
                            maxW="280px"
                            pointerEvents="auto"
                            onPointerDown={stopPointerPropagation}
                            onPointerUp={stopPointerPropagation}
                        >
                            <Box
                                px={3}
                                py={2}
                                borderRadius="lg"
                                bg="white"
                                boxShadow="lg"
                            >
                                <Text mb={1} fontSize="xs" color="gray.500">
                                    Какое задание проверяем?
                                </Text>
                                <Select.Root
                                    collection={taskCollection}
                                    size="sm"
                                    width="100%"
                                    positioning={{ sameWidth: true }}
                                    value={
                                        selectedTaskId ? [selectedTaskId] : []
                                    }
                                    onValueChange={({ value }) =>
                                        onChangeTask(value[0] ?? '')
                                    }
                                >
                                    <Select.HiddenSelect />
                                    <Select.Control>
                                        <Select.Trigger>
                                            <Select.ValueText placeholder="Выбери задание" />
                                        </Select.Trigger>
                                    </Select.Control>
                                    <Portal>
                                        <Select.Positioner>
                                            <Select.Content>
                                                {taskCollection.items.map(
                                                    (task) => (
                                                        <Select.Item
                                                            key={task.value}
                                                            item={task}
                                                        >
                                                            <Select.ItemText>
                                                                {task.label}
                                                            </Select.ItemText>
                                                            <Select.ItemIndicator />
                                                        </Select.Item>
                                                    )
                                                )}
                                            </Select.Content>
                                        </Select.Positioner>
                                    </Portal>
                                </Select.Root>
                            </Box>
                            <Button
                                size="sm"
                                colorPalette="red"
                                loading={isSubmittingSelection}
                                disabled={isSubmittingSelection}
                                onClick={onSubmitSelection}
                            >
                                <LuSend />
                                Проверить выделение
                            </Button>
                        </VStack>
                    )}
                </>
            )}
        </Box>
    );
};
