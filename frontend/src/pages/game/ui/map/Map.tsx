import { useCallback, useEffect, useRef, useState } from 'react';
import { LuMap, LuMousePointerClick, LuScanSearch } from 'react-icons/lu';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ActionBar,
    Box,
    Button,
    HStack,
    IconButton,
    Portal,
    Spinner,
    Text,
    VStack,
} from '@chakra-ui/react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import maplibregl from 'maplibre-gl';

import { useGetCurrentUserDataQuery } from 'shared/api/currentUser';
import {
    useCompleteGameTaskForDebugMutation,
    useGetActiveGameSessionQuery,
    useStartSoloGameSessionMutation,
    useSubmitGameTaskSelectionMutation,
} from 'shared/api/game';
import { toaster } from 'shared/ui/chakra/toaster';
import { Tooltip } from 'shared/ui/chakra/tooltip';

import { useGameSpotState } from './hooks/useGameSpotState';
import { useMapillaryViewer } from './hooks/useMapillaryViewer';
import { useViewerSelectionState } from './hooks/useViewerSelectionState';
import { createUserMarkerElement } from './utils';
import type {
    GameSession,
    SelectionPayload,
    SelectionVerificationResult,
} from '../../lib/types';
import { GameResultsDialog } from '../GameResultsDialog';
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

const getFirstPendingTask = (session: GameSession | null) => {
    return session?.tasks.find((task) => task.status !== 'COMPLETED') ?? null;
};

const applySelectionResultToSession = (
    session: GameSession,
    selectedTaskId: string | null,
    result: SelectionVerificationResult
) => {
    const nextSession: GameSession = {
        ...session,
        attemptsCount: session.attemptsCount + 1,
        awardedXp: session.awardedXp + (result.awardedXp ?? 0),
    };

    if (
        result.verdict !== 'match' ||
        !result.taskCompleted ||
        !selectedTaskId
    ) {
        return nextSession;
    }

    const nextTasks = nextSession.tasks.map((task) => {
        if (task.id !== selectedTaskId) {
            return task;
        }

        return {
            ...task,
            completedAt: new Date().toISOString(),
            status: 'COMPLETED' as const,
        };
    });
    const completedTasksCount = nextTasks.filter(
        (task) => task.status === 'COMPLETED'
    ).length;

    return {
        ...nextSession,
        completedTasksCount,
        finishedAt: result.sessionCompleted
            ? new Date().toISOString()
            : nextSession.finishedAt,
        status: result.sessionCompleted
            ? ('COMPLETED' as const)
            : ('ACTIVE' as const),
        tasks: nextTasks,
    };
};

