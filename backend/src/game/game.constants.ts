export const TASK_ATTEMPT_SOURCE = {
    ai: 'ai',
    mock: 'mock',
} as const;

export const TASK_ATTEMPT_VERDICT = {
    match: 'match',
    noMatch: 'no_match',
    uncertain: 'uncertain',
} as const;

export const TASK_ATTEMPT_STATUS = {
    completed: 'COMPLETED',
    failed: 'FAILED',
    pending: 'PENDING',
} as const;

export const GAME_SESSION_MODE = {
    multiplayer: 'MULTIPLAYER',
    solo: 'SOLO',
} as const;

export const GAME_SESSION_STATUS = {
    abandoned: 'ABANDONED',
    active: 'ACTIVE',
    completed: 'COMPLETED',
} as const;

export const GAME_SESSION_TASK_STATUS = {
    completed: 'COMPLETED',
    pending: 'PENDING',
} as const;

export const SOLO_GAME_TASK_POOL = [
    {
        externalId: 'solo-backpack',
        title: 'Найди рюкзак',
        description:
            'Подойдут рюкзаки, ранцы или похожие сумки, которые видны достаточно отчётливо.',
        target: 'Рюкзак',
    },
    {
        externalId: 'solo-bicycle',
        title: 'Найди велосипед',
        description:
            'Ищи припаркованные или едущие велосипеды, которые заметны в кадре.',
        target: 'Велосипед',
    },
    {
        externalId: 'solo-bench',
        title: 'Найди скамейку',
        description:
            'Подойдёт уличная скамейка или лавочка, если она хорошо читается в выделении.',
        target: 'Скамейка',
    },
    {
        externalId: 'solo-bus',
        title: 'Найди автобус',
        description:
            'Подходит городской, междугородний или школьный автобус, если он попал в рамку целиком или крупно.',
        target: 'Автобус',
    },
    {
        externalId: 'solo-fire-hydrant',
        title: 'Найди пожарный гидрант',
        description:
            'Ищи гидранты на тротуарах и у дорог. Лучше выделять объект плотно, без лишнего фона.',
        target: 'Пожарный гидрант',
    },
    {
        externalId: 'solo-motorcycle',
        title: 'Найди мотоцикл',
        description:
            'Подойдут мотоциклы, скутеры и похожий мототранспорт, если они хорошо видны в кадре.',
        target: 'Мотоцикл',
    },
    {
        externalId: 'solo-traffic-light',
        title: 'Найди светофор',
        description:
            'Ищи уличные светофоры. Лучше не брать слишком далёкие объекты.',
        target: 'Светофор',
    },
    {
        externalId: 'solo-trash-can',
        title: 'Найди урну',
        description:
            'Подойдут уличные мусорные урны и контейнеры небольшого размера.',
        target: 'Урна',
    },
    {
        externalId: 'solo-stop-sign',
        title: 'Найди дорожный знак',
        description:
            'Подходит крупный дорожный знак, если его форма и стойка различимы.',
        target: 'Дорожный знак',
    },
] as const;

export const SOLO_GAME_TASK_COUNT = 3;
