import { LuCheck, LuSparkles } from 'react-icons/lu';
import { Box, Heading, HStack, Spinner, Text, VStack } from '@chakra-ui/react';

import type {
    SelectionPayloadDraft,
    SelectionVerificationResult,
    ViewerState,
} from '../lib/types';

type ViewerStatusOverlayProps = {
    selectionDraft: SelectionPayloadDraft | null;
    selectionResult: SelectionVerificationResult | null;
    isSubmittingSelection: boolean;
    state: ViewerState;
};

export const ViewerStatusOverlay = ({
    selectionDraft,
    selectionResult,
    isSubmittingSelection,
    state,
}: ViewerStatusOverlayProps) => {
    if (state.status !== 'ready') {
        return (
            <VStack
                position="absolute"
                inset={0}
                zIndex={3}
                justify="center"
                px={6}
                textAlign="center"
                bg="blackAlpha.600"
                color="white"
            >
                {state.isLoading && <Spinner size="xl" />}
                <Heading size="md">
                    {state.status === 'error'
                        ? 'Viewer пока не открылся'
                        : 'Поднимаем сцену'}
                </Heading>
                <Text maxW="560px" color="gray.200">
                    {state.message}
                </Text>
            </VStack>
        );
    }

    return (
        <Box position="absolute" right={4} bottom={4} zIndex={3} maxW="420px">
            <Box p={4} borderRadius="xl" bg="blackAlpha.700" color="white">
                <HStack gap={2}>
                    <LuSparkles />
                    <Text fontWeight="600">Mapillary viewer</Text>
                </HStack>
                <Text>{state.message}</Text>
                {!selectionDraft && (
                    <Text mt={2} color="red.200" fontSize="sm">
                        Включи режим выделения и обведи объект рамкой.
                    </Text>
                )}
                {selectionDraft && (
                    <VStack mt={2} align="stretch" gap={1}>
                        <HStack gap={2} color="red.200">
                            <LuCheck />
                            <Text fontSize="sm" fontWeight="600">
                                Рамка готова к отправке
                            </Text>
                        </HStack>
                        <Text color="red.200">
                            {Math.round(selectionDraft.pixels.width)} x{' '}
                            {Math.round(selectionDraft.pixels.height)} px
                        </Text>
                    </VStack>
                )}
                {isSubmittingSelection && (
                    <HStack mt={3} gap={2} color="yellow.200">
                        <Spinner size="sm" />
                        <Text fontSize="sm">
                            Проверяем выделенный объект на сервере...
                        </Text>
                    </HStack>
                )}
                {selectionResult && (
                    <VStack mt={3} align="stretch" gap={1}>
                        <Text
                            fontSize="sm"
                            fontWeight="700"
                            color={
                                selectionResult.verdict === 'match'
                                    ? 'green.200'
                                    : selectionResult.verdict === 'no_match'
                                      ? 'red.200'
                                      : 'yellow.200'
                            }
                        >
                            {selectionResult.verdict === 'match'
                                ? 'Совпадение подтверждено'
                                : selectionResult.verdict === 'no_match'
                                  ? 'Объект не засчитан'
                                  : 'Нужна дополнительная проверка'}
                        </Text>
                        <Text fontSize="sm" color="whiteAlpha.900">
                            Уверенность:{' '}
                            {Math.round(selectionResult.confidence * 100)}%
                        </Text>
                        <Text fontSize="sm" color="whiteAlpha.800">
                            {selectionResult.reason}
                        </Text>
                    </VStack>
                )}
            </Box>
        </Box>
    );
};
