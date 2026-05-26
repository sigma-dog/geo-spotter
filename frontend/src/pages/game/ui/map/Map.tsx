import { useCallback, useEffect, useRef, useState } from 'react';
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
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import maplibregl from 'maplibre-gl';

import { useGetCurrentUserDataQuery } from 'shared/api/currentUser';
import { useSubmitGameTaskSelectionMutation } from 'shared/api/game';
import { toaster } from 'shared/ui/chakra/toaster';
import { Tooltip } from 'shared/ui/chakra/tooltip';

import { useGameSpotState } from './hooks/useGameSpotState';
import { useMapillaryViewer } from './hooks/useMapillaryViewer';
import { useViewerSelectionState } from './hooks/useViewerSelectionState';
import { createUserMarkerElement } from './utils';
import type { GameTask, SelectionPayload } from '../../lib/types';
import { GameSidebar } from '../GameSidebar';
import { ViewerSelectionLayer } from '../ViewerSelectionLayer';
import { ViewerStatusOverlay } from '../ViewerStatusOverlay';

import 'mapillary-js/dist/mapillary.css';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const MAPILLARY_TILE_SOURCE_ID = 'mapillary-coverage';
const MAPILLARY_OVERVIEW_LAYER_ID = 'mapillary-overview-panos';
const MAPILLARY_SEQUENCE_LAYER_ID = 'mapillary-sequence-panos';
const MAPILLARY_IMAGE_LAYER_ID = 'mapillary-image-panos';
const DEFAULT_MAP_CENTER: [number, number] = [12, 24];
const DEFAULT_MAP_ZOOM = 1.6;
const MIN_PANORAMA_MARKER_ZOOM = 6;
const MAPILLARY_TILE_URL =
    'https://tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}?access_token=';
const CURRENT_GAME_TASK: GameTask = {
    id: 'global-object-hunt',
    title: 'Свободный поиск по карте',
    description:
        'Открой панораму в любой точке мира и выдели объект, который подходит под текущее задание.',
    target: 'Желтая машина',
};

