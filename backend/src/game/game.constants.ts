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

export const GAME_TASK_DIFFICULTY = {
    easy: 'EASY',
    hard: 'HARD',
    medium: 'MEDIUM',
} as const;

export const GAME_TASK_XP_REWARD = {
    easy: 10,
    hard: 40,
    medium: 25,
} as const;

export const USER_XP_PER_LEVEL = 100;

export const SOLO_GAME_TASK_POOL = [
    {
        description:
            'Ищи припаркованные или едущие велосипеды, которые заметны в кадре.',
        difficulty: GAME_TASK_DIFFICULTY.easy,
        externalId: 'solo-bicycle-easy',
        target: 'Велосипед',
        title: 'Найди велосипед',
        xpReward: GAME_TASK_XP_REWARD.easy,
    },
    {
        description:
            'Подходит городской или междугородний автобус, если он читается достаточно уверенно.',
        difficulty: GAME_TASK_DIFFICULTY.easy,
        externalId: 'solo-bus-easy',
        target: 'Автобус',
        title: 'Найди автобус',
        xpReward: GAME_TASK_XP_REWARD.easy,
    },
    {
        description:
            'Подойдёт легковой автомобиль, если он хорошо виден в рамке.',
        difficulty: GAME_TASK_DIFFICULTY.easy,
        externalId: 'solo-car-easy',
        target: 'Машина',
        title: 'Найди машину',
        xpReward: GAME_TASK_XP_REWARD.easy,
    },
    {
        description:
            'Нужен велосипед с хорошо различимым синим цветом рамы или основных элементов.',
        difficulty: GAME_TASK_DIFFICULTY.medium,
        externalId: 'solo-bicycle-blue-medium',
        target: 'Синий велосипед',
        title: 'Найди синий велосипед',
        xpReward: GAME_TASK_XP_REWARD.medium,
    },
    {
        description:
            'Ищи автобус, в котором красный цвет хорошо виден на корпусе.',
        difficulty: GAME_TASK_DIFFICULTY.medium,
        externalId: 'solo-bus-red-medium',
        target: 'Красный автобус',
        title: 'Найди красный автобус',
        xpReward: GAME_TASK_XP_REWARD.medium,
    },
    {
        description: 'Подойдёт автомобиль с заметным жёлтым цветом кузова.',
        difficulty: GAME_TASK_DIFFICULTY.medium,
        externalId: 'solo-car-yellow-medium',
        target: 'Желтая машина',
        title: 'Найди желтую машину',
        xpReward: GAME_TASK_XP_REWARD.medium,
    },
    {
        description:
            'Ищи редкий оранжевый грузовик. Лучше брать крупный и чисто видимый объект.',
        difficulty: GAME_TASK_DIFFICULTY.hard,
        externalId: 'solo-truck-orange-hard',
        target: 'Оранжевый грузовик',
        title: 'Найди оранжевый грузовик',
        xpReward: GAME_TASK_XP_REWARD.hard,
    },
    {
        description:
            'Подойдёт белый фургон, если цвет корпуса и тип транспорта читаются без сомнений.',
        difficulty: GAME_TASK_DIFFICULTY.hard,
        externalId: 'solo-van-white-hard',
        target: 'Белый фургон',
        title: 'Найди белый фургон',
        xpReward: GAME_TASK_XP_REWARD.hard,
    },
    {
        description:
            'Нужен мотоцикл с выраженным зелёным цветом. Лучше выделять объект плотно.',
        difficulty: GAME_TASK_DIFFICULTY.hard,
        externalId: 'solo-motorcycle-green-hard',
        target: 'Зеленый мотоцикл',
        title: 'Найди зеленый мотоцикл',
        xpReward: GAME_TASK_XP_REWARD.hard,
    },
] as const;

export const SOLO_GAME_TASK_COUNT = 3;
