interface LngLat {
    lat: number;
    lng: number;
}

export interface MapillaryImageGeometry {
    coordinates: [number, number];
    type: string;
}

export interface MapillaryImage {
    id: string;
    computed_geometry?: MapillaryImageGeometry;
    thumb_1024_url?: string;
    thumb_2048_url?: string;
    thumb_original_url?: string;
}

interface MapillaryImagesResponse {
    data?: MapillaryImage[];
}

const SEARCH_DELTAS = [0.0007, 0.002, 0.006, 0.015];

export class MapillaryApiError extends Error {
    status: number;

    constructor(status: number, statusText: string) {
        super(`Mapillary API вернул ${status} ${statusText}.`);
        this.name = 'MapillaryApiError';
        this.status = status;
    }
}

const buildBbox = ({ lat, lng }: LngLat, delta: number) =>
    [lng - delta, lat - delta, lng + delta, lat + delta].join(',');

const hasComputedGeometry = (
    image: MapillaryImage
): image is MapillaryImage & {
    computed_geometry: MapillaryImageGeometry;
} =>
    Array.isArray(image.computed_geometry?.coordinates) &&
    image.computed_geometry.coordinates.length === 2 &&
    Number.isFinite(image.computed_geometry.coordinates[0]) &&
    Number.isFinite(image.computed_geometry.coordinates[1]);

const getDistanceScore = (origin: LngLat, image: MapillaryImage) => {
    if (!hasComputedGeometry(image)) {
        return Number.POSITIVE_INFINITY;
    }

    const [imageLng, imageLat] = image.computed_geometry.coordinates;

    return Math.hypot(origin.lat - imageLat, origin.lng - imageLng);
};

const resolveBestImageUrl = (image: MapillaryImage) =>
    image.thumb_2048_url ?? image.thumb_original_url ?? image.thumb_1024_url;

const mapResolvedImage = (image: MapillaryImage) => ({
    ...image,
    thumb_1024_url: resolveBestImageUrl(image) ?? image.thumb_1024_url,
});

export const listMapillaryImagesInBbox = async (
    bbox: [number, number, number, number],
    accessToken: string,
    limit = 24
) => {
    const params = new URLSearchParams({
        access_token: accessToken,
        bbox: bbox.join(','),
        fields: 'id,computed_geometry,thumb_1024_url,thumb_2048_url,thumb_original_url',
        is_pano: 'true',
        limit: String(limit),
    });

    const response = await fetch(
        `https://graph.mapillary.com/images?${params.toString()}`
    );

    if (!response.ok) {
        throw new MapillaryApiError(response.status, response.statusText);
    }

    const payload = (await response.json()) as MapillaryImagesResponse;

    return (payload.data ?? [])
        .filter(hasComputedGeometry)
        .map(mapResolvedImage);
};

export const findNearestMapillaryImage = async (
    location: LngLat,
    accessToken: string
) => {
    for (const delta of SEARCH_DELTAS) {
        const params = new URLSearchParams({
            access_token: accessToken,
            bbox: buildBbox(location, delta),
            fields: 'id,computed_geometry,thumb_1024_url,thumb_2048_url,thumb_original_url',
            is_pano: 'true',
            limit: '10',
        });

        const response = await fetch(
            `https://graph.mapillary.com/images?${params.toString()}`
        );

        if (!response.ok) {
            throw new MapillaryApiError(response.status, response.statusText);
        }

        const payload = (await response.json()) as MapillaryImagesResponse;
        const images = payload.data ?? [];

        const validImages = images.filter(hasComputedGeometry);

        if (validImages.length > 0) {
            const nearestImage = validImages.sort(
                (left, right) =>
                    getDistanceScore(location, left) -
                    getDistanceScore(location, right)
            )[0];

            return mapResolvedImage(nearestImage);
        }
    }

    return null;
};

export const getMapillaryImageById = async (
    imageId: string,
    accessToken: string
) => {
    const params = new URLSearchParams({
        access_token: accessToken,
        fields: 'id,computed_geometry,thumb_1024_url,thumb_2048_url,thumb_original_url',
    });

    const response = await fetch(
        `https://graph.mapillary.com/${imageId}?${params.toString()}`
    );

    if (!response.ok) {
        throw new MapillaryApiError(response.status, response.statusText);
    }

    const image = (await response.json()) as MapillaryImage;

    if (!hasComputedGeometry(image)) {
        throw new Error(
            `Mapillary image ${imageId} does not contain computed geometry.`
        );
    }

    return mapResolvedImage(image);
};
