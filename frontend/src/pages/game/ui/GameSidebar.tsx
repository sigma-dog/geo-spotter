import { LuArrowLeft } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { Box, Button, HStack, Spinner, Text, VStack } from '@chakra-ui/react';

import type { MockPanoramaSpot } from '../lib/types';

type GameSidebarProps = {
    activeSpotId: string;
    activeSpotTarget: string;
    activeSpotDescription: string;
    hasSelectedSpot: boolean;
    spots: MockPanoramaSpot[];
    onSelectSpot: (spot: MockPanoramaSpot) => void;
    isViewerLoading: boolean;
    spotTitle: string;
};

export const GameSidebar = ({
    activeSpotId,
    activeSpotTarget,
    activeSpotDescription,
    hasSelectedSpot,
    spots,
    onSelectSpot,
    isViewerLoading,
    spotTitle,
}: GameSidebarProps) => {
    const navigate = useNavigate();

    return (
        <HStack align="flex-start">
            <VStack
                align="stretch"
                gap={4}
                w={{ base: 'full', xl: '360px' }}
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
                            ? `Найти: ${activeSpotTarget}`
                            : 'Выбери точку на карте'}
                    </Text>
                    <Text mt={2} color="gray.600">
                        {hasSelectedSpot
                            ? activeSpotDescription
                            : 'Сначала открой одну из моковых локаций из списка ' +
                              'или кликни по карте. После этого панорама ' +
                              'развернется на весь экран.'}
                    </Text>
                </Box>

                <VStack align="stretch" gap={3}>
                    {spots.map((spot, index) => (
                        <Button
                            key={spot.id}
                            justifyContent="flex-start"
                            variant={
                                spot.id === activeSpotId ? 'solid' : 'subtle'
                            }
                            colorPalette={
                                spot.id === activeSpotId ? 'red' : 'gray'
                            }
                            onClick={() => onSelectSpot(spot)}
                        >
                            {index + 1}. {spot.title}
                        </Button>
                    ))}
                </VStack>
            </VStack>

            <HStack
                maxW="800px"
                zIndex={7}
                px={2}
                py={1}
                borderRadius="lg"
                bg="blackAlpha.700"
                color="white"
                minW="fit-content"
            >
                <Text fontWeight="600" fontSize="2xl">
                    {spotTitle}
                </Text>
                {isViewerLoading && <Spinner size="sm" />}
            </HStack>
        </HStack>
    );
};
