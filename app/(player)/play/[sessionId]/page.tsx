'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSessionChannel, useParticipants, useActivityUpdates, useMatchUpdates, useHostBroadcast } from '@/lib/realtime/hooks';
import QuizOptions from '@/components/player/QuizOptions';
import PollVote from '@/components/player/PollVote';
import MatchCard from '@/components/player/MatchCard';
import { Users, Trophy, Clock, ArrowLeft } from 'lucide-react';

export default function PlayPage({
    params,
}: {
    params: Promise<{ sessionId: string }>;
}) {
    const { sessionId } = use(params);
    const session = useSessionChannel(sessionId);
    const participants = useParticipants(sessionId);
    const { currentActivity } = useActivityUpdates(sessionId);
    const matches = useMatchUpdates(sessionId, session?.current_round ?? 1);
    const [answered, setAnswered] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [participantId, setParticipantId] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(`ec_participant_${sessionId}`);
        if (stored) setParticipantId(stored);
    }, [sessionId]);

    // Handle host broadcasts
    const handleBroadcast = useCallback((event: string, payload: unknown) => {
        if (event === 'countdown') {
            setTimeLeft((payload as { seconds: number }).seconds);
        }
    }, []);
    useHostBroadcast(sessionId, handleBroadcast);

    // Timer countdown
    useEffect(() => {
        if (timeLeft <= 0) return;
        const t = setInterval(() => setTimeLeft((n) => Math.max(0, n - 1)), 1000);
        return () => clearInterval(t);
    }, [timeLeft]);

    // Reset on new activity
    useEffect(() => {
        setAnswered(false);
        setSelectedAnswer(null);
        if (currentActivity?.config?.time_limit_seconds) {
            setTimeLeft(currentActivity.config.time_limit_seconds);
        }
    }, [currentActivity?.id]);

    const handleAnswer = async (index: number) => {
        if (answered || !participantId || !currentActivity) return;
        setAnswered(true);
        setSelectedAnswer(index);

        try {
            await fetch('/api/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activity_id: currentActivity.id,
                    participant_id: participantId,
                    value: { selected_index: index }
                })
            });
        } catch (e) {
            console.error('Error enviando respuesta', e);
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-white font-black text-xl animate-pulse">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[var(--neo-black)] hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)]" title="Volver al inicio">
                        <ArrowLeft size={16} />
                    </Link>
                    <span className="font-black text-[var(--text-primary)]">
                        Event<span style={{ color: 'var(--accent-1)' }}>Connect</span>
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Users size={14} />
                    <span className="font-bold text-[var(--text-primary)]">{participants.length}</span>
                </div>
            </header>

            <main className="flex-1 flex flex-col px-4 py-6 max-w-sm mx-auto w-full">
                {/* LOBBY STATE */}
                {session.state === 'lobby' && (
                    <div className="flex flex-col items-center justify-center flex-1 text-center gap-6">
                        <div className="neo-card-bright p-8 w-full">
                            <div className="text-4xl mb-3">⏳</div>
                            <h2 className="text-2xl font-black text-[#0f0f0f]">Sala de Espera</h2>
                            <p className="text-[#333] mt-2">El host iniciará en breve...</p>
                        </div>
                        <div className="neo-card p-5 w-full text-left">
                            <p className="text-sm font-black text-[#a0a0b0] mb-3">
                                Participantes conectados ({participants.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {participants.map((p) => (
                                    <span key={p.id} className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold border border-[#2a2a4a] text-white">
                                        {p.avatar_emoji} {p.display_name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* QUIZ STATE */}
                {(session.state === 'question' || session.state === 'active') && currentActivity?.type === 'quiz' && (
                    <div className="flex flex-col gap-5">
                        {/* Timer + Score */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white font-black">
                                <Clock size={18} style={{ color: timeLeft < 5 ? 'var(--accent-1)' : 'var(--accent-3)' }} />
                                <span className="text-2xl" style={{ color: timeLeft < 5 ? 'var(--accent-1)' : 'var(--accent-3)' }}>
                                    {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-[#a0a0b0] text-sm">
                                <Trophy size={14} />
                                <span className="font-bold text-white">0 pts</span>
                            </div>
                        </div>

                        {/* Question */}
                        <div className="neo-card p-5">
                            <p className="text-xs font-black text-[var(--text-secondary)] mb-2">PREGUNTA</p>
                            <p className="text-lg font-black text-[var(--text-primary)] leading-tight">
                                {currentActivity.config.question ?? currentActivity.title}
                            </p>
                        </div>

                        {/* Options */}
                        {answered ? (
                            <div className="neo-card p-6 text-center">
                                <div className="text-4xl mb-2">✅</div>
                                <p className="font-black text-[var(--text-primary)]">¡Respuesta enviada!</p>
                                <p className="text-[var(--text-secondary)] text-sm mt-1">Esperando resultados...</p>
                            </div>
                        ) : (
                            <QuizOptions
                                options={currentActivity.config.options ?? []}
                                onAnswer={handleAnswer}
                                selectedIndex={selectedAnswer}
                            />
                        )}
                    </div>
                )}

                {/* MATCHING STATE */}
                {session.state === 'matching' && (
                    <MatchCard
                        sessionId={sessionId}
                        session={session}
                        matches={matches}
                        participants={participants}
                        round={session.current_round}
                        totalRounds={session.total_rounds}
                        icebreaker={session.current_icebreaker ?? '¿Cuéntame de tu proyecto actual?'}
                    />
                )}

                {/* VOTING STATE */}
                {session.state === 'voting' && currentActivity?.type === 'poll' && (
                    <PollVote
                        question={currentActivity.config.question ?? currentActivity.title}
                        options={currentActivity.config.options ?? []}
                        onAnswer={handleAnswer}
                        answered={answered}
                        selectedIndex={selectedAnswer}
                    />
                )}

                {/* RESULTS STATE */}
                {session.state === 'results' && (
                    <div className="flex flex-col items-center justify-center flex-1 gap-6">
                        <div className="neo-card-bright p-8 w-full text-center">
                            <div className="text-4xl mb-3">🏆</div>
                            <h2 className="text-2xl font-black text-[#0f0f0f]">Resultados</h2>
                            <p className="text-[#333] mt-2">El host está mostrando el leaderboard...</p>
                        </div>
                    </div>
                )}

                {/* CLOSED STATE */}
                {session.state === 'closed' && (
                    <div className="flex flex-col items-center justify-center flex-1 gap-6">
                        <div className="neo-card p-8 w-full text-center">
                            <div className="text-4xl mb-3">🎉</div>
                            <h2 className="text-2xl font-black text-[var(--text-primary)]">¡Evento terminado!</h2>
                            <p className="text-[var(--text-secondary)] mt-2">Gracias por participar. ¡Sigue conectando!</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
