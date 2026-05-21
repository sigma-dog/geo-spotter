interface LngLat {
    lat: number;
    lng: number;
}

interface MapillaryImageGeometry {
    coordinates: [number, number];
    type: string;
}

interface MapillaryImageItem {
    id: string;
    computed_geometry: MapillaryImageGeometry;
    thumb_1024_url?: string;
}

interface MapillaryImagesResponse {
    data?: MapillaryImageItem[];
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

const getDistanceScore = (origin: LngLat, image: MapillaryImageItem) => {
    const [imageLng, imageLat] = image.computed_geometry.coordinates;

    return Math.hypot(origin.lat - imageLat, origin.lng - imageLng);
};

export const findNearestMapillaryImage = async (
    location: LngLat,
    accessToken: string
) => {
    for (const delta of SEARCH_DELTAS) {
        const params = new URLSearchParams({
            access_token: accessToken,
            bbox: buildBbox(location, delta),
            fields: 'id,computed_geometry,thumb_1024_url',
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

        if (images.length > 0) {
            return images.sort(
                (left, right) =>
                    getDistanceScore(location, left) -
                    getDistanceScore(location, right)
            )[0];
        }
    }

    return null;
};
