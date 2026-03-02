// Matching algorithm: interest-based (Jaccard) and random

interface Participant {
    id: string;
    interests: string[];
    profession: string;
}

export type MatchingMode = 'random' | 'interests' | 'rounds';

export interface MatchResult {
    groups: Array<string[]>;
    waiting: string | null;
}

export function generateMatches(
    participants: Participant[],
    previousMatches: Set<string>,
    mode: MatchingMode = 'interests',
    groupSize: number = 2
): MatchResult {
    if (participants.length < 2) {
        return { groups: [], waiting: participants[0]?.id ?? null };
    }
    if (mode === 'random') {
        return generateRandomMatches(participants, previousMatches, groupSize);
    }
    return generateInterestMatches(participants, previousMatches, groupSize);
}

function generateInterestMatches(
    participants: Participant[],
    previousMatches: Set<string>,
    groupSize: number
): MatchResult {
    const available = [...participants];
    const groups: Array<string[]> = [];

    const getScore = (a: Participant, b: Participant) => {
        const shared = a.interests.filter((i) => b.interests.includes(i)).length;
        const total = new Set([...a.interests, ...b.interests]).size;
        return total > 0 ? shared / total : 0;
    };

    while (available.length >= groupSize) {
        let bestPair = [0, 1];
        let maxScore = -1;

        for (let i = 0; i < available.length; i++) {
            for (let j = i + 1; j < available.length; j++) {
                const score = getScore(available[i], available[j]);
                if (score > maxScore) {
                    maxScore = score;
                    bestPair = [i, j];
                }
            }
        }

        const currentGroup = [available[bestPair[0]], available[bestPair[1]]];
        // Remove from available safely (highest index first)
        available.splice(bestPair[1], 1);
        available.splice(bestPair[0], 1);

        while (currentGroup.length < groupSize && available.length > 0) {
            let bestNextIdx = 0;
            let bestNextScore = -1;

            for (let i = 0; i < available.length; i++) {
                const candidate = available[i];
                let avgScore = 0;
                for (const member of currentGroup) {
                    avgScore += getScore(member, candidate);
                }
                avgScore /= currentGroup.length;

                if (avgScore > bestNextScore) {
                    bestNextScore = avgScore;
                    bestNextIdx = i;
                }
            }

            currentGroup.push(available[bestNextIdx]);
            available.splice(bestNextIdx, 1);
        }

        groups.push(currentGroup.map(p => p.id));
    }

    if (groups.length === 0 && available.length > 0) {
        groups.push(available.map(p => p.id));
    } else {
        let groupIdx = 0;
        while (available.length > 0) {
            const leftover = available.pop();
            if (leftover) {
                groups[groupIdx % groups.length].push(leftover.id);
                groupIdx++;
            }
        }
    }

    return { groups, waiting: null };
}

function generateRandomMatches(
    participants: Participant[],
    _previousMatches: Set<string>,
    groupSize: number
): MatchResult {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const groups: Array<string[]> = [];

    while (shuffled.length >= groupSize) {
        const group = shuffled.splice(0, groupSize);
        groups.push(group.map(p => p.id));
    }

    if (groups.length === 0 && shuffled.length > 0) {
        groups.push(shuffled.map(p => p.id));
    } else {
        let groupIdx = 0;
        while (shuffled.length > 0) {
            const leftover = shuffled.pop();
            if (leftover) {
                groups[groupIdx % groups.length].push(leftover.id);
                groupIdx++;
            }
        }
    }

    return { groups, waiting: null };
}
