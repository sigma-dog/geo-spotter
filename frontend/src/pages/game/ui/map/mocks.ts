import type { MockPanoramaSpot } from '../../lib/types';

export const MOCK_PANORAMA_SPOTS: MockPanoramaSpot[] = [
    {
        id: 'times-square',
        title: 'Нью-Йорк, Таймс-сквер',
        description: 'Плотный трафик, вывески и куча машин вокруг.',
        target: 'Желтая машина',
        location: { lat: 40.758, lng: -73.9855 },
    },
    {
        id: 'golden-gate',
        title: 'Сан-Франциско, Golden Gate View',
        description: 'Открытая точка рядом с дорогой и видом на мост.',
        target: 'Красный автобус',
        location: { lat: 37.8078, lng: -122.475 },
    },
    {
        id: 'london',
        title: 'Лондон, рядом с Биг-Беном',
        description: 'Классический туристический спот с насыщенной улицей.',
        target: 'Двухэтажный автобус',
        location: { lat: 51.5009, lng: -0.1246 },
    },
    {
        id: 'tokyo',
        title: 'Токио, Shibuya Crossing',
        description: 'Много пешеходов, вывесок и городской суеты.',
        target: 'Велосипед',
        location: { lat: 35.6595, lng: 139.7005 },
    },
    {
        id: 'paris',
        title: 'Париж, рядом с Эйфелевой башней',
        description: 'Открытая панорама с туристической зоной и дорогой.',
        target: 'Белый фургон',
        location: { lat: 48.8584, lng: 2.2945 },
    },
];
