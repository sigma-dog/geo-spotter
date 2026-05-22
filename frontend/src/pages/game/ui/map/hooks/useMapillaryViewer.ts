import { useEffect, useRef, useState } from 'react';
import { Viewer } from 'mapillary-js';

import {
    findNearestMapillaryImage,
    getMapillaryImageById,
    MapillaryApiError,
} from 'shared/lib/mapillary';

import type {
    GameLocation,
    SelectionPayloadDraft,
    ViewerState,
} from '../../../lib/types';

const MAX_MAPILLARY_RETRY_ATTEMPTS = 3;
const MAPILLARY_RETRY_DELAY_MS = 700;
const MIN_PROJECTION_SAMPLE_POINTS = 6;
const MAX_PROJECTION_SAMPLE_POINTS = 12;

const INITIAL_VIEWER_STATE: ViewerState = {
    imageId: null,
    imageThumbUrl: null,
    isLoading: false,
    message:
        'Выбери одну из моковых точек или кликни по карте, чтобы открыть ближайшую сферическую сцену.',
    status: 'idle',
};

const DISABLED_VIEWER_STATE: ViewerState = {
    imageId: null,
    imageThumbUrl: null,
    isLoading: false,
    message:
        'Добавь `VITE_MAPILLARY_ACCESS_TOKEN` во фронтенд `.env`, чтобы включить Mapillary viewer.',
    status: 'error',
};

const wait = (ms: number) =>
    new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });

const getMapillaryErrorStatus = (error: unknown) => {
    if (error instanceof MapillaryApiError) {
        return error.status;
    }

    if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof error.status === 'number'
    ) {
        return error.status;
    }

    if (error instanceof Error) {
        const matchedStatus = error.message.match(/\b(\d{3})\b/);

        if (matchedStatus) {
            return Number(matchedStatus[1]);
        }
    }

    return null;
};

const isRetryableMapillaryError = (error: unknown) => {
    const status = getMapillaryErrorStatus(error);

    return status !== null && status >= 500 && status < 600;
};

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const getSamplePointCount = (sizePx: number) =>
    clamp(
        Math.round(sizePx / 70),
        MIN_PROJECTION_SAMPLE_POINTS,
        MAX_PROJECTION_SAMPLE_POINTS
    );

