'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSessionChannel, useParticipants, useActivityUpdates, useMatchUpdates, useHostBroadcast } from '@/lib/realtime/hooks';
import QuizOptions from '@/components/player/QuizOptions';
import PollVote from '@/components/player/PollVote';
import WordCloudInput from '@/components/player/WordCloudInput';
import MatchCard from '@/components/player/MatchCard';
import NeobrutalistCountdown from '@/components/shared/Countdown';
import { Users, Trophy, Clock, ArrowLeft, Medal, ArrowRight } from 'lucide-react';
import { PROFESSION_LABELS } from '@/lib/types';

export default function PlayPage({
    params,
}: {
    params: Promise<{ sessionId: string }>;
}) {
    const { sessionId } = use(params);
    const router = useRouter();
    const session = useSessionChannel(sessionId);
    const participants = useParticipants(sessionId);
    const { currentActivity } = useActivityUpdates(sessionId);
    const matches = useMatchUpdates(sessionId, session?.current_round ?? 1);
    const [answered, setAnswered] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [activeSessions, setActiveSessions] = useState<{ id: string; title: string; pin: string }[]>([]);
    const [scoreEarned, setScoreEarned] = useState(0);
    const [showScoreToast, setShowScoreToast] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(`ec_participant_${sessionId}`);
        if (stored) setParticipantId(stored);
    }, [sessionId]);

    useEffect(() => {
        if (session?.state === 'results' || session?.state === 'closed') {
            fetch('/api/sessions/active')
                .then(res => res.json())
                .then(data => setActiveSessions(data.sessions || []))
                .catch(console.error);
        }
    }, [session?.state]);

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
        setScoreEarned(0);
        setShowScoreToast(false);
        if (currentActivity?.config?.time_limit_seconds) {
            setTimeLeft(currentActivity.config.time_limit_seconds);
        }
    }, [currentActivity?.id]);

    const handleAnswer = async (index: number) => {
        if (answered || !participantId || !currentActivity) return;
        setAnswered(true);
        setSelectedAnswer(index);

        try {
            const res = await fetch('/api/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activity_id: currentActivity.id,
                    participant_id: participantId,
                    value: { selected_index: index }
                })
            });
            const json = await res.json();
            if (json.score_earned > 0) {
                setScoreEarned(json.score_earned);
                setShowScoreToast(true);
                setTimeout(() => setShowScoreToast(false), 2500);
            }
        } catch (e) {
            console.error('Error enviando respuesta', e);
        }
    };

    const handleWordsSubmit = async (words: string[]) => {
        if (answered || !participantId || !currentActivity) return;
        setAnswered(true);

        try {
            await fetch('/api/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activity_id: currentActivity.id,
                    participant_id: participantId,
                    value: { words }
                })
            });
        } catch (e) {
            console.error('Error enviando palabras', e);
        }
    };

    const myParticipant = participants.find((p) => p.id === participantId);

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }} aria-live="polite" aria-busy="true">
                <div className="text-white font-black text-xl animate-pulse">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <Link href={`/participants/${sessionId}`} aria-label="Volver al directorio" className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[var(--neo-black)] hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)]" title="Volver al directorio">
                        <ArrowLeft size={16} aria-hidden="true" />
                    </Link>
                    <span className="font-black text-[var(--text-primary)]">
                        Event<span style={{ color: 'var(--accent-1)' }}>Connect</span>
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]" aria-label={`Participantes conectados: ${participants.length}`}>
                    <Users size={14} aria-hidden="true" />
                    <span className="font-bold text-[var(--text-primary)]">{participants.length}</span>
                </div>
            </header>

            <main className="flex-1 flex flex-col px-4 py-6 max-w-sm mx-auto w-full">
                {/* LOBBY STATE */}
                {session.state === 'lobby' && (
                    <div className="flex flex-col flex-1 gap-4 w-full" aria-live="polite">
                        {/* Header card */}
                        <div className="neo-card-bright p-6 w-full text-center">
                            <div className="text-3xl mb-2" aria-hidden="true">🎉</div>
                            <h2 className="text-xl font-black text-[#0f0f0f]">¡Ya estás en el evento!</h2>
                            <p className="text-[#444] text-sm mt-1">Espera a que el host inicie una actividad...</p>
                        </div>

                        {/* Participants grid */}
                        <div className="neo-card p-4 w-full flex flex-col gap-3 flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-[#a0a0b0] uppercase tracking-wide">
                                    👥 Conectados ahora
                                </p>
                                <span
                                    className="text-xs font-black px-2 py-0.5 rounded-full"
                                    style={{ background: 'var(--accent-3)', color: '#0f0f0f' }}
                                >
                                    {participants.length}
                                </span>
                            </div>

                            <div className="flex flex-col gap-2 overflow-y-auto max-h-96">
                                {participants.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center gap-3 p-2.5 rounded-xl"
                                        style={{ background: '#1e1e3a' }}
                                    >
                                        <span className="text-2xl flex-shrink-0">{p.avatar_emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-white truncate">{p.display_name}</p>
                                            <p className="text-xs text-[#a0a0b0]">{PROFESSION_LABELS[p.profession]}</p>
                                        </div>
                                    </div>
                                ))}
                                {participants.length === 0 && (
                                    <p className="text-xs text-[#a0a0b0] text-center py-4">Aún no hay más asistentes...</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ACTIVE WAITING STATE — leaderboard if scores exist, else waiting */}
                {session.state === 'active' && !currentActivity && (() => {
                    const scored = [...participants].filter(p => p.score > 0).sort((a, b) => b.score - a.score);
                    if (scored.length === 0) {
                        return (
                            <div className="flex flex-col items-center justify-center flex-1 text-center gap-6" aria-live="polite">
                                <div className="neo-card-bright p-8 w-full" style={{ background: 'var(--accent-3)', borderColor: 'var(--neo-black)' }}>
                                    <div className="text-4xl mb-3" aria-hidden="true">👀</div>
                                    <h2 className="text-2xl font-black text-[#0f0f0f]">Prepárate</h2>
                                    <p className="text-[#0f0f0f] mt-2 font-bold">El host está preparando la siguiente actividad...</p>
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div className="flex flex-col gap-4 w-full" aria-live="polite">
                            <div className="neo-card p-5 text-center" style={{ background: '#faff00', borderColor: '#0f0f0f' }}>
                                <div className="text-3xl mb-1" aria-hidden="true">🏆</div>
                                <h2 className="text-xl font-black text-[#0f0f0f]">Leaderboard</h2>
                                <p className="text-[#0f0f0f] text-sm font-bold">Esperando la próxima pregunta...</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {scored.map((p, i) => {
                                    const isMe = p.id === participantId;
                                    return (
                                        <div
                                            key={p.id}
                                            className="neo-card flex items-center gap-3 px-4 py-3"
                                            style={{
                                                background: isMe ? '#faff0020' : i === 0 ? '#faff0010' : 'var(--bg-card)',
                                                borderColor: isMe ? '#faff00' : 'var(--neo-black)',
                                                borderWidth: isMe ? 3 : undefined,
                                            }}
                                            aria-label={`Posición ${i + 1}: ${p.display_name}, ${p.score} puntos${isMe ? ' (tú)' : ''}`}
                                        >
                                            <div className="w-6 text-center flex-shrink-0">
                                                {i === 0 ? <Trophy size={18} style={{ color: '#faff00' }} /> :
                                                    i === 1 ? <Medal size={18} style={{ color: '#c0c0c0' }} /> :
                                                        i === 2 ? <Medal size={18} style={{ color: '#cd7f32' }} /> :
                                                            <span className="text-sm font-black text-[var(--text-secondary)]">{i + 1}</span>}
                                            </div>
                                            <span className="text-xl flex-shrink-0">{p.avatar_emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-sm text-[var(--text-primary)] truncate">
                                                    {p.display_name}{isMe && <span className="ml-1 text-[#faff00]">← tú</span>}
                                                </p>
                                            </div>
                                            <span className="font-black text-[var(--accent-3)]" aria-hidden="true">
                                                {p.score} pts
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}


                {/* QUIZ STATE */}
                {(session.state === 'question' || session.state === 'active') && currentActivity?.type === 'quiz' && (
                    <div className="flex flex-col gap-5">
                        {/* Countdown & Score Header */}
                        <div className="flex flex-col items-center justify-between gap-4">
                            <div className="w-full">
                                <NeobrutalistCountdown
                                    totalSeconds={currentActivity.config.time_limit_seconds || 30}
                                    timeLeft={timeLeft}
                                    label="TIEMPO RESTANTE"
                                />
                            </div>
                            <div className="relative flex items-center self-end gap-1.5 px-3 py-1.5 rounded-full border-2 border-[var(--neo-black)] text-[var(--accent-3)] bg-[var(--bg-card)]" aria-label={`Puntaje actual: ${myParticipant?.score ?? 0} puntos`}>
                                <Trophy size={14} aria-hidden="true" />
                                <span className="font-black">{myParticipant?.score ?? 0} pts</span>
                                {/* +10 pts toast */}
                                {showScoreToast && (
                                    <span
                                        className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full text-xs font-black text-[#0f0f0f] whitespace-nowrap"
                                        style={{
                                            background: '#faff00',
                                            border: '2px solid #0f0f0f',
                                            animation: 'scorePopUp 2.5s ease forwards',
                                        }}
                                        aria-live="polite"
                                    >
                                        +{scoreEarned} pts ✅
                                    </span>
                                )}
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
                            <div className="neo-card p-6 text-center" aria-live="polite">
                                <div className="text-4xl mb-2" aria-hidden="true">
                                    {scoreEarned > 0 ? '🎯' : '📨'}
                                </div>
                                <p className="font-black text-[var(--text-primary)]">
                                    {scoreEarned > 0 ? '¡Correcto! +' + scoreEarned + ' pts' : '¡Respuesta enviada!'}
                                </p>
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

                {/* WORDCLOUD STATE */}
                {session.state === 'voting' && currentActivity?.type === 'wordcloud' && (
                    <WordCloudInput
                        prompt={currentActivity.config.prompt ?? currentActivity.config.question ?? currentActivity.title}
                        maxWords={currentActivity.config.max_words ?? 3}
                        onAnswer={handleWordsSubmit}
                        answered={answered}
                    />
                )}

                {/* RESULTS STATE */}
                {session.state === 'results' && (
                    <div className="flex flex-col gap-5 w-full" aria-live="polite">
                        {myParticipant?.score === 0 && (
                            <div className="neo-card-bright p-5 w-full text-center bg-[#f0f0f0] border-dashed border-[#888]">
                                <div className="text-3xl mb-2" aria-hidden="true">👀</div>
                                <h3 className="font-black text-[#0f0f0f]">Modo Espectador</h3>
                                <p className="text-sm mt-1 text-[#555]">Llegaste cuando las actividades terminaron, pero mira quiénes ganaron.</p>
                            </div>
                        )}
                        <div className="neo-card-bright p-6 text-center w-full mb-2">
                            <div className="text-4xl mb-2" aria-hidden="true">🏆</div>
                            <h2 className="text-2xl font-black text-[#0f0f0f]">Resultados Finales</h2>
                        </div>
                        <div className="flex flex-col gap-3">
                            {[...participants]
                                .filter(p => p.score > 0 || p.id === participantId) // Hide 0 pointers except self if they played
                                .filter(p => session.state !== 'results' || p.score > 0) // Strictly hide 0 pointers in results
                                .sort((a, b) => b.score - a.score)
                                .map((p, i) => (
                                    <div
                                        key={p.id}
                                        className="neo-card flex items-center gap-4 px-4 py-3"
                                        style={{
                                            background: i === 0 ? '#faff0015' : i === 1 ? '#ffffff08' : 'var(--bg-card)',
                                            borderColor: i === 0 ? '#faff00' : 'var(--neo-black)',
                                        }}
                                    >
                                        <div className="w-6 text-center flex-shrink-0" aria-label={`Posición ${i + 1}`}>
                                            {i === 0 ? (
                                                <Trophy size={18} style={{ color: '#faff00' }} aria-hidden="true" />
                                            ) : i === 1 ? (
                                                <Medal size={18} style={{ color: '#c0c0c0' }} aria-hidden="true" />
                                            ) : i === 2 ? (
                                                <Medal size={18} style={{ color: '#cd7f32' }} aria-hidden="true" />
                                            ) : (
                                                <span className="text-sm font-black text-[var(--text-secondary)]">{i + 1}</span>
                                            )}
                                        </div>
                                        <span className="text-xl" aria-hidden="true">{p.avatar_emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-[var(--text-primary)] truncate text-sm">{p.display_name}</p>
                                            <p className="text-xs text-[var(--text-secondary)]">{PROFESSION_LABELS[p.profession]}</p>
                                        </div>
                                        <span className="text-lg font-black" style={{ color: i === 0 ? '#faff00' : 'var(--accent-3)' }} aria-label={`${p.score} puntos`}>
                                            {p.score.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                        </div>

                        {(myParticipant?.score === 0) && (
                            <div className="mt-6 border-t-2 border-dashed border-[#444] pt-6">
                                <h3 className="font-black text-[var(--text-primary)] mb-4">Otras sesiones activas:</h3>
                                {activeSessions.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        {activeSessions.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => router.push(`/join?pin=${s.pin}`)}
                                                className="neo-card flex items-center justify-between p-4 hover:bg-[var(--accent-1)] hover:text-black transition-colors group text-left"
                                            >
                                                <div>
                                                    <p className="font-black group-hover:text-black text-[var(--text-primary)]">{s.title}</p>
                                                    <p className="text-xs text-[var(--text-secondary)] group-hover:text-black/70">PIN: {s.pin.substring(0, 3)} {s.pin.substring(3)}</p>
                                                </div>
                                                <ArrowRight size={18} className="text-[var(--text-primary)] group-hover:text-black" />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm font-bold text-[var(--text-secondary)] mb-8">Actualmente no hay otras sesiones abiertas.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* CLOSED STATE */}
                {session.state === 'closed' && (
                    <div className="flex flex-col items-center justify-center flex-1 gap-6" aria-live="polite">
                        <div className="neo-card p-8 w-full text-center">
                            <div className="text-4xl mb-3" aria-hidden="true">🎉</div>
                            <h2 className="text-2xl font-black text-[var(--text-primary)]">¡Evento terminado!</h2>
                            <p className="text-[var(--text-secondary)] mt-2">Gracias por participar. ¡Sigue conectando!</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
