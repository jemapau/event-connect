'use client';

import { Trophy, Medal } from 'lucide-react';
import type { Participant } from '@/lib/types';
import { PROFESSION_LABELS } from '@/lib/types';

interface ResultsTabProps {
    sessionId: string;
    participants: Participant[];
}

export default function ResultsTab({ sessionId: _, participants }: ResultsTabProps) {
    const sorted = [...participants].sort((a, b) => b.score - a.score);

    return (
        <div className="flex flex-col gap-5 max-w-xl">
            <h2 className="text-xl font-black text-[var(--text-primary)]">Leaderboard</h2>

            {sorted.length === 0 ? (
                <div className="neo-card p-12 text-center">
                    <Trophy size={40} className="mx-auto mb-3 text-[#a0a0b0]" />
                    <p className="font-black text-[var(--text-primary)]">Sin puntajes aún</p>
                    <p className="text-sm text-[#a0a0b0] mt-1">Inicia una ronda de quiz para ver el ranking</p>
                </div>
            ) : (
                <div className="neo-card overflow-hidden">
                    {sorted.map((p, i) => (
                        <div
                            key={p.id}
                            className={`flex items-center gap-4 px-5 py-4 border-b border-[#2a2a4a] last:border-0`}
                            style={{
                                background: i === 0 ? '#faff0015' : i === 1 ? '#ffffff08' : 'transparent',
                            }}
                        >
                            {/* Position */}
                            <div className="w-8 text-center">
                                {i === 0 ? (
                                    <Trophy size={20} style={{ color: '#faff00' }} />
                                ) : i === 1 ? (
                                    <Medal size={20} style={{ color: '#c0c0c0' }} />
                                ) : i === 2 ? (
                                    <Medal size={20} style={{ color: '#cd7f32' }} />
                                ) : (
                                    <span className="text-sm font-black text-[#a0a0b0]">{i + 1}</span>
                                )}
                            </div>

                            {/* Avatar + Name */}
                            <span className="text-xl">{p.avatar_emoji}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-[var(--text-primary)] truncate">{p.display_name}</p>
                                <p className="text-xs text-[#a0a0b0]">{PROFESSION_LABELS[p.profession]}</p>
                            </div>

                            {/* Score */}
                            <span
                                className="text-lg font-black"
                                style={{ color: i === 0 ? '#faff00' : 'var(--accent-3)' }}
                            >
                                {p.score.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
