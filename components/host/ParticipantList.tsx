'use client';

import type { Participant } from '@/lib/types';
import { PROFESSION_LABELS } from '@/lib/types';

interface ParticipantListProps {
    participants: Participant[];
}

export default function ParticipantList({ participants }: ParticipantListProps) {
    return (
        <div className="neo-card p-4 flex-1 overflow-hidden">
            <p className="text-xs font-black text-[#a0a0b0] mb-3">ASISTENTES ({participants.length})</p>
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                {participants.map((p) => (
                    <div
                        key={p.id}
                        className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ background: '#0f0f1a' }}
                    >
                        <span className="text-lg">{p.avatar_emoji}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[var(--text-primary)] truncate">{p.display_name}</p>
                            <p className="text-xs text-[#a0a0b0]">{PROFESSION_LABELS[p.profession]}</p>
                        </div>
                        <span className="text-xs font-black text-[#faff00]">{p.score}</span>
                    </div>
                ))}
                {participants.length === 0 && (
                    <p className="text-xs text-[#a0a0b0] text-center py-4">
                        Esperando asistentes...
                    </p>
                )}
            </div>
        </div>
    );
}
