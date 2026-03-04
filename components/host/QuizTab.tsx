'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, Check, ChevronDown, ChevronUp, Layers, Trash2, Sparkles } from 'lucide-react';
import type { Activity, Session } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import QuestionBuilder from './QuestionBuilder';

const DEMO_QUESTIONS = [
    { title: 'Components', type: 'quiz' as const, config: { question: '¿Qué función de Figma permite reutilizar elementos de diseño (como botones, iconos o tarjetas) en múltiples pantallas?', options: ['Auto Layout', 'Components (Componentes)', 'Frames', 'Variants'], correct_index: 1, time_limit_seconds: 5 } },
    { title: 'Auto Layout', type: 'quiz' as const, config: { question: '¿Cómo se llama la funcionalidad de Figma que genera diseños responsivos y flexibles automáticamente?', options: ['Constraints', 'Grid Layout', 'Auto Layout', 'Smart Animate'], correct_index: 2, time_limit_seconds: 5 } },
    { title: 'Team Project', type: 'quiz' as const, config: { question: '¿Cuál es el nombre del espacio en Figma donde los equipos comparten y gestionan archivos colaborativamente?', options: ['Workspace', 'Team Project', 'Design Hub', 'Canvas'], correct_index: 1, time_limit_seconds: 5 } },
    { title: 'Prototype', type: 'quiz' as const, config: { question: '¿Qué herramienta de Figma permite crear animaciones y transiciones entre frames para simular una app?', options: ['FigJam', 'Dev Mode', 'Prototype', 'Inspect'], correct_index: 2, time_limit_seconds: 5 } },
    { title: 'FigJam', type: 'quiz' as const, config: { question: '¿Qué es FigJam y para qué se usa principalmente?', options: ['Un plugin para exportar assets', 'Una pizarra online para lluvia de ideas y colaboración', 'Un modo de revisión de código', 'Una biblioteca de componentes de UI'], correct_index: 1, time_limit_seconds: 5 } },
];

interface QuizTabProps {
    sessionId: string;
    session: Session;
    activities: Activity[];
    currentActivity: Activity | null;
    onRefresh?: () => void;
}

type SubTab = 'queue' | 'builder';

// Build ordered, unique groups from the activity list
function buildGroups(activities: Activity[]) {
    const map = new Map<string, Activity[]>();
    for (const act of activities) {
        const key: string = (act.config as any).group_name || 'Sin título';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(act);
    }
    return Array.from(map.entries()).map(([name, acts]) => ({ name, acts }));
}

