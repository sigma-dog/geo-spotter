import type React from 'react';
import { useMemo } from 'react';
import { LuCheck, LuSend, LuX, LuX as LuXIcon } from 'react-icons/lu';
import {
    Box,
    Button,
    createListCollection,
    HStack,
    Portal,
    Progress,
    Select,
    Text,
    VStack,
} from '@chakra-ui/react';
import { Spoiler } from 'spoiled';

import type {
    GameTask,
    SelectionBox,
    SelectionPayload,
    SelectionVerificationResult,
    VerificationProgressEvent,
} from '../lib/types';

type ViewerSelectionLayerProps = {
    draftSelection: SelectionBox | null;
    isInteractive: boolean;
    isSubmittingSelection: boolean;
    selectedTaskId: string | null;
    selectionPayload: SelectionPayload | null;
    selectionResult: SelectionVerificationResult | null;
    selectionLayerRef: React.RefObject<HTMLDivElement | null>;
    taskOptions: GameTask[];
    verificationProgress: VerificationProgressEvent | null;
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
    selectionResult,
    selectionLayerRef,
    taskOptions,
    verificationProgress,
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
    const displayedProgress = useMemo(() => {
        if (!isSubmittingSelection) {
            return null;
        }

        return verificationProgress ?? null;
    }, [isSubmittingSelection, verificationProgress]);
    const resultTone = useMemo(() => {
        if (!selectionResult) {
            return null;
        }

        if (selectionResult.verdict === 'match') {
            return {
                borderColor: 'green.400',
                glow: '0 0 0 9999px rgba(10, 20, 14, 0.46)',
                icon: LuCheck,
                iconBg: 'green.500',
                panelBg: 'rgba(8, 28, 16, 0.82)',
                title: 'Объект успешно распознан',
                titleColor: 'green.100',
            };
        }

        if (selectionResult.verdict === 'no_match') {
            return {
                borderColor: 'red.400',
                glow: '0 0 0 9999px rgba(24, 10, 10, 0.5)',
                icon: LuXIcon,
                iconBg: 'red.500',
                panelBg: 'rgba(33, 12, 12, 0.84)',
                title: 'Не удалось распознать объект',
                titleColor: 'red.100',
            };
        }

        return {
            borderColor: 'orange.300',
            glow: '0 0 0 9999px rgba(28, 20, 8, 0.48)',
            icon: LuXIcon,
            iconBg: 'orange.400',
            panelBg: 'rgba(36, 22, 6, 0.84)',
            title: 'Нужна дополнительная проверка',
            titleColor: 'orange.50',
        };
    }, [selectionResult]);

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
                        borderColor={resultTone?.borderColor ?? 'red.300'}
                        boxShadow={
                            resultTone?.glow ??
                            '0 0 0 9999px rgba(0, 0, 0, 0.428)'
                        }
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
                                <VStack
                                    position="absolute"
                                    insetInline={3}
                                    bottom={3}
                                    align="stretch"
                                    gap={2}
                                >
                                    <Text
                                        fontSize="xs"
                                        fontWeight="700"
                                        color="white"
                                        textShadow="0 1px 8px rgba(0, 0, 0, 0.45)"
                                    >
                                        {displayedProgress?.message ??
                                            'Отправляем объект на проверку...'}
                                    </Text>
                                    <Progress.Root
                                        value={displayedProgress?.progress ?? 5}
                                        max={100}
                                        size="sm"
                                        colorPalette="red"
                                        variant="subtle"
                                        borderRadius="full"
                                    >
                                        <Progress.Track bg="whiteAlpha.300">
                                            <Progress.Range />
                                        </Progress.Track>
                                    </Progress.Root>
                                </VStack>
                            </Box>
                        )}
                        {!isSubmittingSelection &&
                            selectionResult &&
                            resultTone && (
                                <VStack
                                    position="absolute"
                                    inset={0}
                                    justify="center"
                                    align="center"
                                    gap={3}
                                    px={4}
                                    textAlign="center"
                                    bg={resultTone.panelBg}
                                    pointerEvents="none"
                                >
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        w="52px"
                                        h="52px"
                                        borderRadius="full"
                                        bg={resultTone.iconBg}
                                        color="white"
                                        boxShadow="lg"
                                    >
                                        <resultTone.icon size={28} />
                                    </Box>
                                    <VStack gap={1}>
                                        <Text
                                            fontSize="sm"
                                            fontWeight="800"
                                            color={resultTone.titleColor}
                                            textShadow="0 1px 10px rgba(0, 0, 0, 0.35)"
                                        >
                                            {resultTone.title}
                                        </Text>
                                        <Text
                                            fontSize="xs"
                                            color="whiteAlpha.900"
                                            maxW="240px"
                                        >
                                            {selectionResult.reason}
                                        </Text>
                                    </VStack>
                                </VStack>
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
                            {selectionResult && (
                                <HStack
                                    px={3}
                                    py={2}
                                    borderRadius="lg"
                                    bg="blackAlpha.800"
                                    color="white"
                                    align="flex-start"
                                >
                                    <Text fontSize="xs" color="whiteAlpha.800">
                                        Уверенность:
                                    </Text>
                                    <Text fontSize="xs" fontWeight="700">
                                        {Math.round(
                                            selectionResult.confidence * 100
                                        )}
                                        %
                                    </Text>
                                </HStack>
                            )}
                        </VStack>
                    )}
                </>
            )}
        </Box>
    );
};
