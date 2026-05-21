import { useEffect, useRef, useState } from 'react';
import { Viewer } from 'mapillary-js';

import {
    findNearestMapillaryImage,
    MapillaryApiError,
} from 'shared/lib/mapillary';

import type { GameLocation, ViewerState } from '../../../lib/types';

const MAX_MAPILLARY_RETRY_ATTEMPTS = 3;
const MAPILLARY_RETRY_DELAY_MS = 700;

const INITIAL_VIEWER_STATE: ViewerState = {
    imageId: null,
    isLoading: false,
    message:
        'Выбери одну из моковых точек или кликни по карте, чтобы открыть ближайшую сферическую сцену.',
    status: 'idle',
};

const DISABLED_VIEWER_STATE: ViewerState = {
    imageId: null,
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
                            isLoading: false,
                            message:
                                'Рядом с этой точкой не нашлось публичной сферической ' +
                                'сцены. Попробуй другую кнопку или кликни в более туристическое место.',
                            status: 'error',
                        });
                        return;
                    }

                    await viewer.moveTo(image.id);

                    if (!isMounted) {
                        return;
                    }

                    setViewerState({
                        imageId: image.id,
                        isLoading: false,
                        message: `Открыт ближайший кадр Mapillary: ${image.id}`,
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

    return {
        canDrawSelection:
            viewerState.status === 'ready' &&
            !!accessToken &&
            !!selectedLocation,
        resolvedViewerState: accessToken ? viewerState : DISABLED_VIEWER_STATE,
        viewerContainerRef,
    };
};
