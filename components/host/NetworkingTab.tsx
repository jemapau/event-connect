'use client';

import { useState } from 'react';
import { SkipForward, Shuffle, Users } from 'lucide-react';
import type { Participant, Session } from '@/lib/types';

interface NetworkingTabProps {
    sessionId: string;
    session: Session;
    participants: Participant[];
}

const ICEBREAKERS = [
    '¿Cuál fue tu último proyecto de diseño favorito?',
    '¿Qué herramienta no podrías vivir sin ella?',
    '¿En qué proyecto te gustaría trabajar?',
    '¿Cuál es tu mayor reto hoy en diseño?',
    '¿Qué aprendiste en el último mes?',
];

export default function NetworkingTab({ sessionId, session, participants }: NetworkingTabProps) {
    const [mode, setMode] = useState<'random' | 'interests' | 'rounds'>(session.matching_mode);
    const [icebreaker, setIcebreaker] = useState(ICEBREAKERS[0]);
    const [loading, setLoading] = useState(false);
    const [groupSize, setGroupSize] = useState<number>(2);
    const [currentMatches, setCurrentMatches] = useState<string[][]>([]);
    const [waitingId, setWaitingId] = useState<string | null>(null);

    const startRound = async (reshuffle = false) => {
        setLoading(true);
        const nextRound = reshuffle ? session.current_round : session.current_round + 1;

        const res = await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                round: nextRound,
                mode,
                icebreaker,
                group_size: groupSize,
            }),
        });

        const data = await res.json();
        if (data.groups) {
            setCurrentMatches(data.groups);
            setWaitingId(data.waiting);
        }
        setLoading(false);
    };

    const getName = (id: string) =>
        participants.find((p) => p.id === id)?.display_name ?? id.slice(0, 8);
    const getEmoji = (id: string) =>
        participants.find((p) => p.id === id)?.avatar_emoji ?? '😊';

    const modes: { value: 'random' | 'interests' | 'rounds'; label: string }[] = [
        { value: 'interests', label: 'Por Intereses' },
        { value: 'random', label: 'Aleatorio' },
        { value: 'rounds', label: 'Rondas' },
    ];

    const groupSizes = [
        { value: 2, label: 'Parejas (2)' },
        { value: 3, label: 'Tríos (3)' },
        { value: 4, label: 'Grupos (4)' },
        { value: 5, label: 'Equipos (5)' },
    ];

    return (
        <div className="flex flex-col gap-5 max-w-2xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-[var(--text-primary)]">Networking</h2>
                    <p className="text-sm text-[#a0a0b0]">
                        Ronda {session.current_round} de {session.total_rounds}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        id="next-round-btn"
                        onClick={() => startRound(false)}
                        disabled={loading || session.current_round >= session.total_rounds}
                        className="neo-btn px-5 py-2.5 font-black text-[#0f0f0f]"
                        style={{ background: loading ? '#888' : '#faff00' }}
                    >
                        <SkipForward size={16} /> Siguiente Ronda
                    </button>
                    <button
                        id="reshuffle-btn"
                        onClick={() => startRound(true)}
                        disabled={loading}
                        className="neo-btn px-4 py-2.5 font-black text-[var(--text-primary)]"
                        style={{ background: 'var(--bg-card)' }}
                    >
                        <Shuffle size={16} /> Re-mezclar
                    </button>
                </div>
            </div>

            {/* Mode selector */}
            <div className="neo-card p-4">
                <p className="text-xs font-black text-[#a0a0b0] mb-3">MODO DE EMPAREJAMIENTO</p>
                <div className="flex gap-2">
                    {modes.map((m) => (
                        <button
                            key={m.value}
                            id={`matching-mode-${m.value}`}
                            onClick={() => setMode(m.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-black border-2 transition-all ${mode === m.value
                                ? 'border-black bg-[#faff00] text-[#0f0f0f]'
                                : 'border-[#2a2a4a] text-[#a0a0b0] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Group size selector */}
            <div className="neo-card p-4">
                <p className="text-xs font-black text-[#a0a0b0] mb-3">TAMAÑO DEL EQUIPO</p>
                <div className="flex flex-wrap gap-2">
                    {groupSizes.map((g) => (
                        <button
                            key={g.value}
                            onClick={() => setGroupSize(g.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-black border-2 transition-all ${groupSize === g.value
                                ? 'border-black bg-[#faff00] text-[#0f0f0f]'
                                : 'border-[#2a2a4a] text-[#a0a0b0] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            {g.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Icebreaker selector */}
            <div className="neo-card p-4">
                <p className="text-xs font-black text-[#a0a0b0] mb-3">ICEBREAKER ACTUAL</p>
                <div className="flex flex-col gap-2">
                    {ICEBREAKERS.map((ice) => (
                        <label
                            key={ice}
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all ${icebreaker === ice
                                ? 'border-[#faff00] bg-[#faff0015]'
                                : 'border-transparent hover:border-[#2a2a4a]'
                                }`}
                        >
                            <input
                                type="radio"
                                name="icebreaker"
                                checked={icebreaker === ice}
                                onChange={() => setIcebreaker(ice)}
                                className="mt-0.5 accent-[#faff00]"
                            />
                            <span className="text-sm text-[var(--text-primary)]">&ldquo;{ice}&rdquo;</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Current groups */}
            {currentMatches.length > 0 && (
                <div className="neo-card p-4">
                    <p className="text-xs font-black text-[#a0a0b0] mb-3">
                        EQUIPOS ACTIVOS ({currentMatches.length})
                    </p>
                    <div className="flex flex-col gap-2">
                        {currentMatches.map((group, i) => (
                            <div
                                key={i}
                                className="flex flex-wrap items-center gap-3 p-3 rounded-lg"
                                style={{ background: '#0f0f1a' }}
                            >
                                <span className="text-xs font-black text-[var(--accent-1)] mr-2">Equipo #{i + 1}</span>
                                {group.map((id, idx) => (
                                    <div key={id} className="flex items-center gap-2">
                                        {idx > 0 && <span className="text-[#a0a0b0] font-bold mx-1">+</span>}
                                        <span className="text-lg">{getEmoji(id)}</span>
                                        <span className="text-sm font-bold text-[var(--text-primary)]">{getName(id)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                        {waitingId && (
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-[#2a2a4a]">
                                <span className="text-lg">{getEmoji(waitingId)}</span>
                                <span className="text-sm font-bold text-[#a0a0b0]">
                                    {getName(waitingId)} — en espera
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* No participants */}
            {participants.length < 2 && (
                <div className="neo-card p-8 text-center">
                    <Users size={32} className="mx-auto mb-3 text-[#a0a0b0]" />
                    <p className="font-black text-[var(--text-primary)] mb-1">Esperando participantes</p>
                    <p className="text-sm text-[#a0a0b0]">Necesitas al menos 2 asistentes para iniciar matchmaking</p>
                </div>
            )}
        </div>
    );
}
