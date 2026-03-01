'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';

const DEFAULT_ACTIVITIES = [
    { title: '¿Qué es Auto Layout en Figma?', type: 'quiz', time: 15 },
    { title: '¿Para qué sirve Variants?', type: 'quiz', time: 20 },
    { title: '¿Qué plugin de Figma usas más?', type: 'poll', time: 30 },
];

const ICEBREAKERS = [
    '¿Cuál fue tu último proyecto de diseño favorito?',
    '¿Qué herramienta no podrías vivir sin ella?',
    '¿En qué proyecto te gustaría trabajar?',
    '¿Cuál es tu mayor reto hoy en diseño?',
];

export default function CreateSessionPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [matchingMode, setMatchingMode] = useState<'random' | 'interests' | 'rounds'>('interests');
    const [totalRounds, setTotalRounds] = useState(4);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, matching_mode: matchingMode, total_rounds: totalRounds }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error?.message ?? 'Error al crear la sesión');
                return;
            }

            router.push(`/session/${data.session.id}`);
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            <header className="flex items-center justify-between px-6 py-5 border-b border-[#2a2a4a]">
                <Link href="/dashboard" className="flex items-center gap-2 text-[#a0a0b0] hover:text-[var(--text-primary)] transition-colors">
                    <ArrowLeft size={18} /> Dashboard
                </Link>
                <span className="text-xl font-black text-[var(--text-primary)]">
                    Event<span style={{ color: 'var(--accent-1)' }}>Connect</span>
                </span>
            </header>

            <div className="max-w-2xl mx-auto px-6 py-10">
                <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2">Nueva Sesión</h1>
                <p className="text-[#a0a0b0] mb-8">Configura tu evento de networking</p>

                <form onSubmit={handleCreate} className="flex flex-col gap-6">
                    {/* Session Title */}
                    <div className="neo-card p-6">
                        <label className="block text-sm font-black text-[var(--text-primary)] mb-2">
                            Nombre del evento *
                        </label>
                        <input
                            id="session-title"
                            className="neo-input"
                            placeholder="ej. Figma Meetup MTY — Feb 2026"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    {/* Matching Mode */}
                    <div className="neo-card p-6">
                        <label className="block text-sm font-black text-[var(--text-primary)] mb-4">
                            Modo de matchmaking
                        </label>
                        <div className="flex flex-col gap-3">
                            {[
                                { value: 'interests', label: 'Por intereses', desc: 'Empareja personas con intereses similares (Jaccard)' },
                                { value: 'random', label: 'Aleatorio', desc: 'Mezcla aleatoria en cada ronda' },
                                { value: 'rounds', label: 'Rondas rotativas', desc: 'Todos conocen a todos en orden' },
                            ].map((m) => (
                                <label
                                    key={m.value}
                                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${matchingMode === m.value
                                            ? 'border-[#faff00] bg-[#faff0015]'
                                            : 'border-[#2a2a4a]'
                                        }`}
                                    id={`mode-${m.value}`}
                                >
                                    <input
                                        type="radio"
                                        name="matching_mode"
                                        value={m.value}
                                        checked={matchingMode === m.value as typeof matchingMode}
                                        onChange={() => setMatchingMode(m.value as typeof matchingMode)}
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="font-black text-[var(--text-primary)]">{m.label}</p>
                                        <p className="text-sm text-[#a0a0b0]">{m.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Rounds */}
                    <div className="neo-card p-6">
                        <label className="block text-sm font-black text-[var(--text-primary)] mb-2">
                            Número de rondas de networking: {totalRounds}
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={8}
                            value={totalRounds}
                            onChange={(e) => setTotalRounds(Number(e.target.value))}
                            className="w-full accent-[#faff00]"
                            id="total-rounds-slider"
                        />
                        <div className="flex justify-between text-xs text-[#a0a0b0] mt-1">
                            <span>1</span><span>8</span>
                        </div>
                    </div>

                    {/* Default activities preview */}
                    <div className="neo-card p-6">
                        <p className="text-sm font-black text-[var(--text-primary)] mb-3">
                            Actividades incluidas <span className="font-normal text-[#a0a0b0]">(puedes editar en el dashboard)</span>
                        </p>
                        <div className="flex flex-col gap-2">
                            {DEFAULT_ACTIVITIES.map((a, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#0f0f1a' }}>
                                    <span className="text-xs font-black px-2 py-0.5 rounded border border-[#2a2a4a] text-[#a0a0b0]">
                                        {a.type}
                                    </span>
                                    <span className="text-sm text-[var(--text-primary)] flex-1">{a.title}</span>
                                    <span className="text-xs text-[#a0a0b0]">{a.time}s</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-[#2a2a4a]">
                                <Plus size={14} className="text-[#a0a0b0]" />
                                <span className="text-sm text-[#a0a0b0]">Agrega más en el panel de control</span>
                            </div>
                        </div>
                    </div>

                    {/* Icebreaker preview */}
                    <div className="neo-card p-6 border-[#faff00]" style={{ borderColor: '#faff00' }}>
                        <p className="text-sm font-black text-[#faff00] mb-2">Icebreakers incluidos</p>
                        {ICEBREAKERS.map((ice, i) => (
                            <p key={i} className="text-sm text-[#a0a0b0] py-1 border-b border-[#2a2a4a] last:border-0">
                                {i + 1}. &ldquo;{ice}&rdquo;
                            </p>
                        ))}
                    </div>

                    {error && (
                        <div className="p-4 rounded-lg border-2 text-sm font-bold"
                            style={{ background: '#e9456020', borderColor: 'var(--accent-1)', color: 'var(--accent-1)' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        id="create-btn"
                        disabled={loading || !title.trim()}
                        className="neo-btn py-4 text-lg font-black text-[#0f0f0f] w-full"
                        style={{ background: loading ? '#888' : '#faff00' }}
                    >
                        {loading ? 'Creando...' : '🚀 Crear Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
}
