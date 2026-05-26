import { LuArrowLeft } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { Box, Button, HStack, Spinner, Text, VStack } from '@chakra-ui/react';

import type { GameTask } from '../lib/types';

type GameSidebarProps = {
    hasSelectedSpot: boolean;
    panoramaAddress: string | null;
    isViewerLoading: boolean;
    task: GameTask;
};

export const GameSidebar = ({
    hasSelectedSpot,
    panoramaAddress,
    isViewerLoading,
    task,
}: GameSidebarProps) => {
    const navigate = useNavigate();

    return (
        <HStack align="flex-start" w="auto" maxW="100%">
            <VStack
                align="stretch"
                gap={4}
                minW="360px"
                maxW="100%"
                p={5}
                borderRadius="2xl"
                bg="white"
                boxShadow="sm"
            >
                <Button
                    size="sm"
                    variant="solid"
                    colorPalette="red"
                    justifyContent="flex-start"
                    onClick={() => navigate('/home')}
                >
                    <LuArrowLeft />В хаб
                </Button>
                <Box
                    p={4}
                    borderRadius="xl"
                    bg="red.50"
                    borderWidth="1px"
                    borderColor="red.100"
                >
                    <Text fontSize="sm" color="red.400">
                        {hasSelectedSpot ? 'Текущее задание' : 'Старт игры'}
                    </Text>
                    <Text fontSize="xl" fontWeight="700" color="red.700">
                        {hasSelectedSpot
                            ? `Найти: ${task.target}`
                            : 'Выбери любую точку на карте'}
                    </Text>
                    <Text mt={2} color="gray.600">
                        {hasSelectedSpot
                            ? task.description
                            : 'После начала игры карта полностью свободна: ' +
                              'кликни в любое место, и мы попробуем открыть ближайшую панораму Mapillary.'}
                    </Text>
                </Box>
            </VStack>

            <HStack
                zIndex={7}
                px={2}
                py={1}
                borderRadius="lg"
                bg="blackAlpha.700"
                color="white"
                minW="fit-content"
                maxW="100%"
            >
                <Text fontWeight="600" fontSize="lg">
                    {panoramaAddress ?? task.title}
                </Text>
                {isViewerLoading && <Spinner size="sm" />}
            </HStack>
        </HStack>
    );
};
