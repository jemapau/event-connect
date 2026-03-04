'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';

const DEMO_QUESTIONS = [
    {
        title: '¿Qué función permite reutilizar elementos de diseño en múltiples pantallas y actualizarlos desde un solo lugar?',
        config: {
            question: '¿Qué función de Figma permite reutilizar elementos de diseño (como botones, iconos o tarjetas) en múltiples pantallas?',
            options: ['Auto Layout', 'Components (Componentes)', 'Frames', 'Variants'],
            correct_index: 1,
            time_limit_seconds: 5,
        },
        type: 'quiz' as const,
    },
    {
        title: '¿Cómo se llama la funcionalidad que genera diseños responsivos ajustando automáticamente el espaciado?',
        config: {
            question: '¿Cómo se llama la funcionalidad de Figma que genera diseños responsivos y flexibles automáticamente?',
            options: ['Constraints', 'Grid Layout', 'Auto Layout', 'Smart Animate'],
            correct_index: 2,
            time_limit_seconds: 5,
        },
        type: 'quiz' as const,
    },
    {
        title: '¿Cuál es el nombre del espacio donde los equipos comparten y gestionan archivos de diseño?',
        config: {
            question: '¿Cuál es el nombre del espacio en Figma donde los equipos comparten y gestionan archivos colaborativamente?',
            options: ['Workspace', 'Team Project', 'Design Hub', 'Canvas'],
            correct_index: 1,
            time_limit_seconds: 5,
        },
        type: 'quiz' as const,
    },
    {
        title: '¿Qué herramienta permite crear animaciones y transiciones entre frames?',
        config: {
            question: '¿Qué herramienta de Figma permite crear animaciones y transiciones entre frames para simular una app?',
            options: ['FigJam', 'Dev Mode', 'Prototype', 'Inspect'],
            correct_index: 2,
            time_limit_seconds: 5,
        },
        type: 'quiz' as const,
    },
    {
        title: '¿Qué es FigJam y para qué se usa principalmente?',
        config: {
            question: '¿Qué es FigJam y para qué se usa principalmente?',
            options: [
                'Un plugin para exportar assets',
                'Una pizarra online para lluvia de ideas y colaboración',
                'Un modo de revisión de código',
                'Una biblioteca de componentes de UI',
            ],
            correct_index: 1,
            time_limit_seconds: 5,
        },
        type: 'quiz' as const,
    },
];

interface QuestionBuilderProps {
    sessionId: string;
    existingDemoCount?: number; // how many 'Demo Figma*' groups already exist
    onQuestionsAdded?: () => void;
}

interface DraftQuestion {
    id: string;
    question: string;
    options: [string, string, string, string];
    correct_index: number;
    time_limit_seconds: number;
}

const emptyDraft = (): DraftQuestion => ({
    id: Math.random().toString(36).slice(2),
    question: '',
    options: ['', '', '', ''],
    correct_index: 0,
    time_limit_seconds: 30,
});