export const Map = () => {
    const accessToken = import.meta.env.VITE_MAPILLARY_ACCESS_TOKEN;
    const location = useLocation();
    const navigate = useNavigate();
    const navigationState = location.state as {
        autoStartSolo?: boolean;
        preloadedSession?: GameSession;
    } | null;
    const { data: currentUser } = useGetCurrentUserDataQuery();
    const {
        data: activeSessionData,
        isFetching: isActiveSessionFetching,
        refetch: refetchActiveSession,
    } = useGetActiveGameSessionQuery();
    const [startSoloGameSession, { isLoading: isStartingGame }] =
        useStartSoloGameSessionMutation();
    const [completeGameTaskForDebug] = useCompleteGameTaskForDebugMutation();
    const [
        submitGameTaskSelection,
        { data: selectionResult, isLoading: isSubmittingSelection },
    ] = useSubmitGameTaskSelectionMutation();
    const [sessionSnapshot, setSessionSnapshot] = useState<
        GameSession | null | undefined
    >(navigationState?.preloadedSession);
    const [completedSession, setCompletedSession] =
        useState<GameSession | null>(null);
    const [isResultsOpen, setIsResultsOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [debugCompletingTaskId, setDebugCompletingTaskId] = useState<
        string | null
    >(null);
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
    const isSessionActiveRef = useRef(false);
    const autoStartHandledRef = useRef(false);
    const [panoramaMarkerState, setPanoramaMarkerState] =
        useState<PanoramaMarkerState>({
            message:
                'Сначала начни игру, затем выбери точку на карте или покрытие Mapillary.',
            status: 'idle',
        });
    const {
        canDrawSelection,
        captureCurrentFrame,
        projectSelectionToBasic,
        resolvedViewerState,
        viewerContainerRef,
    } = useMapillaryViewer(accessToken, selectedLocation, selectedImageId);

    const session =
        sessionSnapshot === undefined
            ? (activeSessionData ?? null)
            : sessionSnapshot;
    const currentWorldLocation =
        resolvedViewerState.panoramaLocation ?? selectedLocation;
    const shouldAutoStartSolo = Boolean(navigationState?.autoStartSolo);
    const isDebugMode = import.meta.env.DEV;

    const activeTask = session
        ? (session.tasks.find(
              (task) =>
                  task.id === selectedTaskId && task.status !== 'COMPLETED'
          ) ?? getFirstPendingTask(session))
        : null;
    const availableTaskOptions =
        session?.tasks.filter((task) => task.status !== 'COMPLETED') ?? [];

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
        onSubmitSelection: async (
            currentSelectionPayload,
            currentSelectionDraft
        ) => {
            if (!session || !activeTask) {
                toaster.create({
                    title: 'Нет активного задания',
                    description:
                        'Сначала начни игру и выбери незавершённое задание.',
                    type: 'info',
                });
                return;
            }

            void (async () => {
                try {
                    const normalizedPayload: SelectionPayload = {
                        ...currentSelectionPayload,
                        sessionId: session.id,
                        sessionTaskId: activeTask.id,
                        task: {
                            id: activeTask.id,
                            target: activeTask.target,
                            title: activeTask.title,
                        },
                    };
                    let payloadWithImage: SelectionPayload;

                    try {
                        const viewportCapture = await captureCurrentFrame();

                        payloadWithImage = {
                            ...normalizedPayload,
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

                        const basicSelection = await projectSelectionToBasic(
                            currentSelectionDraft
                        );

                        payloadWithImage = {
                            ...normalizedPayload,
                            debugInfo: basicSelection.debugInfo,
                            selection: basicSelection.selection,
                            sourceImageBase64: normalizedPayload.imageThumbUrl
                                ? await loadImageAsBase64(
                                      normalizedPayload.imageThumbUrl
                                  )
                                : null,
                        };
                    }

                    const result =
                        await submitGameTaskSelection(
                            payloadWithImage
                        ).unwrap();

                    toaster.create({
                        title:
                            result.verdict === 'match'
                                ? 'Объект засчитан'
                                : result.verdict === 'no_match'
                                  ? 'Объект не подошел'
                                  : 'Нужна дополнительная проверка',
                        description:
                            result.verdict === 'match' &&
                            (result.awardedXp ?? 0) > 0
                                ? `${result.reason} Получено ${result.awardedXp} XP.`
                                : result.reason,
                        type:
                            result.verdict === 'match'
                                ? 'success'
                                : result.verdict === 'no_match'
                                  ? 'error'
                                  : 'info',
                    });

                    setSessionSnapshot((currentSession) => {
                        const baseSession = currentSession ?? session;

                        if (!baseSession) {
                            return currentSession;
                        }

                        const nextSession = applySelectionResultToSession(
                            baseSession,
                            activeTask.id,
                            result
                        );

                        if (nextSession.status === 'COMPLETED') {
                            setCompletedSession(nextSession);
                            setIsResultsOpen(true);
                        }

                        return nextSession;
                    });

                    if (result.taskCompleted) {
                        resetSelection();
                    }

                    if (result.sessionCompleted) {
                        void refetchActiveSession();
                    }
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
        sessionId: session?.id ?? null,
        selectedLocation: currentWorldLocation,
        task: activeTask,
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
                anchor: 'bottom',
                element: markerElement,
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

    const isSessionActive = session?.status === 'ACTIVE';
    const shouldKeepPanoramaVisible =
        hasSelectedSpot && (isSessionActive || isResultsOpen);

    useEffect(() => {
        isSessionActiveRef.current = isSessionActive;
    }, [isSessionActive]);

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

        if (!isSessionActive) {
            setPanoramaMarkerState({
                message:
                    'Нажми "Начать игру", чтобы получить задания и начать поиск предметов.',
                status: 'idle',
            });
            return;
        }

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
    }, [accessToken, isSessionActive]);

    const handleStartGame = useCallback(() => {
        void (async () => {
            try {
                const startedSession = await startSoloGameSession().unwrap();

                resetSelection();
                resetSelectedSpot();
                setCompletedSession(null);
                setIsResultsOpen(false);
                setSessionSnapshot(startedSession);
                setSelectedTaskId(
                    getFirstPendingTask(startedSession)?.id ?? null
                );
                window.setTimeout(() => {
                    updateCoverageHint();
                }, 0);

                toaster.create({
                    title: 'Игра началась',
                    description:
                        'Сессия создана. Открой панораму и начни искать предметы.',
                    type: 'success',
                });
            } catch (error) {
                const queryError = error as FetchBaseQueryError;
                const errorDescription =
                    'status' in queryError
                        ? `Backend returned ${String(queryError.status)}.`
                        : 'Unexpected client-side error.';

                toaster.create({
                    title: 'Не удалось начать игру',
                    description:
                        error instanceof Error
                            ? error.message
                            : errorDescription,
                    type: 'error',
                });
            }
        })();
    }, [
        resetSelectedSpot,
        resetSelection,
        startSoloGameSession,
        updateCoverageHint,
    ]);

    const handleCompleteTaskForDebug = useCallback(
        (taskId: string) => {
            if (!isDebugMode || !session) {
                return;
            }

            setDebugCompletingTaskId(taskId);

            void (async () => {
                try {
                    const updatedSession = await completeGameTaskForDebug({
                        sessionId: session.id,
                        sessionTaskId: taskId,
                    }).unwrap();

                    setSessionSnapshot(updatedSession);

                    if (updatedSession.status === 'COMPLETED') {
                        setCompletedSession(updatedSession);
                        setIsResultsOpen(true);
                    }

                    toaster.create({
                        title: 'Debug: задание завершено',
                        description: 'Задание помечено выполненным на backend.',
                        type: 'info',
                    });
                } catch (error) {
                    const queryError = error as FetchBaseQueryError;
                    const errorDescription =
                        'status' in queryError
                            ? `Backend returned ${String(queryError.status)}.`
                            : 'Unexpected client-side error.';

                    toaster.create({
                        title: 'Debug completion failed',
                        description:
                            error instanceof Error
                                ? error.message
                                : errorDescription,
                        type: 'error',
                    });
                } finally {
                    setDebugCompletingTaskId(null);
                }
            })();
        },
        [completeGameTaskForDebug, isDebugMode, session]
    );

    useEffect(() => {
        if (autoStartHandledRef.current || !shouldAutoStartSolo) {
            return;
        }

        if (isActiveSessionFetching) {
            return;
        }

        if (session?.status === 'ACTIVE') {
            autoStartHandledRef.current = true;
            return;
        }

        autoStartHandledRef.current = true;
        handleStartGame();
    }, [
        handleStartGame,
        isActiveSessionFetching,
        session,
        shouldAutoStartSolo,
    ]);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) {
            return;
        }

        const map = new maplibregl.Map({
            center: DEFAULT_MAP_CENTER,
            container: mapContainerRef.current,
            style: MAP_STYLE_URL,
            zoom: DEFAULT_MAP_ZOOM,
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        const handleCoverageClick = (
            event: maplibregl.MapMouseEvent & {
                features?: maplibregl.MapGeoJSONFeature[];
            }
        ) => {
            if (!isSessionActiveRef.current || isMapDraggingRef.current) {
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
                map.getCanvas().style.cursor = isSessionActiveRef.current
                    ? 'pointer'
                    : '';
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
                maxzoom: 14,
                minzoom: 0,
                tiles: [`${MAPILLARY_TILE_URL}${accessToken}`],
                type: 'vector',
            });

            map.addLayer({
                filter: ['==', ['get', 'is_pano'], true],
                id: MAPILLARY_OVERVIEW_LAYER_ID,
                maxzoom: 6,
                minzoom: 0,
                paint: {
                    'circle-color': '#22c55e',
                    'circle-opacity': 0.9,
                    'circle-radius': 3,
                    'circle-stroke-color': '#f8fafc',
                    'circle-stroke-width': 1,
                },
                source: MAPILLARY_TILE_SOURCE_ID,
                'source-layer': 'overview',
                type: 'circle',
            });

            map.addLayer({
                filter: ['==', ['get', 'is_pano'], true],
                id: MAPILLARY_SEQUENCE_LAYER_ID,
                layout: {
                    'line-cap': 'round',
                    'line-join': 'round',
                },
                maxzoom: 14,
                minzoom: 6,
                paint: {
                    'line-color': '#16a34a',
                    'line-opacity': 0.85,
                    'line-width': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        6,
                        2,
                        14,
                        5,
                    ],
                },
                source: MAPILLARY_TILE_SOURCE_ID,
                'source-layer': 'sequence',
                type: 'line',
            });

            map.addLayer({
                filter: ['==', ['get', 'is_pano'], true],
                id: MAPILLARY_IMAGE_LAYER_ID,
                minzoom: 14,
                paint: {
                    'circle-color': '#22c55e',
                    'circle-opacity': 0.95,
                    'circle-radius': 4,
                    'circle-stroke-color': '#f8fafc',
                    'circle-stroke-width': 1.5,
                },
                source: MAPILLARY_TILE_SOURCE_ID,
                'source-layer': 'image',
                type: 'circle',
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
            if (!isSessionActiveRef.current || isMapDraggingRef.current) {
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
        accessToken,
        focusMapOnLocation,
        resetSelection,
        selectLocation,
        selectScene,
        updateCoverageHint,
        updateSelectedMarker,
    ]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            updateCoverageHint();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [updateCoverageHint]);

    useEffect(() => {
        if (!selectedLocation) {
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
            <GameResultsDialog
                isOpen={isResultsOpen}
                session={completedSession}
                onGoHome={() => navigate('/home')}
                onRestart={handleStartGame}
                isRestarting={isStartingGame}
            />

            <Box
                position="absolute"
                inset={0}
                zIndex={shouldKeepPanoramaVisible ? 1 : 3}
                borderRadius={shouldKeepPanoramaVisible ? '2xl' : 'none'}
                overflow="hidden"
                bg="gray.900"
                opacity={shouldKeepPanoramaVisible ? 1 : 0}
                pointerEvents={shouldKeepPanoramaVisible ? 'auto' : 'none'}
            >
                <Box ref={viewerContainerRef} h="full" w="full" />
                <ViewerSelectionLayer
                    draftSelection={draftSelection}
                    isInteractive={isSelectionMode && canDrawSelection}
                    selectedTaskId={activeTask?.id ?? null}
                    selectionPayload={selectionPayload}
                    selectionLayerRef={selectionLayerRef}
                    taskOptions={availableTaskOptions}
                    onChangeTask={(taskId) => {
                        setSelectedTaskId(taskId);
                    }}
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
                left={shouldKeepPanoramaVisible ? { base: 4, xl: 6 } : 0}
                bottom={shouldKeepPanoramaVisible ? { base: 4, xl: 6 } : 'auto'}
                top={shouldKeepPanoramaVisible ? 'auto' : 0}
                insetInlineEnd={shouldKeepPanoramaVisible ? 'auto' : 0}
                zIndex={shouldKeepPanoramaVisible ? 4 : 2}
                w={shouldKeepPanoramaVisible ? { base: '600px' } : '100%'}
                h={shouldKeepPanoramaVisible ? { base: '400px' } : '100%'}
                borderRadius={shouldKeepPanoramaVisible ? '2xl' : 'none'}
                overflow="hidden"
                bg="white"
                boxShadow={shouldKeepPanoramaVisible ? '2xl' : 'none'}
                borderWidth={shouldKeepPanoramaVisible ? '1px' : '0'}
                borderColor={
                    shouldKeepPanoramaVisible ? 'whiteAlpha.400' : 'transparent'
                }
                transition="all 0.35s ease"
            >
                <Box ref={mapContainerRef} h="full" w="full" />
                {(!isSessionActive || !hasSelectedSpot) && (
                    <Box
                        position="absolute"
                        right={3}
                        bottom={3}
                        zIndex={2}
                        maxW="360px"
                        px={3}
                        py={2.5}
                        borderRadius="xl"
                        bg="blackAlpha.700"
                        color="white"
                    >
                        <Text fontWeight="700">
                            {isSessionActive
                                ? 'Карта готова к поиску'
                                : 'Одиночный режим ещё не начат'}
                        </Text>
                        <Text fontSize="sm" color="whiteAlpha.800">
                            {panoramaMarkerState.message}
                        </Text>
                    </Box>
                )}
                {shouldKeepPanoramaVisible && (
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
                top={4}
                left={4}
                zIndex={6}
                maxW="calc(100% - 2rem)"
            >
                <GameSidebar
                    activeTask={activeTask}
                    currentUser={currentUser ?? null}
                    debugCompletingTaskId={debugCompletingTaskId}
                    hasSelectedSpot={hasSelectedSpot}
                    isStartingGame={isStartingGame}
                    isDebugMode={isDebugMode}
                    session={session}
                    onCompleteTaskForDebug={handleCompleteTaskForDebug}
                />
            </Box>

            {resolvedViewerState.panoramaAddress && (
                <HStack
                    position="absolute"
                    top={4}
                    right={4}
                    zIndex={8}
                    px={3}
                    py={2}
                    borderRadius="lg"
                    bg="blackAlpha.700"
                    color="white"
                    maxW={{
                        base: 'calc(100% - 2rem)',
                        md: '560px',
                    }}
                    pointerEvents="auto"
                >
                    <Text fontWeight="600" fontSize="lg" lineClamp={1}>
                        {resolvedViewerState.panoramaAddress}
                    </Text>
                    {resolvedViewerState.isLoading && <Spinner size="sm" />}
                </HStack>
            )}

            {shouldKeepPanoramaVisible && (
                <ActionBar.Root open>
                    <Portal>
                        <ActionBar.Positioner pb={4} zIndex={30}>
                            <ActionBar.Content color="white" boxShadow="2xl">
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
