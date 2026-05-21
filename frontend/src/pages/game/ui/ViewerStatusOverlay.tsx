import { LuCheck, LuSparkles } from 'react-icons/lu';
import { Box, Heading, HStack, Spinner, Text, VStack } from '@chakra-ui/react';

import type { SelectionPayload, ViewerState } from '../lib/types';

type ViewerStatusOverlayProps = {
    selectionPayload: SelectionPayload | null;
    state: ViewerState;
};

export const ViewerStatusOverlay = ({
    selectionPayload,
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
                {!selectionPayload && (
                    <Text mt={2} color="red.200" fontSize="sm">
                        Включи режим выделения и обведи объект рамкой.
                    </Text>
                )}
                {selectionPayload && (
                    <VStack mt={2} align="stretch" gap={1}>
                        <HStack gap={2} color="red.200">
                            <LuCheck />
                            <Text fontSize="sm" fontWeight="600">
                                Рамка готова к отправке
                            </Text>
                        </HStack>
                        <Text color="red.200">
                            {Math.round(
                                selectionPayload.viewerSelection.pixels.width
                            )}{' '}
                            x{' '}
                            {Math.round(
                                selectionPayload.viewerSelection.pixels.height
                            )}{' '}
                            px
                        </Text>
                    </VStack>
                )}
            </Box>
        </Box>
    );
};
