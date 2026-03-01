'use client';

import { Users, ZapOff, MessageSquare, Timer, Trophy } from 'lucide-react';
import type { Participant } from '@/lib/types';

interface LiveStatsProps {
    participants: Participant[];
}

export default function LiveStats({ participants }: LiveStatsProps) {
    const active = participants.filter((p) => p.is_active).length;
    const topScore = Math.max(0, ...participants.map((p) => p.score));

    const stats = [
        { icon: <Users size={14} />, label: 'Conectados', value: active, color: 'var(--accent-3)' },
        { icon: <Trophy size={14} />, label: 'Top Score', value: topScore.toLocaleString(), color: 'var(--accent-4)' },
    ];

    return (
        <div className="neo-card p-4">
            <p className="text-xs font-black text-[#a0a0b0] mb-3">ESTADÍSTICAS EN VIVO</p>
            <div className="flex flex-col gap-3">
                {stats.map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#a0a0b0] text-xs">
                            <span style={{ color: s.color }}>{s.icon}</span>
                            {s.label}
                        </div>
                        <span className="font-black text-[var(--text-primary)] text-sm">{s.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
