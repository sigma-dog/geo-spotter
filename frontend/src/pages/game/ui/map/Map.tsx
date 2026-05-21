import { useEffect, useRef } from 'react';
import { LuMap, LuMousePointerClick, LuScanSearch } from 'react-icons/lu';
import {
    ActionBar,
    Box,
    Button,
    HStack,
    IconButton,
    Portal,
    Text,
    VStack,
} from '@chakra-ui/react';
import maplibregl from 'maplibre-gl';

import { Tooltip } from 'shared/ui/chakra/tooltip';

import { useGameSpotState } from './hooks/useGameSpotState';
import { useMapillaryViewer } from './hooks/useMapillaryViewer';
import { useViewerSelectionState } from './hooks/useViewerSelectionState';
import { MOCK_PANORAMA_SPOTS } from './mocks';
import { createMarkerElement, setMarkerActiveState } from './utils';
import { GameSidebar } from '../GameSidebar';
import { ViewerSelectionLayer } from '../ViewerSelectionLayer';
import { ViewerStatusOverlay } from '../ViewerStatusOverlay';

import 'mapillary-js/dist/mapillary.css';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export const Map = () => {
    const accessToken = import.meta.env.VITE_MAPILLARY_ACCESS_TOKEN;
    const {
        activeSpot,
        activeSpotId,
        hasSelectedSpot,
        resetSelectedSpot,
        selectedLocation,
        selectLocation,
        selectSpot,
    } = useGameSpotState(MOCK_PANORAMA_SPOTS);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const spotMarkersRef = useRef<globalThis.Map<string, maplibregl.Marker>>(
        new globalThis.Map()
    );
    const customMarkerRef = useRef<maplibregl.Marker | null>(null);
    const { canDrawSelection, resolvedViewerState, viewerContainerRef } =
        useMapillaryViewer(accessToken, selectedLocation);
    const {
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
    } = useViewerSelectionState({
        activeSpot,
        canDrawSelection,
        imageId: resolvedViewerState.imageId,
        selectedLocation,
    });

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) {
            return;
        }

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            center: [
                MOCK_PANORAMA_SPOTS[0].location.lng,
                MOCK_PANORAMA_SPOTS[0].location.lat,
            ],
            zoom: 13,
            style: MAP_STYLE_URL,
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        MOCK_PANORAMA_SPOTS.forEach((spot, index) => {
            const markerElement = createMarkerElement(String(index + 1));

            markerElement.onclick = () => {
                resetSelection();
                selectSpot(spot);
            };

            const marker = new maplibregl.Marker({ element: markerElement })
                .setLngLat([spot.location.lng, spot.location.lat])
                .addTo(map);

            spotMarkersRef.current.set(spot.id, marker);
        });

        map.on('click', (event) => {
            const clickedLocation = {
                lat: event.lngLat.lat,
                lng: event.lngLat.lng,
            };

            resetSelection();
            selectLocation(clickedLocation);

            if (customMarkerRef.current) {
                customMarkerRef.current.setLngLat([
                    clickedLocation.lng,
                    clickedLocation.lat,
                ]);
            } else {
                const markerElement = createMarkerElement('X');
                markerElement.style.background = '#e53e3e';
                markerElement.style.color = '#ffffff';

                customMarkerRef.current = new maplibregl.Marker({
                    element: markerElement,
                })
                    .setLngLat([clickedLocation.lng, clickedLocation.lat])
                    .addTo(map);
            }
        });

        mapRef.current = map;

        return () => {
            customMarkerRef.current?.remove();
            spotMarkersRef.current.forEach((marker) => marker.remove());
            spotMarkersRef.current.clear();
            map.remove();
            mapRef.current = null;
        };
    }, [resetSelection, selectLocation, selectSpot]);

    useEffect(() => {
        spotMarkersRef.current.forEach((marker, spotId) => {
            const markerElement = marker.getElement();
            setMarkerActiveState(markerElement, spotId === activeSpotId);
        });
    }, [activeSpotId]);

    useEffect(() => {
        if (!mapContainerRef.current || !mapRef.current || !selectedLocation) {
            return;
        }

        mapRef.current.flyTo({
            center: [selectedLocation.lng, selectedLocation.lat],
            zoom: 14,
            duration: 1200,
        });
    }, [selectedLocation]);

    useEffect(() => {
        if (!mapRef.current) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            mapRef.current?.resize();
        }, 50);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [hasSelectedSpot]);

    return (
        <Box position="relative" flex={1} minH="100vh" bg="gray.950">
            <Box
                position="absolute"
                inset={0}
                zIndex={hasSelectedSpot ? 1 : 3}
                borderRadius={hasSelectedSpot ? '2xl' : 'none'}
                overflow="hidden"
                bg="gray.900"
                opacity={hasSelectedSpot ? 1 : 0}
                pointerEvents={hasSelectedSpot ? 'auto' : 'none'}
            >
                <Box ref={viewerContainerRef} h="full" w="full" />
                <ViewerSelectionLayer
                    draftSelection={draftSelection}
                    isInteractive={isSelectionMode && canDrawSelection}
                    selectionPayload={selectionPayload}
                    selectionLayerRef={selectionLayerRef}
                    onResetSelection={resetSelection}
                    onSubmitSelection={submitSelection}
                    onPointerDown={handleSelectionPointerDown}
                    onPointerMove={handleSelectionPointerMove}
                    onPointerUp={handleSelectionPointerUp}
                />
                <ViewerStatusOverlay
                    selectionPayload={selectionPayload}
                    state={resolvedViewerState}
                />
            </Box>

            <Box
                position="absolute"
                left={hasSelectedSpot ? { base: 4, xl: 6 } : 0}
                bottom={hasSelectedSpot ? { base: 4, xl: 6 } : 'auto'}
                top={hasSelectedSpot ? 'auto' : 0}
                insetInlineEnd={hasSelectedSpot ? 'auto' : 0}
                zIndex={hasSelectedSpot ? 4 : 2}
                w={hasSelectedSpot ? { base: '600px' } : '100%'}
                h={hasSelectedSpot ? { base: '400px' } : '100%'}
                borderRadius={hasSelectedSpot ? '2xl' : 'none'}
                overflow="hidden"
                bg="white"
                boxShadow={hasSelectedSpot ? '2xl' : 'none'}
                borderWidth={hasSelectedSpot ? '1px' : '0'}
                borderColor={hasSelectedSpot ? 'whiteAlpha.400' : 'transparent'}
                transition="all 0.35s ease"
            >
                <Box ref={mapContainerRef} h="full" w="full" />
                {hasSelectedSpot && (
                    <IconButton
                        aria-label="Открыть карту на весь экран"
                        position="absolute"
                        top={3}
                        left={3}
                        zIndex={2}
                        size="sm"
                        colorPalette="red"
                        variant="solid"
                        onClick={() => {
                            resetSelection();
                            resetSelectedSpot();
                        }}
                    >
                        <LuMap />
                    </IconButton>
                )}
            </Box>

            <Box
                position="absolute"
                top={{ base: 4, xl: 6 }}
                left={{ base: 4, xl: 6 }}
                zIndex={5}
                w={{ base: 'calc(100% - 32px)', md: '360px' }}
            >
                <GameSidebar
                    hasSelectedSpot={hasSelectedSpot}
                    activeSpotDescription={activeSpot.description}
                    activeSpotId={activeSpotId ?? ''}
                    activeSpotTarget={activeSpot.target}
                    spots={MOCK_PANORAMA_SPOTS}
                    onSelectSpot={(spot) => {
                        resetSelection();
                        selectSpot(spot);
                    }}
                    isViewerLoading={resolvedViewerState.isLoading}
                    spotTitle={activeSpot.title}
                />
            </Box>

            {hasSelectedSpot && (
                <ActionBar.Root open>
                    <Portal>
                        <ActionBar.Positioner pb={4} zIndex={30}>
                            <ActionBar.Content
                                // bg="red.950"
                                // borderColor="red.800"
                                color="white"
                                boxShadow="2xl"
                            >
                                <Tooltip
                                    showArrow
                                    positioning={{
                                        placement: 'top',
                                    }}
                                    content={
                                        <VStack
                                            align="stretch"
                                            gap={1}
                                            maxW="240px"
                                        >
                                            <HStack gap={2}>
                                                <LuScanSearch />
                                                <Text
                                                    fontWeight="700"
                                                    color="red.100"
                                                >
                                                    Выделение объекта
                                                </Text>
                                            </HStack>
                                            <Text
                                                fontSize="sm"
                                                color="red.100/80"
                                            >
                                                Включи режим и протяни рамку по
                                                нужному объекту.
                                            </Text>
                                        </VStack>
                                    }
                                    contentProps={{
                                        bg: 'red.950/95',
                                        borderWidth: '1px',
                                        borderColor: 'red.500/30',
                                        color: 'white',
                                        borderRadius: 'xl',
                                        px: 3,
                                        py: 2.5,
                                        boxShadow: 'xl',
                                    }}
                                >
                                    <Button
                                        size="sm"
                                        colorPalette="red"
                                        variant={
                                            isSelectionMode
                                                ? 'solid'
                                                : 'surface'
                                        }
                                        onClick={toggleSelectionMode}
                                        disabled={!canDrawSelection}
                                    >
                                        <LuMousePointerClick />
                                        {isSelectionMode
                                            ? 'Режим выделения активен'
                                            : 'Выделить объект'}
                                    </Button>
                                </Tooltip>
                                <ActionBar.Separator />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    colorPalette="red"
                                    onClick={() => {
                                        resetSelection();
                                        resetSelectedSpot();
                                    }}
                                >
                                    <LuMap />К карте
                                </Button>
                            </ActionBar.Content>
                        </ActionBar.Positioner>
                    </Portal>
                </ActionBar.Root>
            )}
        </Box>
    );
};
