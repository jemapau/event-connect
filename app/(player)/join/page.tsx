'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useSessionChannel } from '@/lib/realtime/hooks';

const EMOJIS = ['😊', '🚀', '🎨', '💡', '🔥', '⚡', '🌟', '🦊', '🐙', '🎯', '🦄', '🐉'];

type Profession = 'diseno_ux' | 'diseno_ui' | 'product_design' | 'otro';

const PROFESSIONS: { value: Profession; label: string; emoji: string }[] = [
    { value: 'diseno_ux', label: 'UX Design', emoji: '🗺️' },
    { value: 'diseno_ui', label: 'UI Design', emoji: '🎨' },
    { value: 'product_design', label: 'Product Design', emoji: '📦' },
    { value: 'otro', label: 'Otro', emoji: '✏️' },
];

const INTEREST_TAGS = [
    { id: 'ux', label: 'Diseño UX', emoji: '🎨' },
    { id: 'producto', label: 'Estrategia de Producto', emoji: '🚀' },
    { id: 'ia', label: 'Inteligencia Artificial', emoji: '🤖' },
    { id: 'frontend', label: 'Desarrollo Frontend', emoji: '💻' },
    { id: 'liderazgo', label: 'Liderazgo', emoji: '🤝' },
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
    const [interests, setInterests] = useState<string[]>([]);
    const [sessionId, setSessionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const session = useSessionChannel(sessionId);

    // Auto-redirect if the session is already active or question
    useEffect(() => {
        if (step === 4 && sessionId && session && session.state !== 'lobby') {
            router.push(`/play/${sessionId}`);
        }
    }, [step, sessionId, session, router]);

    const validatePin = async () => {
        const clean = pin.replace(/\s/g, '');
        if (clean.length !== 6) { setError('El PIN debe tener 6 dígitos'); return; }
        setError('');
        setStep(2);
    };

    const goToStep3 = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setStep(3);
    };

    const handleJoin = async () => {
        if (interests.length < 3) return;
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
                    interests,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? 'Error al unirse');
                return;
            }

            setSessionId(data.session.id);
            localStorage.setItem(`ec_participant_${data.session.id}`, data.participant.id);
            setStep(4);
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
                        {[1, 2, 3, 4].map((s) => (
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

                            <form onSubmit={goToStep3} className="flex flex-col gap-5">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-black text-[#0f0f0f] mb-1">Tu nombre *</label>
                                    <input
                                        id="name-input"
                                        className="neo-input"
                                        placeholder="ej: Luisa"
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
                                    id="to-step3-btn"
                                    type="submit"
                                    disabled={!name.trim() || !emoji || !profession || (profession === 'otro' && !professionCustom.trim())}
                                    className="neo-btn w-full py-4 text-[var(--accent-cta-text)] font-black transition-colors"
                                    style={{ background: (!name.trim() || !emoji || !profession || (profession === 'otro' && !professionCustom.trim())) ? '#ccc' : 'var(--accent-1)' }}
                                >
                                    Continuar <ArrowRight size={18} className="inline-block" />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 3: Interests */}
                    {step === 3 && (
                        <div className="neo-card p-8" style={{ background: '#fff' }}>
                            <h1 className="text-2xl font-black text-[#0f0f0f] mb-2">Tus intereses</h1>
                            <p className="text-sm text-[#555] mb-6">Selecciona al menos 3 temas para hacer match con personas afines.</p>

                            <div className="flex flex-col gap-3 mb-6">
                                {INTEREST_TAGS.map((tag) => {
                                    const isSelected = interests.includes(tag.label);
                                    return (
                                        <button
                                            key={tag.id}
                                            onClick={() => {
                                                if (isSelected) setInterests(ints => ints.filter(i => i !== tag.label));
                                                else setInterests(ints => [...ints, tag.label]);
                                            }}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all w-full text-left font-bold ${isSelected
                                                    ? 'border-black bg-[#faff00] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                    : 'border-[#ddd] bg-[#f5f5f5] hover:border-[#aaa]'
                                                }`}
                                        >
                                            <span className="text-xl">{tag.emoji}</span>
                                            <span className="text-[var(--text-primary)]">{tag.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mb-4">
                                <div className="h-2 w-full bg-[#f5f5f5] rounded-full overflow-hidden border border-[#ddd]">
                                    <div
                                        className="h-full transition-all duration-300"
                                        style={{
                                            width: `${Math.min(100, (interests.length / 3) * 100)}%`,
                                            background: interests.length >= 3 ? '#5ab651' : 'var(--accent-3)'
                                        }}
                                    />
                                </div>
                                <p className="text-xs font-bold text-center mt-2" style={{ color: interests.length >= 3 ? '#5ab651' : '#888' }}>
                                    {interests.length < 3 ? `Faltan ${3 - interests.length}` : '¡Listo!'}
                                </p>
                            </div>

                            {error && <p className="text-sm font-bold mb-3" style={{ color: 'var(--accent-1)' }}>{error}</p>}

                            <button
                                id="join-submit-btn"
                                onClick={handleJoin}
                                disabled={loading || interests.length < 3}
                                className="neo-btn w-full py-4 text-[var(--accent-cta-text)] font-black transition-colors"
                                style={{ background: (loading || interests.length < 3) ? '#ccc' : 'var(--accent-1)' }}
                            >
                                {loading ? 'Uniéndome...' : `${emoji} Entrar al Evento`}
                            </button>
                        </div>
                    )}

                    {/* Step 4: Ready! */}
                    {step === 4 && (
                        <div className="neo-card p-8 text-center" style={{ background: '#fff' }}>
                            <div className="text-6xl mb-4">{emoji}</div>
                            <h2 className="text-2xl font-black text-[#0f0f0f] mb-2">¡Listo, {name}!</h2>
                            <p className="text-[#555] mb-6">Ya estás en la sesión. Entrando automáticamente o haz clic en el botón.</p>
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
