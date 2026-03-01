'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const EMOJIS = ['😊', '🚀', '🎨', '💡', '🔥', '⚡', '🌟', '🦊', '🐙', '🎯', '🦄', '🐉'];

type Profession = 'diseno_ux' | 'diseno_ui' | 'product_design' | 'otro';

const PROFESSIONS: { value: Profession; label: string; emoji: string }[] = [
    { value: 'diseno_ux', label: 'UX Design', emoji: '🗺️' },
    { value: 'diseno_ui', label: 'UI Design', emoji: '🎨' },
    { value: 'product_design', label: 'Product Design', emoji: '📦' },
    { value: 'otro', label: 'Otro', emoji: '✏️' },
];

function JoinPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefillPin = searchParams.get('pin') ?? '';

    const [step, setStep] = useState(prefillPin ? 2 : 1);
    const [pin, setPin] = useState(prefillPin ? `${prefillPin.slice(0, 3)} ${prefillPin.slice(3)}` : '');
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState('😊');
    const [profession, setProfession] = useState<Profession>('diseno_ux');
    const [professionCustom, setProfessionCustom] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validatePin = async () => {
        const clean = pin.replace(/\s/g, '');
        if (clean.length !== 6) { setError('El PIN debe tener 6 dígitos'); return; }
        setError('');
        setStep(2);
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin: pin.replace(/\s/g, ''),
                    display_name: name.trim(),
                    avatar_emoji: emoji,
                    profession,
                    profession_custom: profession === 'otro' ? professionCustom : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? 'Error al unirse');
                return;
            }

            setSessionId(data.session.id);
            localStorage.setItem(`ec_participant_${data.session.id}`, data.participant.id);
            setStep(3);
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const enterLobby = () => {
        router.push(`/play/${sessionId}`);
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
            <header className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
                <Link href="/" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-bold">
                    <ArrowLeft size={18} /> Inicio
                </Link>
                <span className="text-xl font-black text-[var(--text-primary)]">
                    Event<span style={{ color: 'var(--accent-1)' }}>Connect</span>
                </span>
            </header>

            <div className="flex-1 flex items-center justify-center px-6 py-10">
                <div className="w-full max-w-sm">
                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className="w-3 h-3 rounded-full border-2 border-black transition-all"
                                style={{
                                    background: step >= s ? '#faff00' : '#2a2a4a',
                                    transform: step === s ? 'scale(1.2)' : 'scale(1)',
                                }}
                            />
                        ))}
                    </div>

                    {/* Step 1: PIN */}
                    {step === 1 && (
                        <div className="neo-card p-8" style={{ background: '#fff' }}>
                            <h1 className="text-2xl font-black text-[#0f0f0f] mb-2">Ingresa el PIN</h1>
                            <p className="text-sm text-[#555] mb-6">Pide el código al organizador del evento</p>
                            <input
                                id="pin-input"
                                className="neo-input text-center text-3xl font-black tracking-widest mb-4"
                                placeholder="000 000"
                                value={pin}
                                maxLength={7}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setPin(raw.length > 3 ? `${raw.slice(0, 3)} ${raw.slice(3)}` : raw);
                                }}
                            />
                            {error && <p className="text-sm font-bold mb-3" style={{ color: 'var(--accent-1)' }}>{error}</p>}
                            <button
                                id="verify-pin-btn"
                                onClick={validatePin}
                                className="neo-btn w-full py-4 text-[var(--accent-cta-text)] font-black"
                                style={{ background: 'var(--accent-1)' }}
                            >
                                Continuar <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {/* Step 2: Name + Emoji + Profession */}
                    {step === 2 && (
                        <div className="neo-card p-8" style={{ background: '#fff' }}>
                            <h1 className="text-2xl font-black text-[#0f0f0f] mb-2">¿Quién eres?</h1>
                            <p className="text-sm text-[#555] mb-6">PIN: <strong>{pin}</strong></p>

                            <form onSubmit={handleJoin} className="flex flex-col gap-5">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-black text-[#0f0f0f] mb-1">Tu nombre *</label>
                                    <input
                                        id="name-input"
                                        className="neo-input"
                                        placeholder="Ana Martínez"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Emoji picker */}
                                <div>
                                    <label className="block text-sm font-black text-[#0f0f0f] mb-2">Tu avatar</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {EMOJIS.map((e) => (
                                            <button
                                                key={e}
                                                type="button"
                                                onClick={() => setEmoji(e)}
                                                className={`text-2xl p-2 rounded-lg border-2 transition-all ${emoji === e ? 'border-black bg-[#faff00]' : 'border-transparent bg-[#f5f5f5]'
                                                    }`}
                                            >
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Profession */}
                                <div>
                                    <label className="block text-sm font-black text-[#0f0f0f] mb-2">Tu área *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PROFESSIONS.map((p) => (
                                            <button
                                                key={p.value}
                                                type="button"
                                                id={`prof-${p.value}`}
                                                onClick={() => setProfession(p.value)}
                                                className={`p-3 rounded-lg border-2 text-left transition-all ${profession === p.value
                                                    ? 'border-black bg-[#faff00]'
                                                    : 'border-[#ddd] bg-[#f5f5f5]'
                                                    }`}
                                            >
                                                <div className="text-xl mb-1">{p.emoji}</div>
                                                <div className="text-xs font-black text-[#0f0f0f]">{p.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                    {profession === 'otro' && (
                                        <input
                                            className="neo-input mt-2"
                                            placeholder="¿Cuál es tu rol?"
                                            value={professionCustom}
                                            onChange={(e) => setProfessionCustom(e.target.value)}
                                        />
                                    )}
                                </div>

                                {error && <p className="text-sm font-bold" style={{ color: 'var(--accent-1)' }}>{error}</p>}

                                <button
                                    id="join-submit-btn"
                                    type="submit"
                                    disabled={loading || !name.trim()}
                                    className="neo-btn w-full py-4 text-[var(--accent-cta-text)] font-black"
                                    style={{ background: loading ? '#888' : 'var(--accent-1)' }}
                                >
                                    {loading ? 'Uniéndome...' : `${emoji} Entrar al Evento`}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 3: Ready! */}
                    {step === 3 && (
                        <div className="neo-card p-8 text-center" style={{ background: '#fff' }}>
                            <div className="text-6xl mb-4">{emoji}</div>
                            <h2 className="text-2xl font-black text-[#0f0f0f] mb-2">¡Listo, {name}!</h2>
                            <p className="text-[#555] mb-6">Ya estás en la sesión. Espera a que el host inicie.</p>
                            <button
                                id="enter-lobby-btn"
                                onClick={enterLobby}
                                className="neo-btn w-full py-4 font-black text-[#0f0f0f]"
                                style={{ background: '#faff00' }}
                            >
                                🎉 Entrar al Lobby
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-white font-black animate-pulse">Cargando...</div>
            </div>
        }>
            <JoinPageContent />
        </Suspense>
    );
}