export default function QuizTab({ sessionId, session, activities, currentActivity, onRefresh }: QuizTabProps) {
    const [subTab, setSubTab] = useState<SubTab>('queue');
    const [loading, setLoading] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [loadingDemo, setLoadingDemo] = useState(false);
    const [demoError, setDemoError] = useState('');

    const quizActivities = activities.filter((a) =>
        ['quiz', 'poll', 'icebreaker', 'open_question'].includes(a.type)
    );

    const groups = buildGroups(quizActivities);

    const isInQuestion = session.state === 'question';
    const isLobbyOrActive = session.state === 'lobby' || session.state === 'active';

    // ── Auto-advance countdown ──────────────────────────────
    const [countdown, setCountdown] = useState<number | null>(null);
    const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
        if (!isInQuestion || !currentActivity?.config?.time_limit_seconds) {
            setCountdown(null);
            return;
        }
        const totalSeconds = currentActivity.config.time_limit_seconds as number;
        setCountdown(totalSeconds);
        let remaining = totalSeconds;
        const intervalId = setInterval(() => {
            remaining -= 1;
            setCountdown(remaining);
            if (remaining <= 0) {
                clearInterval(intervalId);
                autoAdvanceRef.current = setTimeout(() => finishCurrent(), 1500);
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

    // Launch the first pending question of a group
    const launchGroup = async (groupActs: Activity[]) => {
        const first = groupActs.find((a) => a.state === 'pending');
        if (!first) return;
        await launchActivity(first.id);
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
        // Auto-advance to next pending question within same group
        const currentGroupName = (currentActivity?.config as any)?.group_name;
        const nextInGroup = quizActivities.find(
            (a) => a.state === 'pending' && (a.config as any).group_name === currentGroupName
        );
        if (nextInGroup) {
            await supabase.from('activities').update({ state: 'active' }).eq('id', nextInGroup.id);
            await supabase.from('sessions').update({ state: 'question', current_activity_id: nextInGroup.id }).eq('id', sessionId);
        } else {
            await supabase.from('sessions').update({ state: 'active', current_activity_id: null }).eq('id', sessionId);
        }
        setLoading(false);
    };

    const deleteGroup = async (groupActs: Activity[]) => {
        await Promise.all(
            groupActs.map((a) => fetch(`/api/activities?id=${a.id}`, { method: 'DELETE' }))
        );
        onRefresh?.();
    };

    const relaunchGroup = async (groupActs: Activity[]) => {
        setLoading(true);
        await fetch('/api/activities', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: groupActs.map((a) => a.id) }),
        });
        onRefresh?.();
        setLoading(false);
    };

    const handleQuestionsAdded = useCallback(() => {
        onRefresh?.();
        setSubTab('queue');
    }, [onRefresh]);

    const existingDemoCount = groups.filter(g => g.name.startsWith('Demo Figma')).length;

    const loadDemo = async () => {
        setLoadingDemo(true);
        setDemoError('');
        const demoGroupName = existingDemoCount === 0 ? 'Demo Figma' : `Demo Figma (${existingDemoCount + 1})`;
        const res = await fetch('/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                activities: DEMO_QUESTIONS.map((q, i) => ({
                    ...q,
                    sort_order: i,
                    config: { ...q.config, group_name: demoGroupName },
                })),
            }),
        });
        const data = await res.json();
        if (!res.ok) setDemoError(data.error ?? 'Error al cargar demo');
        else { onRefresh?.(); }
        setLoadingDemo(false);
    };

    // Current group (which group is playing now)
    const currentGroupName = currentActivity ? (currentActivity.config as any).group_name ?? 'Sin grupo' : null;

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* Sub-tab navigation */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0f0f1a' }}>
                {([
                    { key: 'queue', label: `Grupos (${groups.length})` },
                    { key: 'builder', label: '+ Crear preguntas' },
                ] as { key: SubTab; label: string }[]).map(({ key, label }) => (
                    <button
                        key={key}
                        id={`subtab-${key}`}
                        onClick={() => setSubTab(key)}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-black transition-all ${subTab === key ? 'text-[#0f0f0f]' : 'text-[#a0a0b0] hover:text-[var(--text-primary)]'}`}
                        style={{ background: subTab === key ? '#faff00' : 'transparent' }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {subTab === 'builder' && (
                <QuestionBuilder
                    sessionId={sessionId}
                    existingDemoCount={existingDemoCount}
                    onQuestionsAdded={handleQuestionsAdded}
                />
            )}

            {subTab === 'queue' && (
                <>
                    {/* ── Status bar ── */}
                    {isInQuestion && currentActivity && (
                        <div className="neo-card p-4 flex items-center justify-between gap-4"
                            style={{ borderColor: 'var(--accent-3)', borderWidth: 3 }}>
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"
                                        style={{ background: 'var(--accent-3)', color: '#0f0f0f' }}>
                                        ● EN VIVO
                                    </span>
                                    {countdown !== null && (
                                        <span className="text-sm font-black tabular-nums"
                                            style={{ color: countdown <= 5 ? 'var(--accent-1)' : '#faff00' }}>
                                            ⏱ {countdown}s
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-[#a0a0b0] truncate max-w-xs">
                                    {currentGroupName && <span className="font-black text-[var(--accent-3)] mr-1">{currentGroupName} —</span>}
                                    {currentActivity.config.question ?? currentActivity.title}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button id="pause-btn" onClick={pauseSession}
                                    className="neo-btn px-3 py-2 text-sm font-black text-[var(--text-primary)] flex items-center gap-2"
                                    style={{ background: '#2a2a4a' }}>
                                    <Pause size={14} /> Pausar
                                </button>
                                <button id="finish-btn" onClick={finishCurrent} disabled={loading}
                                    className="neo-btn px-3 py-2 text-sm font-black flex items-center gap-2"
                                    style={{ background: loading ? '#888' : 'var(--accent-1)', color: '#0f0f0f' }}>
                                    <Square size={14} /> Siguiente
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Group cards ── */}
                    <div className="flex flex-col gap-3">
                        {groups.length === 0 ? (
                            <div className="neo-card p-10 text-center text-[#a0a0b0]">
                                <p className="font-black mb-1">Sin grupos todavía</p>
                                <p className="text-sm mb-4">Crea preguntas desde la pestaña &ldquo;+ Crear preguntas&rdquo;</p>
                                <button onClick={() => setSubTab('builder')}
                                    className="neo-btn px-4 py-2 font-black text-[#0f0f0f] text-sm"
                                    style={{ background: '#faff00' }}>
                                    Crear preguntas →
                                </button>
                            </div>
                        ) : (
                            groups.map((g) => {
                                const total = g.acts.length;
                                const done = g.acts.filter((a) => a.state === 'completed').length;
                                const pending = g.acts.filter((a) => a.state === 'pending').length;
                                const isPlaying = currentGroupName === g.name;
                                const isExpanded = expandedGroup === g.name;
                                const allDone = done === total;

                                return (
                                    <div key={g.name}
                                        className="neo-card overflow-hidden"
                                        style={isPlaying ? { borderColor: '#faff00', borderWidth: 3 } : {}}>
                                        {/* Group header */}
                                        <div className="flex items-center gap-3 px-5 py-4">
                                            <Layers size={18} className={isPlaying ? 'text-[#faff00]' : 'text-[#a0a0b0]'} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className={`font-black text-sm ${isPlaying ? 'text-[#faff00]' : 'text-[var(--text-primary)]'}`}>
                                                        {g.name}
                                                    </p>
                                                    {isPlaying && (
                                                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse"
                                                            style={{ background: '#faff00', color: '#0f0f0f' }}>
                                                            ● EN VIVO
                                                        </span>
                                                    )}
                                                    {allDone && (
                                                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                                                            style={{ background: 'var(--accent-3)', color: '#0f0f0f' }}>
                                                            ✓ Completado
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#a0a0b0] mt-0.5">
                                                    {done}/{total} preguntas completadas
                                                </p>
                                                {/* Progress bar */}
                                                <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: '#2a2a4a' }}>
                                                    <div className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${total > 0 ? (done / total) * 100 : 0}%`,
                                                            background: allDone ? 'var(--accent-3)' : '#faff00'
                                                        }} />
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {/* Launch: pending questions exist and group not active */}
                                                {!isPlaying && pending > 0 && isLobbyOrActive && (
                                                    <button
                                                        onClick={() => launchGroup(g.acts)}
                                                        disabled={loading}
                                                        className="neo-btn px-3 py-2 text-xs font-black text-[#0f0f0f] flex items-center gap-1"
                                                        style={{ background: loading ? '#888' : '#faff00' }}>
                                                        <Play size={11} fill="currentColor" /> Lanzar
                                                    </button>
                                                )}
                                                {/* Relaunch: group finished or partially run, not currently playing */}
                                                {!isPlaying && done > 0 && isLobbyOrActive && (
                                                    <button
                                                        onClick={() => relaunchGroup(g.acts)}
                                                        disabled={loading}
                                                        title="Reiniciar grupo y volver a lanzar"
                                                        className="neo-btn px-3 py-2 text-xs font-black flex items-center gap-1"
                                                        style={{ background: loading ? '#888' : '#2a2a4a', color: '#a0a0b0' }}>
                                                        ↺ Reiniciar
                                                    </button>
                                                )}
                                                {!isPlaying && (
                                                    <button
                                                        onClick={() => deleteGroup(g.acts)}
                                                        title="Eliminar grupo"
                                                        className="p-1.5 rounded hover:bg-[#ff000020] text-[#a0a0b0] hover:text-red-400 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setExpandedGroup(isExpanded ? null : g.name)}
                                                    className="p-1.5 rounded text-[#a0a0b0] hover:text-[var(--text-primary)] transition-colors">
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded question list */}
                                        {isExpanded && (
                                            <div className="border-t border-[#2a2a4a] px-4 py-3 flex flex-col gap-1.5">
                                                {g.acts.map((act, qi) => {
                                                    const isCurrent = currentActivity?.id === act.id;
                                                    return (
                                                        <div key={act.id}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border"
                                                            style={{
                                                                background: isCurrent ? '#fffbe6' : '#ffffff',
                                                                borderColor: isCurrent ? '#faff00' : '#e5e7eb',
                                                            }}>
                                                            <span className="text-[#aaa] text-xs w-4 flex-shrink-0">{qi + 1}</span>
                                                            {act.state === 'completed'
                                                                ? <Check size={13} className="text-green-500 flex-shrink-0" />
                                                                : act.state === 'active'
                                                                    ? <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                                                                    : <span className="w-3 h-3 rounded-full border-2 border-[#ccc] flex-shrink-0" />}
                                                            <p className={`flex-1 truncate text-[#0f0f0f] ${isCurrent ? 'font-black' : act.state === 'completed' ? 'line-through text-[#999]' : 'font-semibold'
                                                                }`}>
                                                                {act.config.question ?? act.title}
                                                            </p>
                                                            {act.config.time_limit_seconds && (
                                                                <span className="text-xs text-[#aaa] flex items-center gap-1 flex-shrink-0">
                                                                    <Clock size={9} />{act.config.time_limit_seconds}s
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {/* ── Demo Figma card ── */}
                    <div className="neo-card p-4 flex items-center justify-between gap-4 border-dashed">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                                <Sparkles size={14} className="text-[#faff00]" /> Demo Figma
                            </p>
                            <p className="text-xs text-[#a0a0b0] mt-0.5">5 preguntas · 5s cada una · nuevo grupo por carga</p>
                            {demoError && <p className="text-xs text-red-400 mt-1">{demoError}</p>}
                        </div>
                        <button
                            id="load-demo-btn"
                            onClick={loadDemo}
                            disabled={loadingDemo}
                            className="neo-btn px-4 py-2 text-xs font-black text-[#0f0f0f] flex items-center gap-1.5 flex-shrink-0"
                            style={{ background: loadingDemo ? '#888' : '#faff00' }}
                        >
                            <Sparkles size={12} />
                            {loadingDemo ? 'Cargando...' : 'Cargar Demo'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
