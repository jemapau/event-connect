// Matching algorithm: interest-based (Jaccard) and random

interface Participant {
    id: string;
    interests: string[];
    profession: string;
}

export type MatchingMode = 'random' | 'interests' | 'rounds';

export interface MatchResult {
    pairs: Array<[string, string]>;
    waiting: string | null;
}

export function generateMatches(
    participants: Participant[],
    previousMatches: Set<string>,
    mode: MatchingMode = 'interests'
): MatchResult {
    if (participants.length < 2) {
        return { pairs: [], waiting: participants[0]?.id ?? null };
    }
    if (mode === 'random') {
        return generateRandomMatches(participants, previousMatches);
    }
    return generateInterestMatches(participants, previousMatches);
}

function generateInterestMatches(
    participants: Participant[],
    previousMatches: Set<string>
): MatchResult {
    const scores: Array<{ a: string; b: string; score: number }> = [];

    for (let i = 0; i < participants.length; i++) {
        for (let j = i + 1; j < participants.length; j++) {
            const a = participants[i];
            const b = participants[j];
            const pairKey = [a.id, b.id].sort().join('-');
            if (previousMatches.has(pairKey)) continue;

            const shared = a.interests.filter((interest) =>
                b.interests.includes(interest)
            ).length;
            const total = new Set([...a.interests, ...b.interests]).size;
            const score = total > 0 ? shared / total : 0; // Jaccard similarity
            scores.push({ a: a.id, b: b.id, score });
        }
    }

    // Greedy matching: take the best available pair, remove, repeat
    scores.sort((x, y) => y.score - x.score);
    const matched = new Set<string>();
    const pairs: Array<[string, string]> = [];

    for (const { a, b } of scores) {
        if (!matched.has(a) && !matched.has(b)) {
            pairs.push([a, b]);
            matched.add(a);
            matched.add(b);
        }
    }

    // Handle odd number (someone waits)
    const waiting = participants.find((p) => !matched.has(p.id))?.id ?? null;

    return { pairs, waiting };
}

function generateRandomMatches(
    participants: Participant[],
    _previousMatches: Set<string>
): MatchResult {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const pairs: Array<[string, string]> = [];

    for (let i = 0; i < shuffled.length - 1; i += 2) {
        pairs.push([shuffled[i].id, shuffled[i + 1].id]);
    }

    const waiting =
        shuffled.length % 2 !== 0 ? shuffled[shuffled.length - 1].id : null;

    return { pairs, waiting };
}
