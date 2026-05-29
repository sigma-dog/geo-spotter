const XP_PER_LEVEL = 100;

export const getUserLevelProgress = (xp: number, level: number) => {
    const currentLevel = Math.max(level, 0);
    const currentLevelXp = currentLevel * XP_PER_LEVEL;
    const nextLevelXp = (currentLevel + 1) * XP_PER_LEVEL;
    const progressXp = Math.max(xp - currentLevelXp, 0);

    return {
        currentLevelXp,
        nextLevelXp,
        progressMaxXp: XP_PER_LEVEL,
        progressPercent: Math.min((progressXp / XP_PER_LEVEL) * 100, 100),
        progressXp,
    };
};
