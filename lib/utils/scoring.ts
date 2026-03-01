// Quiz scoring logic

/**
 * Calculate score for a quiz response
 * Base points (1000) + speed bonus (up to 500)
 */
export function calculateScore(
    isCorrect: boolean,
    responseTimeMs: number,
    timeLimitMs: number
): number {
    if (!isCorrect) return 0;
    const BASE_POINTS = 1000;
    const timeRatio = Math.max(0, 1 - responseTimeMs / timeLimitMs);
    const speedBonus = Math.round(timeRatio * 500);
    return BASE_POINTS + speedBonus;
}