export const useMapillaryViewer = (
    accessToken: string | undefined,
    selectedLocation: GameLocation | null
) => {
    const [viewerState, setViewerState] =
        useState<ViewerState>(INITIAL_VIEWER_STATE);
    const viewerContainerRef = useRef<HTMLDivElement | null>(null);
    const viewerRef = useRef<Viewer | null>(null);

    useEffect(() => {
        if (!viewerContainerRef.current || viewerRef.current || !accessToken) {
            return;
        }

        const viewer = new Viewer({
            accessToken,
            component: {
                bearing: false,
                cover: false,
                direction: false,
                keyboard: false,
                sequence: false,
                slider: false,
                zoom: false,
            },
            container: viewerContainerRef.current,
        });

        const resizeObserver = new ResizeObserver(() => {
            viewer.resize();
        });

        resizeObserver.observe(viewerContainerRef.current);
        viewerRef.current = viewer;

        return () => {
            resizeObserver.disconnect();
            viewer.remove();
            viewerRef.current = null;
        };
    }, [accessToken]);

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!accessToken || !viewer) {
            return;
        }

        let isActive = true;

        const syncCurrentViewerImage = async () => {
            try {
                const currentImage = await viewer.getImage();
                const imageDetails = await getMapillaryImageById(
                    currentImage.id,
                    accessToken
                );

                if (!isActive) {
                    return;
                }

                setViewerState((currentState) => ({
                    ...currentState,
                    imageId: currentImage.id,
                    imageThumbUrl: imageDetails.thumb_1024_url ?? null,
                }));
            } catch (error) {
                if (!isActive) {
                    return;
                }

                console.warn('Failed to sync current Mapillary image', error);
            }
        };

        const handleViewerImage = () => {
            void syncCurrentViewerImage();
        };

        viewer.on('image', handleViewerImage);

        return () => {
            isActive = false;
            viewer.off('image', handleViewerImage);
        };
    }, [accessToken]);

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!accessToken || !viewer || !selectedLocation) {
            return;
        }

        let isMounted = true;

        const openNearestScene = async () => {
            for (
                let attempt = 1;
                attempt <= MAX_MAPILLARY_RETRY_ATTEMPTS;
                attempt += 1
            ) {
                try {
                    setViewerState((currentState) => ({
                        ...currentState,
                        isLoading: true,
                        message:
                            attempt === 1
                                ? 'Ищем ближайшую панораму Mapillary...'
                                : `Mapillary временно ответил ошибкой. Повторяем попытку ${attempt} из ${MAX_MAPILLARY_RETRY_ATTEMPTS}...`,
                        status: 'loading',
                    }));

                    const image = await findNearestMapillaryImage(
                        selectedLocation,
                        accessToken
                    );

                    if (!isMounted) {
                        return;
                    }

                    if (!image) {
                        setViewerState({
                            imageId: null,
                            imageThumbUrl: null,
                            isLoading: false,
                            message:
                                'Рядом с этой точкой не нашлось публичной сферической ' +
                                'сцены. Попробуй другую кнопку или кликни в более туристическое место.',
                            status: 'error',
                        });
                        return;
                    }

                    const movedImage = await viewer.moveTo(image.id);

                    const resolvedImage = await getMapillaryImageById(
                        movedImage.id,
                        accessToken
                    );

                    if (!isMounted) {
                        return;
                    }

                    setViewerState({
                        imageId: movedImage.id,
                        imageThumbUrl: resolvedImage.thumb_1024_url ?? null,
                        isLoading: false,
                        message: `Открыт ближайший кадр Mapillary: ${movedImage.id}`,
                        status: 'ready',
                    });

                    return;
                } catch (error) {
                    if (!isMounted) {
                        return;
                    }

                    const shouldRetry =
                        isRetryableMapillaryError(error) &&
                        attempt < MAX_MAPILLARY_RETRY_ATTEMPTS;

                    if (shouldRetry) {
                        await wait(MAPILLARY_RETRY_DELAY_MS);
                        continue;
                    }

                    setViewerState({
                        imageId: null,
                        imageThumbUrl: null,
                        isLoading: false,
                        message:
                            error instanceof Error
                                ? `${error.message} После ${attempt} попыток сцена так и не загрузилась.`
                                : 'Не удалось загрузить сцену Mapillary.',
                        status: 'error',
                    });

                    return;
                }
            }
        };

        void openNearestScene();

        return () => {
            isMounted = false;
        };
    }, [accessToken, selectedLocation]);

    const projectSelectionToBasic = async (
        selectionDraft: SelectionPayloadDraft
    ) => {
        const viewer = viewerRef.current;

        if (!viewer) {
            throw new Error('Mapillary viewer is not initialized.');
        }

        const canvas = viewer.getCanvas();
        const viewerContainer = viewerContainerRef.current;

        if (!canvas || !viewerContainer) {
            throw new Error('Mapillary viewer canvas is unavailable.');
        }

        const canvasBounds = viewerContainer.getBoundingClientRect();

        if (canvasBounds.width <= 0 || canvasBounds.height <= 0) {
            throw new Error('Mapillary viewer canvas has invalid bounds.');
        }

        const absoluteLeft =
            selectionDraft.layerBounds.left + selectionDraft.pixels.left;
        const absoluteTop =
            selectionDraft.layerBounds.top + selectionDraft.pixels.top;
        const absoluteRight = absoluteLeft + selectionDraft.pixels.width;
        const absoluteBottom = absoluteTop + selectionDraft.pixels.height;

        const left = absoluteLeft - canvasBounds.left;
        const top = absoluteTop - canvasBounds.top;
        const right = absoluteRight - canvasBounds.left;
        const bottom = absoluteBottom - canvasBounds.top;
        const sampleColumns = getSamplePointCount(selectionDraft.pixels.width);
        const sampleRows = getSamplePointCount(selectionDraft.pixels.height);
        const cornerCanvasPoints = [
            { x: left, y: top },
            { x: right, y: top },
            { x: left, y: bottom },
            { x: right, y: bottom },
        ];
        const canvasSamplePoints = Array.from(
            { length: sampleRows * sampleColumns },
            (_, index) => {
                const columnIndex = index % sampleColumns;
                const rowIndex = Math.floor(index / sampleColumns);
                const xRatio =
                    sampleColumns === 1
                        ? 0.5
                        : columnIndex / (sampleColumns - 1);
                const yRatio =
                    sampleRows === 1 ? 0.5 : rowIndex / (sampleRows - 1);

                return {
                    x: left + (right - left) * xRatio,
                    y: top + (bottom - top) * yRatio,
                };
            }
        );

        const basicSampleCandidates = await Promise.all(
            canvasSamplePoints.map((point) =>
                viewer.unprojectToBasic([point.x, point.y])
            )
        );
        const basicCornerCandidates = await Promise.all(
            cornerCanvasPoints.map((point) =>
                viewer.unprojectToBasic([point.x, point.y])
            )
        );

        const validSamplePoints = basicSampleCandidates.filter(
            (point): point is number[] =>
                Array.isArray(point) &&
                point.length === 2 &&
                Number.isFinite(point[0]) &&
                Number.isFinite(point[1])
        );
        const validCornerPoints = basicCornerCandidates.filter(
            (point): point is number[] =>
                Array.isArray(point) &&
                point.length === 2 &&
                Number.isFinite(point[0]) &&
                Number.isFinite(point[1])
        );

        if (validSamplePoints.length === 0) {
            throw new Error(
                'Failed to project current selection to source image coordinates.'
            );
        }

        const xs = validSamplePoints.map((point) => point[0]);
        const ys = validSamplePoints.map((point) => point[1]);
        const minX = Math.max(0, Math.min(...xs));
        const maxX = Math.min(1, Math.max(...xs));
        const minY = Math.max(0, Math.min(...ys));
        const maxY = Math.min(1, Math.max(...ys));

        return {
            debugInfo: {
                basicCorners: validCornerPoints.map(([x, y]) => ({ x, y })),
                basicSamplePoints: validSamplePoints.map(([x, y]) => ({
                    x,
                    y,
                })),
                canvasBounds: {
                    height: canvasBounds.height,
                    width: canvasBounds.width,
                },
                canvasPixels: {
                    height: canvas.height,
                    width: canvas.width,
                },
                canvasSamplePoints,
                canvasSelectionCorners: cornerCanvasPoints,
                overlaySelectionPixels: selectionDraft.pixels,
                overlayBounds: selectionDraft.layerBounds,
                scale: {
                    x: 1,
                    y: 1,
                },
                sampleGrid: {
                    columns: sampleColumns,
                    rows: sampleRows,
                },
            },
            selection: {
                height: Math.max(0.01, maxY - minY),
                left: minX,
                top: minY,
                width: Math.max(0.01, maxX - minX),
            },
        };
    };

    return {
        canDrawSelection:
            viewerState.status === 'ready' &&
            !!accessToken &&
            !!selectedLocation,
        projectSelectionToBasic,
        resolvedViewerState: accessToken ? viewerState : DISABLED_VIEWER_STATE,
        viewerContainerRef,
    };
};
