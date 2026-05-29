export const formatFinishedAt = (finishedAt: string | null) => {
    if (!finishedAt) {
        return 'Только что';
    }

    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
    }).format(new Date(finishedAt));
};

export const getSessionModeLabel = (mode: 'SOLO' | 'MULTIPLAYER') => {
    return mode === 'MULTIPLAYER' ? 'Мультиплеер' : 'Одиночная';
};
