'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Square, Tag, Clock, Check, Circle, Trash2 } from 'lucide-react';
import type { Activity, Session } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import QuestionBuilder from './QuestionBuilder';

interface QuizTabProps {
    sessionId: string;
    session: Session;
    activities: Activity[];
    currentActivity: Activity | null;
    onRefresh?: () => void;
}

type SubTab = 'queue' | 'builder';

export default function QuizTab({ sessionId, session, activities, currentActivity, onRefresh }: QuizTabProps) {
    const [subTab, setSubTab] = useState<SubTab>('queue');
    const [loading, setLoading] = useState(false);

    const quizActivities = activities.filter((a) =>
        ['quiz', 'poll', 'icebreaker', 'open_question'].includes(a.type)
    );

    const firstPending = quizActivities.find((a) => a.state === 'pending');
    const nextPending = currentActivity
        ? quizActivities.find((a) => a.state === 'pending' && a.sort_order > (currentActivity.sort_order ?? -1))
        : firstPending;
    const completedCount = quizActivities.filter((a) => a.state === 'completed').length;
    const isInQuestion = session.state === 'question';
    const isLobbyOrActive = session.state === 'lobby' || session.state === 'active';

    // ── Auto-advance countdown ─────────────────────────────
    const [countdown, setCountdown] = useState<number | null>(null);
    const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Clear any previous timer
        if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);

        if (!isInQuestion || !currentActivity?.config?.time_limit_seconds) {
            setCountdown(null);
            return;
        }

        const totalSeconds = currentActivity.config.time_limit_seconds as number;
        setCountdown(totalSeconds);

        // Tick countdown every second
        let remaining = totalSeconds;
        const intervalId = setInterval(() => {
            remaining -= 1;
            setCountdown(remaining);
            if (remaining <= 0) {
                clearInterval(intervalId);
                // Auto-advance after a short pause so players can see "time's up"
                autoAdvanceRef.current = setTimeout(() => {
                    finishCurrent();
                }, 1500);
            }
        }, 1000);

        return () => {
            clearInterval(intervalId);
            if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentActivity?.id, isInQuestion]);

    const launchActivity = async (activityId: string) => {
        setLoading(true);
        const supabase = createClient();
        if (currentActivity) {
            await supabase.from('activities').update({ state: 'completed' }).eq('id', currentActivity.id);
        }
        await supabase.from('activities').update({ state: 'active' }).eq('id', activityId);
        await supabase.from('sessions').update({ state: 'question', current_activity_id: activityId }).eq('id', sessionId);
        setLoading(false);
    };

    const pauseSession = async () => {
        const supabase = createClient();
        if (currentActivity) {
            await supabase.from('activities').update({ state: 'pending' }).eq('id', currentActivity.id);
        }
        await supabase.from('sessions').update({ state: 'lobby', current_activity_id: null }).eq('id', sessionId);
    };

    const finishCurrent = async () => {
        setLoading(true);
        const supabase = createClient();
        if (currentActivity) {
            await supabase.from('activities').update({ state: 'completed' }).eq('id', currentActivity.id);
        }

        // Return to active state waiting for host to manually choose next activity
        await supabase.from('sessions').update({ state: 'active', current_activity_id: null }).eq('id', sessionId);
        setLoading(false);
    };

    const deleteActivity = async (activityId: string) => {
        await fetch(`/api/activities?id=${activityId}`, { method: 'DELETE' });
        onRefresh?.();
    };

    const handleQuestionsAdded = useCallback(() => {
        onRefresh?.();
        setSubTab('queue');
    }, [onRefresh]);

    // ── Determine what the main CTA button should be ──────────
    const primaryAction = (() => {
        if (quizActivities.length === 0) return null;

        if (isLobbyOrActive && firstPending) {
            return {
                label: completedCount === 0 ? 'Iniciar Quiz' : 'Continuar Quiz',
                icon: <Play size={16} fill="currentColor" />,
                onClick: () => launchActivity(firstPending.id),
                style: { background: '#faff00' },
                textColor: 'text-[#0f0f0f]',
            };
        }

        if (isInQuestion) {
            return {
                label: '⏹ Finalizar Actividad',
                icon: <Square size={16} />,
                onClick: finishCurrent,
                style: { background: 'var(--accent-1)' },
                textColor: 'text-[var(--text-primary)]',
            };
        }

        return null;
    })();

    return (
        <div className="flex flex-col gap-5 max-w-2xl">
            {/* Sub-tab navigation */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0f0f1a' }}>
                {([
                    { key: 'queue', label: `Cola (${quizActivities.length})` },
                    { key: 'builder', label: '+ Crear preguntas' },
                ] as { key: SubTab; label: string }[]).map(({ key, label }) => (
                    <button
                        key={key}
                        id={`subtab-${key}`}
                        onClick={() => setSubTab(key)}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-black transition-all ${subTab === key ? 'text-[#0f0f0f]' : 'text-[#a0a0b0] hover:text-[var(--text-primary)]'
                            }`}
                        style={{ background: subTab === key ? '#faff00' : 'transparent' }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {subTab === 'builder' && (
                <QuestionBuilder sessionId={sessionId} onQuestionsAdded={handleQuestionsAdded} />
            )}

            {subTab === 'queue' && (
                <>
                    {/* ── Status bar ── */}
                    {quizActivities.length > 0 && (
                        <div className="neo-card p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-[#a0a0b0]">
                                    Completadas{' '}
                                    <strong className="text-[var(--text-primary)]">{completedCount}/{quizActivities.length}</strong>
                                </span>
                                {currentActivity && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"
                                            style={{ background: 'var(--accent-3)', color: '#0f0f0f' }}>
                                            ● EN VIVO
                                        </span>
                                        {countdown !== null && (
                                            <span
                                                className="text-sm font-black tabular-nums"
                                                style={{ color: countdown <= 5 ? 'var(--accent-1)' : '#faff00' }}
                                            >
                                                ⏱ {countdown}s
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                                {/* Pause — only when question is active */}
                                {isInQuestion && (
                                    <button
                                        id="pause-btn"
                                        onClick={pauseSession}
                                        className="neo-btn px-3 py-2 text-sm font-black text-[var(--text-primary)] flex items-center gap-2"
                                        style={{ background: '#2a2a4a' }}
                                    >
                                        <Pause size={14} /> Pausar
                                    </button>
                                )}

                                {/* Primary CTA */}
                                {primaryAction && (
                                    <button
                                        id="primary-action-btn"
                                        onClick={primaryAction.onClick}
                                        disabled={loading}
                                        className={`neo-btn px-5 py-2.5 font-black flex items-center gap-2 ${primaryAction.textColor}`}
                                        style={loading ? { background: '#888' } : primaryAction.style}
                                    >
                                        {primaryAction.icon}
                                        {loading ? 'Un momento...' : primaryAction.label}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Activity list ── */}
                    <div className="neo-card p-4 flex flex-col gap-2">
                        {quizActivities.length === 0 ? (
                            <div className="text-center py-12 text-[#a0a0b0]">
                                <p className="font-black mb-1">Sin preguntas todavía</p>
                                <p className="text-sm mb-4">Crea preguntas desde la pestaña &ldquo;+ Crear preguntas&rdquo;</p>
                                <button
                                    onClick={() => setSubTab('builder')}
                                    className="neo-btn px-4 py-2 font-black text-[#0f0f0f] text-sm"
                                    style={{ background: '#faff00' }}
                                >
                                    Crear preguntas →
                                </button>
                            </div>
                        ) : (
                            (() => {
                                // Group activities by group_name, preserving global order
                                const groups: { name: string; activities: { act: Activity; globalIndex: number }[] }[] = [];
                                let currentGroupName: string | null = null;
                                let currentGroupActivities: { act: Activity; globalIndex: number }[] = [];

                                quizActivities.forEach((act, i) => {
                                    const gName = (act.config as any).group_name || 'Preguntas generales';
                                    if (gName !== currentGroupName) {
                                        if (currentGroupActivities.length > 0) {
                                            groups.push({ name: currentGroupName!, activities: currentGroupActivities });
                                        }
                                        currentGroupName = gName;
                                        currentGroupActivities = [{ act, globalIndex: i + 1 }];
                                    } else {
                                        currentGroupActivities.push({ act, globalIndex: i + 1 });
                                    }
                                });
                                if (currentGroupActivities.length > 0) {
                                    groups.push({ name: currentGroupName!, activities: currentGroupActivities });
                                }

                                return groups.map((g, gi) => (
                                    <div key={gi} className="mb-2 last:mb-0">
                                        <div className="text-xs font-black text-[#a0a0b0] mb-2 px-1 uppercase tracking-wider">
                                            {g.name}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {g.activities.map(({ act, globalIndex }) => (
                                                <ActivityRow
                                                    key={act.id}
                                                    activity={act}
                                                    index={globalIndex}
                                                    isCurrent={currentActivity?.id === act.id}
                                                    onLaunch={() => launchActivity(act.id)}
                                                    onDelete={() => deleteActivity(act.id)}
                                                    loading={loading}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ));
                            })()
                        )}
                    </div>

                    {/* ── Live question preview ── */}
                    {currentActivity && (
                        <div
                            className="neo-card p-5"
                            style={{ borderColor: 'var(--accent-3)', borderWidth: 3 }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-black" style={{ color: 'var(--accent-3)' }}>
                                    ● PREGUNTA EN VIVO
                                </p>
                                {currentActivity.config.time_limit_seconds && (
                                    <span className="text-xs text-[#a0a0b0] flex items-center gap-1">
                                        <Clock size={11} /> {currentActivity.config.time_limit_seconds}s
                                    </span>
                                )}
                            </div>
                            <p className="font-black text-[var(--text-primary)] text-base leading-snug">
                                {currentActivity.config.question ?? currentActivity.title}
                            </p>
                            {currentActivity.config.options && (
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    {(currentActivity.config.options as string[]).map((opt, i) => (
                                        <div
                                            key={i}
                                            className={`rounded-lg px-3 py-2 text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 ${currentActivity.config.correct_index === i ? 'ring-2 ring-white ring-offset-1' : 'opacity-80'
                                                }`}
                                            style={{
                                                background: ['#ff6b6b', '#54a0ff', '#5ab651', '#f9ca24'][i],
                                            }}
                                        >
                                            {currentActivity.config.correct_index === i && <Check size={12} />}
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function ActivityRow({
    activity,
    index,
    isCurrent,
    onLaunch,
    onDelete,
    loading,
}: {
    activity: Activity;
    index: number;
    isCurrent: boolean;
    onLaunch: () => void;
    onDelete: () => void;
    loading: boolean;
}) {
    const stateIcon =
        activity.state === 'completed' ? (
            <Check size={15} className="text-green-400 flex-shrink-0" />
        ) : activity.state === 'active' ? (
            <span className="w-3.5 h-3.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        ) : (
            <Circle size={15} className="text-[#a0a0b0] flex-shrink-0" />
        );

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isCurrent ? 'bg-[#faff0015] border border-[#faff0050]' : 'hover:bg-[#0f0f1a]'
                }`}
        >
            <span className="text-[#a0a0b0] text-xs w-4 text-center flex-shrink-0">{index}</span>
            {stateIcon}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isCurrent ? 'text-[#faff00]' : activity.state === 'completed' ? 'text-[#555]' : 'text-[var(--text-primary)]'}`}>
                    {activity.config.question ?? activity.title}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[#a0a0b0] flex items-center gap-1">
                        <Tag size={9} /> {activity.type}
                    </span>
                    {activity.config.time_limit_seconds && (
                        <span className="text-xs text-[#a0a0b0] flex items-center gap-1">
                            <Clock size={9} /> {activity.config.time_limit_seconds}s
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                {activity.state === 'pending' && (
                    <button
                        id={`launch-${activity.id}`}
                        onClick={onLaunch}
                        disabled={loading}
                        title="Lanzar esta pregunta"
                        className="neo-btn px-2.5 py-1.5 text-xs font-black text-[#0f0f0f] flex items-center gap-1"
                        style={{ background: '#faff00' }}
                    >
                        <Play size={10} fill="currentColor" /> Lanzar
                    </button>
                )}
                {activity.state !== 'active' && (
                    <button
                        onClick={onDelete}
                        title="Eliminar"
                        className="p-1.5 rounded hover:bg-[#ff000020] text-[#a0a0b0] hover:text-red-400 transition-colors"
                    >
                        <Trash2 size={13} />
                    </button>
                )}
            </div>
        </div>
    );
}