export default function QuestionBuilder({ sessionId, existingDemoCount = 0, onQuestionsAdded }: QuestionBuilderProps) {
    const [drafts, setDrafts] = useState<DraftQuestion[]>([emptyDraft()]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState<string | null>(drafts[0].id);
    const [groupName, setGroupName] = useState('');

    const addQuestion = () => {
        const d = emptyDraft();
        setDrafts((prev) => [...prev, d]);
        setExpanded(d.id);
    };

    const removeQuestion = (id: string) => {
        setDrafts((prev) => {
            const next = prev.filter((d) => d.id !== id);
            return next.length > 0 ? next : [emptyDraft()];
        });
    };

    const updateDraft = (id: string, field: Partial<DraftQuestion>) => {
        setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...field } : d)));
    };

    const updateOption = (id: string, index: number, value: string) => {
        setDrafts((prev) =>
            prev.map((d) => {
                if (d.id !== id) return d;
                const options = [...d.options] as [string, string, string, string];
                options[index] = value;
                return { ...d, options };
            })
        );
    };

    const saveAll = async () => {
        // A question is valid if it has text and at least 2 filled options
        const valid = drafts
            .filter((d) => d.question.trim() && d.options.filter((o) => o.trim()).length >= 2)
            .map((d) => ({
                ...d,
                // Strip empty options and adjust correct_index if needed
                options: d.options.filter((o) => o.trim()) as [string, string, string, string],
                correct_index: Math.min(d.correct_index, d.options.filter((o) => o.trim()).length - 1),
            }));

        if (valid.length === 0) {
            setError('Completa al menos una pregunta con su texto y mínimo 2 opciones');
            return;
        }
        setSaving(true);
        setError('');
        const res = await fetch('/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                activities: valid.map((d, i) => ({
                    type: 'quiz',
                    title: d.question.slice(0, 100),
                    sort_order: i,
                    config: {
                        question: d.question,
                        options: d.options,
                        correct_index: d.correct_index,
                        time_limit_seconds: d.time_limit_seconds,
                        group_name: groupName.trim() || undefined,
                    },
                })),
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error ?? 'Error al guardar');
        } else {
            setSaved(true);
            setDrafts([emptyDraft()]);
            onQuestionsAdded?.();
            setTimeout(() => setSaved(false), 3000);
        }
        setSaving(false);
    };

    const OPTION_COLORS = ['#ff6b6b', '#54a0ff', '#5ab651', '#f9ca24'];
    const OPTION_LABELS = ['A', 'B', 'C', 'D'];
    const filledCount = drafts.filter(d => d.question.trim()).length;

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-[var(--text-primary)]">Crear Preguntas</h2>
                <button
                    id="add-question-btn"
                    onClick={addQuestion}
                    className="neo-btn px-4 py-2.5 text-sm font-black text-[#0f0f0f] flex items-center gap-2"
                    style={{ background: '#faff00' }}
                >
                    <Plus size={15} /> Nueva pregunta
                </button>
            </div>

            {/* Group Name */}
            <div className="neo-card p-4">
                <label className="block text-xs font-black text-[#a0a0b0] mb-2">NOMBRE DEL GRUPO (Opcional)</label>
                <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ej. Ronda 1, Preguntas Difíciles..."
                    className="neo-input text-sm"
                />
            </div>

            {error && (
                <div className="p-3 rounded-lg text-sm font-bold" style={{ background: '#ff000020', color: '#ff6b6b', border: '1px solid #ff6b6b' }}>
                    {error}
                </div>
            )}

            {/* Draft list */}
            <div className="flex flex-col gap-3">
                {drafts.map((d, i) => (
                    <div key={d.id} className="neo-card overflow-hidden">
                        {/* Question header / collapse toggle */}
                        <button
                            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#0f0f1a] transition-colors"
                            onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                        >
                            <span className="font-black text-[var(--text-primary)] text-sm truncate max-w-[400px]">
                                {i + 1}. {d.question || 'Nueva pregunta...'}
                            </span>
                            <div className="flex items-center gap-2">
                                {d.question && d.options.every((o) => o) && (
                                    <Check size={14} className="text-green-400" />
                                )}
                                {expanded === d.id ? <ChevronUp size={16} className="text-[#a0a0b0]" /> : <ChevronDown size={16} className="text-[#a0a0b0]" />}
                            </div>
                        </button>

                        {expanded === d.id && (
                            <div className="px-5 pb-5 flex flex-col gap-4 border-t border-[#2a2a4a]" style={{ paddingTop: '1rem' }}>
                                {/* Question text */}
                                <div>
                                    <label className="block text-xs font-black text-[#a0a0b0] mb-2">PREGUNTA *</label>
                                    <textarea
                                        id={`question-text-${i}`}
                                        className="neo-input resize-none"
                                        rows={2}
                                        placeholder="¿Cuál es la función de Auto Layout en Figma?"
                                        value={d.question}
                                        onChange={(e) => updateDraft(d.id, { question: e.target.value })}
                                    />
                                </div>

                                {/* Options */}
                                <div>
                                    <label className="block text-xs font-black text-[#a0a0b0] mb-2">OPCIONES (elige la correcta)</label>
                                    <div className="flex flex-col gap-2">
                                        {d.options.map((opt, oi) => (
                                            <div key={oi} className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateDraft(d.id, { correct_index: oi })}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black border-2 flex-shrink-0 transition-all"
                                                    style={{
                                                        background: d.correct_index === oi ? OPTION_COLORS[oi] : 'transparent',
                                                        borderColor: OPTION_COLORS[oi],
                                                        color: d.correct_index === oi ? '#fff' : OPTION_COLORS[oi],
                                                    }}
                                                    title="Marcar como correcta"
                                                >
                                                    {OPTION_LABELS[oi]}
                                                </button>
                                                <input
                                                    id={`option-${i}-${oi}`}
                                                    className="neo-input flex-1"
                                                    placeholder={`Opción ${OPTION_LABELS[oi]}`}
                                                    value={opt}
                                                    onChange={(e) => updateOption(d.id, oi, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-[#a0a0b0] mt-2">
                                        ✅ Correcta: Opción <strong style={{ color: OPTION_COLORS[d.correct_index] }}>{OPTION_LABELS[d.correct_index]}</strong>
                                    </p>
                                </div>

                                {/* Time limit */}
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-black text-[#a0a0b0] whitespace-nowrap">⏱ TIEMPO LÍMITE</label>
                                    <select
                                        id={`time-limit-${i}`}
                                        className="neo-input py-2 flex-1"
                                        value={d.time_limit_seconds}
                                        onChange={(e) => updateDraft(d.id, { time_limit_seconds: Number(e.target.value) })}
                                    >
                                        {[10, 15, 20, 30, 45, 60].map((t) => (
                                            <option key={t} value={t}>{t} segundos</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Delete */}
                                {drafts.length > 1 && (
                                    <button
                                        id={`delete-question-${i}`}
                                        onClick={() => removeQuestion(d.id)}
                                        className="flex items-center gap-2 text-xs font-bold text-[#a0a0b0] hover:text-red-400 transition-colors self-start"
                                    >
                                        <Trash2 size={13} /> Eliminar pregunta
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Save button */}
            <button
                id="save-questions-btn"
                onClick={saveAll}
                disabled={saving || saved}
                className="neo-btn w-full py-4 font-black text-[#0f0f0f] flex items-center justify-center gap-2"
                style={{ background: saved ? 'var(--accent-3)' : saving ? '#888' : '#faff00' }}
            >
                {saved ? (
                    <><Check size={18} /> ¡Preguntas guardadas!</>
                ) : saving ? (
                    'Guardando...'
                ) : (
                    <><Plus size={18} /> Guardar {filledCount} pregunta{filledCount !== 1 ? 's' : ''}</>
                )}
            </button>
        </div >
    );
}
