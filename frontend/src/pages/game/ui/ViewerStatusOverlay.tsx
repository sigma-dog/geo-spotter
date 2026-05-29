import { Heading, Spinner, Text, VStack } from '@chakra-ui/react';

import type { SelectionPayloadDraft, ViewerState } from '../lib/types';

type ViewerStatusOverlayProps = {
    selectionDraft: SelectionPayloadDraft | null;
    isSubmittingSelection: boolean;
    state: ViewerState;
};

export const ViewerStatusOverlay = ({ state }: ViewerStatusOverlayProps) => {
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
};