const loadImageAsBase64 = async (url: string) => {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to load source image: ${response.status} ${response.statusText}`
        );
    }

    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            if (typeof reader.result !== 'string') {
                reject(new Error('Unable to convert source image to base64.'));
                return;
            }

            const [, base64Payload] = reader.result.split(',');

            if (!base64Payload) {
                reject(new Error('Invalid base64 payload for source image.'));
                return;
            }

            resolve(base64Payload);
        };

        reader.onerror = () => {
            reject(new Error('Unable to read source image blob.'));
        };

        reader.readAsDataURL(blob);
    });
};

type PanoramaMarkerState = {
    message: string;
    status: 'idle' | 'ready' | 'error';
};

export const Map = () => {
    const accessToken = import.meta.env.VITE_MAPILLARY_ACCESS_TOKEN;
    const { data: currentUser } = useGetCurrentUserDataQuery();
    const [
        submitGameTaskSelection,
        { data: selectionResult, isLoading: isSubmittingSelection },
    ] = useSubmitGameTaskSelectionMutation();
    const {
        hasSelectedSpot,
        resetSelectedSpot,
        selectedImageId,
        selectedLocation,
        selectLocation,
        selectScene,
    } = useGameSpotState();
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const customMarkerRef = useRef<maplibregl.Marker | null>(null);
    const customMarkerLocationRef = useRef<{ lat: number; lng: number } | null>(
        null
    );
    const isMapDraggingRef = useRef(false);
    const [panoramaMarkerState, setPanoramaMarkerState] =
        useState<PanoramaMarkerState>({
            message:
                'Приблизь карту и кликни по зелёной линии или точке с покрытием Mapillary.',
            status: 'idle',
        });
    const {
        canDrawSelection,
        captureCurrentFrame,
        projectSelectionToBasic,
        resolvedViewerState,
        viewerContainerRef,
    } = useMapillaryViewer(accessToken, selectedLocation, selectedImageId);
    const {
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
    } = useViewerSelectionState({
        canDrawSelection,
        imageId: resolvedViewerState.imageId,
        imageThumbUrl: resolvedViewerState.imageThumbUrl,
        onSubmitSelection: async (selectionPayload, selectionDraft) => {
            void (async () => {
                console.info(
                    'Submitting game task selection to backend',
                    selectionPayload
                );

                try {
                    let payloadWithImage: SelectionPayload;

                    try {
                        const viewportCapture = await captureCurrentFrame();

                        payloadWithImage = {
                            ...selectionPayload,
                            debugInfo: {
                                viewportCapture: {
                                    height: viewportCapture.height,
                                    source: 'viewer-canvas',
                                    width: viewportCapture.width,
                                },
                            },
                            sourceImageBase64: viewportCapture.base64,
                        };
                    } catch (captureError) {
                        console.warn(
                            'Failed to capture current viewport, falling back to pano projection.',
                            captureError
                        );

                        const basicSelection =
                            await projectSelectionToBasic(selectionDraft);

                        payloadWithImage = {
                            ...selectionPayload,
                            debugInfo: basicSelection.debugInfo,
                            selection: basicSelection.selection,
                            sourceImageBase64: selectionPayload.imageThumbUrl
                                ? await loadImageAsBase64(
                                      selectionPayload.imageThumbUrl
                                  )
                                : null,
                        };
                    }

                    const result =
                        await submitGameTaskSelection(
                            payloadWithImage
                        ).unwrap();

                    console.info(
                        'Game task selection verification result',
                        result
                    );

                    toaster.create({
                        title:
                            result.verdict === 'match'
                                ? 'Объект засчитан'
                                : result.verdict === 'no_match'
                                  ? 'Объект не подошел'
                                  : 'Нужна дополнительная проверка',
                        description: result.reason,
                        type:
                            result.verdict === 'match'
                                ? 'success'
                                : result.verdict === 'no_match'
                                  ? 'error'
                                  : 'info',
                    });
                } catch (error) {
                    console.error(
                        'Failed to submit game task selection',
                        error
                    );

                    const queryError = error as FetchBaseQueryError;
                    const errorDescription =
                        'status' in queryError
                            ? `Backend returned ${String(queryError.status)}.`
                            : 'Unexpected client-side error.';

                    toaster.create({
                        title: 'Не удалось отправить выделение',
                        description:
                            error instanceof Error
                                ? error.message
                                : errorDescription,
                        type: 'error',
                    });
                }
            })();
        },
        selectedLocation,
        task: CURRENT_GAME_TASK,
    });

    const updateSelectedMarker = useCallback(
        (location: { lat: number; lng: number }) => {
            const map = mapRef.current;

            if (!map) {
                return;
            }

            const markerElement = createUserMarkerElement(
                currentUser?.avatarUrl,
                currentUser?.username?.charAt(0).toUpperCase() ?? 'U'
            );

            customMarkerRef.current?.remove();
            customMarkerRef.current = new maplibregl.Marker({
                element: markerElement,
                anchor: 'bottom',
            })
                .setLngLat([location.lng, location.lat])
                .addTo(map);
            customMarkerLocationRef.current = location;
        },
        [currentUser?.avatarUrl, currentUser?.username]
    );

    useEffect(() => {
        if (!customMarkerLocationRef.current) {
            return;
        }
        updateSelectedMarker(customMarkerLocationRef.current);
    }, [currentUser?.avatarUrl, currentUser?.username, updateSelectedMarker]);

    const focusMapOnLocation = useCallback(
        (
            location: { lat: number; lng: number },
            options?: {
                duration?: number;
                zoom?: number;
            }
        ) => {
            const map = mapRef.current;

            if (!map) {
                return;
            }

            map.easeTo({
                center: [location.lng, location.lat],
                duration: options?.duration ?? 300,
                zoom:
                    options?.zoom ??
                    (hasSelectedSpot
                        ? Math.max(map.getZoom(), 14)
                        : map.getZoom()),
            });
        },
        [hasSelectedSpot]
    );

    const updateCoverageHint = useCallback(() => {
        const map = mapRef.current;

        if (!accessToken) {
            setPanoramaMarkerState({
                message:
                    'Добавь `VITE_MAPILLARY_ACCESS_TOKEN`, чтобы загрузить покрытие Mapillary.',
                status: 'error',
            });
            return;
        }

        if (!map) {
            return;
        }

        if (map.getZoom() < MIN_PANORAMA_MARKER_ZOOM) {
            setPanoramaMarkerState({
                message: `Приблизь карту до zoom ${MIN_PANORAMA_MARKER_ZOOM}, чтобы появились кликабельные линии покрытия.`,
                status: 'idle',
            });
            return;
        }

        if (map.getZoom() < 14) {
            setPanoramaMarkerState({
                message:
                    'Кликни по зелёной линии Mapillary, чтобы открыть репрезентативную панораму этого трека.',
                status: 'ready',
            });
            return;
        }

        setPanoramaMarkerState({
            message:
                'На этом зуме доступны точные pano-точки. Кликни по зелёной точке или линии.',
            status: 'ready',
        });
    }, [accessToken]);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) {
            return;
        }

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            center: DEFAULT_MAP_CENTER,
            zoom: DEFAULT_MAP_ZOOM,
            style: MAP_STYLE_URL,
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        const handleCoverageClick = (
            event: maplibregl.MapMouseEvent & {
                features?: maplibregl.MapGeoJSONFeature[];
            }
        ) => {
            if (isMapDraggingRef.current) {
                return;
            }

            const feature = event.features?.[0];

            if (!feature) {
                return;
            }

            const layerId = feature.layer.id;
            const imageIdValue =
                layerId === MAPILLARY_SEQUENCE_LAYER_ID
                    ? feature.properties?.image_id
                    : (feature.properties?.image_id ?? feature.properties?.id);
            const imageId = imageIdValue ? String(imageIdValue) : null;

            const geometryCoordinates =
                feature.geometry.type === 'Point' &&
                Array.isArray(feature.geometry.coordinates) &&
                feature.geometry.coordinates.length >= 2
                    ? feature.geometry.coordinates
                    : null;
            const clickedLocation = geometryCoordinates
                ? {
                      lat: Number(geometryCoordinates[1]),
                      lng: Number(geometryCoordinates[0]),
                  }
                : {
                      lat: event.lngLat.lat,
                      lng: event.lngLat.lng,
                  };

            resetSelection();
            if (imageId) {
                selectScene(clickedLocation, imageId);
            } else {
                selectLocation(clickedLocation);
            }
            updateSelectedMarker(clickedLocation);
            focusMapOnLocation(clickedLocation, {
                duration: 220,
                zoom: Math.max(map.getZoom(), 14),
            });
        };

        const registerInteractiveLayer = (layerId: string) => {
            map.on('click', layerId, handleCoverageClick);
            map.on('mouseenter', layerId, () => {
                map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', layerId, () => {
                map.getCanvas().style.cursor = '';
            });
        };

        map.on('load', () => {
            if (!accessToken) {
                updateCoverageHint();
                return;
            }

            map.addSource(MAPILLARY_TILE_SOURCE_ID, {
                type: 'vector',
                tiles: [`${MAPILLARY_TILE_URL}${accessToken}`],
                minzoom: 0,
                maxzoom: 14,
            });

            map.addLayer({
                id: MAPILLARY_OVERVIEW_LAYER_ID,
                type: 'circle',
                source: MAPILLARY_TILE_SOURCE_ID,
                'source-layer': 'overview',
                minzoom: 0,
                maxzoom: 6,
                filter: ['==', ['get', 'is_pano'], true],
                paint: {
                    'circle-radius': 3,
                    'circle-color': '#22c55e',
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#f8fafc',
                    'circle-opacity': 0.9,
                },
            });

            map.addLayer({
                id: MAPILLARY_SEQUENCE_LAYER_ID,
                type: 'line',
                source: MAPILLARY_TILE_SOURCE_ID,
                'source-layer': 'sequence',
                minzoom: 6,
                maxzoom: 14,
                filter: ['==', ['get', 'is_pano'], true],
                layout: {
                    'line-cap': 'round',
                    'line-join': 'round',
                },
                paint: {
                    'line-color': '#16a34a',
                    'line-width': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        6,
                        2,
                        14,
                        5,
                    ],
                    'line-opacity': 0.85,
                },
            });

            map.addLayer({
                id: MAPILLARY_IMAGE_LAYER_ID,
                type: 'circle',
                source: MAPILLARY_TILE_SOURCE_ID,
                'source-layer': 'image',
                minzoom: 14,
                filter: ['==', ['get', 'is_pano'], true],
                paint: {
                    'circle-radius': 4,
                    'circle-color': '#22c55e',
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': '#f8fafc',
                    'circle-opacity': 0.95,
                },
            });

            registerInteractiveLayer(MAPILLARY_OVERVIEW_LAYER_ID);
            registerInteractiveLayer(MAPILLARY_SEQUENCE_LAYER_ID);
            registerInteractiveLayer(MAPILLARY_IMAGE_LAYER_ID);
            updateCoverageHint();
        });

        map.on('dragstart', () => {
            isMapDraggingRef.current = true;
        });

        map.on('dragend', () => {
            window.setTimeout(() => {
                isMapDraggingRef.current = false;
            }, 0);
        });

        map.on('click', (event) => {
            if (isMapDraggingRef.current) {
                return;
            }

            const clickedLocation = {
                lat: event.lngLat.lat,
                lng: event.lngLat.lng,
            };

            resetSelection();
            selectLocation(clickedLocation);
            updateSelectedMarker(clickedLocation);
            focusMapOnLocation(clickedLocation, {
                duration: 220,
                zoom: Math.max(map.getZoom(), 14),
            });
        });

        map.on('moveend', () => {
            updateCoverageHint();
        });

        mapRef.current = map;
        window.setTimeout(() => {
            updateCoverageHint();
        }, 0);

        return () => {
            customMarkerRef.current?.remove();
            map.remove();
            mapRef.current = null;
        };
    }, [
        focusMapOnLocation,
        resetSelection,
        selectLocation,
        selectScene,
        updateCoverageHint,
        updateSelectedMarker,
        accessToken,
    ]);

    useEffect(() => {
        if (!selectedLocation) {
            return;
        }

        if (!mapContainerRef.current || !mapRef.current || !selectedLocation) {
            return;
        }

        focusMapOnLocation(selectedLocation, {
            duration: 300,
            zoom: 14,
        });
    }, [focusMapOnLocation, selectedLocation]);

    useEffect(() => {
        if (!customMarkerRef.current || !resolvedViewerState.panoramaLocation) {
            return;
        }

        updateSelectedMarker(resolvedViewerState.panoramaLocation);
    }, [resolvedViewerState.panoramaLocation, updateSelectedMarker]);

    useEffect(() => {
        if (!mapRef.current || !resolvedViewerState.panoramaLocation) {
            return;
        }

        focusMapOnLocation(resolvedViewerState.panoramaLocation, {
            duration: 350,
            zoom: Math.max(mapRef.current.getZoom(), 14),
        });
    }, [focusMapOnLocation, resolvedViewerState.panoramaLocation]);

    useEffect(() => {
        if (!mapRef.current) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            const map = mapRef.current;

            if (!map) {
                return;
            }

            map.resize();

            const focusLocation =
                resolvedViewerState.panoramaLocation ?? selectedLocation;

            if (!focusLocation) {
                return;
            }

            focusMapOnLocation(focusLocation, {
                duration: 300,
                zoom: hasSelectedSpot
                    ? Math.max(map.getZoom(), 14)
                    : map.getZoom(),
            });
        }, 50);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [
        focusMapOnLocation,
        hasSelectedSpot,
        resolvedViewerState.panoramaLocation,
        selectedLocation,
    ]);

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
                    isSubmittingSelection={isSubmittingSelection}
                    selectionDraft={selectionDraft}
                    selectionResult={selectionResult ?? null}
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
                {!hasSelectedSpot && (
                    <Box
                        position="absolute"
                        right={3}
                        bottom={3}
                        zIndex={2}
                        maxW="360px"
                        px={3}
                        py={2.5}
                        borderRadius="xl"
                        bg="#171923"
                        color="white"
                        borderWidth="1px"
                        borderColor="whiteAlpha.200"
                        boxShadow="lg"
                    >
                        <Text fontWeight="700" fontSize="sm">
                            Точки панорам
                        </Text>
                        <Text
                            mt={1}
                            fontSize="sm"
                            color={
                                panoramaMarkerState.status === 'error'
                                    ? 'red.200'
                                    : 'whiteAlpha.900'
                            }
                        >
                            {panoramaMarkerState.message}
                        </Text>
                    </Box>
                )}
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
                    isViewerLoading={resolvedViewerState.isLoading}
                    panoramaAddress={resolvedViewerState.panoramaAddress}
                    task={CURRENT_GAME_TASK}
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
