'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Zap, Users, ChevronRight, LogOut, Key, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPin } from '@/lib/utils/pin';
import type { Session } from '@/lib/types';
import { ThemeToggle } from '@/components/ThemeToggle';

type AuthState = 'loading' | 'unauthenticated' | 'authenticated' | 'no-supabase';

export default function HostDashboard() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [authState, setAuthState] = useState<AuthState>('loading');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder');

    useEffect(() => {
        if (isPlaceholder) {
            setAuthState('no-supabase');
            return;
        }

        const supabase = createClient();
        supabase.auth.getUser()
            .then(({ data: { user }, error }) => {
                if (error || !user) {
                    setAuthState('unauthenticated');
                    return;
                }
                setUserEmail(user.email ?? '');
                setAuthState('authenticated');
                return fetch('/api/sessions')
                    .then((r) => r.json())
                    .then(({ sessions }) => setSessions(sessions ?? []));
            })
            .catch(() => setAuthState('no-supabase'));
    }, [isPlaceholder]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoggingIn(true);
        setLoginError('');
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setLoginError(error.message);
            setLoggingIn(false);
        } else {
            window.location.reload();
        }
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setAuthState('unauthenticated');
    };

    // ── No Supabase configured ──────────────────────────
    if (authState === 'no-supabase') {
        return (
            <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
                <header className="flex items-center justify-between px-6 py-5 border-b border-[#2a2a4a]">
                    <Link href="/" className="text-xl font-black text-[var(--text-primary)]">
                        Event<span style={{ color: 'var(--accent-1)' }}>Connect</span>
                    </Link>
                </header>
                <div className="max-w-2xl mx-auto px-6 py-16">
                    <div className="neo-card-bright p-8 mb-6 text-center">
                        <Key size={48} className="mx-auto mb-4" />
                        <h1 className="text-2xl font-black text-[#0f0f0f] mb-2">
                            Configura Supabase para continuar
                        </h1>
                        <p className="text-[#333]">El backend necesita credenciales reales de Supabase para funcionar.</p>
                    </div>

                    <div className="neo-card p-6 flex flex-col gap-4">
                        <h2 className="font-black text-[var(--text-primary)] text-lg">Pasos para activar el backend:</h2>
                        <div className="flex flex-col gap-3">
                            {[
                                { step: '1', text: 'Crea un proyecto gratuito en', link: 'https://supabase.com', linkText: 'supabase.com' },
                                { step: '2', text: 'Ejecuta el archivo', code: 'supabase/migrations/001_initial.sql', text2: 'en el SQL Editor de Supabase' },
                                { step: '3', text: 'Copia tus Project URL y Anon Key en el archivo', code: '.env.local' },
                                { step: '4', text: 'Reinicia el servidor con', code: 'npm run dev' },
                            ].map(({ step, text, link, linkText, code, text2 }) => (
                                <div key={step} className="flex gap-3 p-4 rounded-lg" style={{ background: '#0f0f1a' }}>
                                    <span
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                                        style={{ background: '#faff00', color: '#0f0f0f' }}
                                    >
                                        {step}
                                    </span>
                                    <p className="text-sm text-[var(--text-primary)]">
                                        {text}{' '}
                                        {link && (
                                            <a href={link} target="_blank" rel="noopener noreferrer"
                                                className="text-[#faff00] underline inline-flex items-center gap-1 font-bold">
                                                {linkText} <ExternalLink size={12} />
                                            </a>
                                        )}
                                        {code && <code className="px-1.5 py-0.5 rounded text-xs font-mono mx-1" style={{ background: '#2a2a4a' }}>{code}</code>}
                                        {text2 && text2}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 rounded-lg border border-[#2a2a4a] mt-2">
                            <p className="text-xs font-black text-[#a0a0b0] mb-2">📄 .env.local</p>
                            <pre className="text-xs text-[#faff00] font-mono leading-relaxed overflow-x-auto">{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000`}</pre>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Loading ──────────────────────────────────────────
    if (authState === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-[var(--text-primary)] font-black text-xl animate-pulse">Cargando...</div>
            </div>
        );
    }

    // ── Not authenticated — show login ───────────────────
    if (authState === 'unauthenticated') {
        return (
            <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
                <header className="flex items-center justify-between px-6 py-5 border-b border-[#2a2a4a]">
                    <Link href="/" className="text-xl font-black text-[var(--text-primary)]">
                        Event<span style={{ color: 'var(--accent-1)' }}>Connect</span>
                    </Link>
                </header>
                <div className="flex-1 flex items-center justify-center px-6">
                    <div className="neo-card p-8 w-full max-w-sm" style={{ background: '#fff' }}>
                        <h1 className="text-2xl font-black text-[#0f0f0f] mb-1">Acceso Host</h1>
                        <p className="text-sm text-[#555] mb-6">Ingresa con tu cuenta de organizador</p>
                        <form onSubmit={handleLogin} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-black text-[#0f0f0f] mb-1">Email</label>
                                <input
                                    id="login-email"
                                    className="neo-input"
                                    type="email"
                                    placeholder="host@evento.mx"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-[#0f0f0f] mb-1">Contraseña</label>
                                <input
                                    id="login-password"
                                    className="neo-input"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {loginError && (
                                <p className="text-sm font-bold" style={{ color: 'var(--accent-1)' }}>{loginError}</p>
                            )}
                            <button
                                id="login-btn"
                                type="submit"
                                disabled={loggingIn}
                                className="neo-btn w-full py-4 font-black text-[#0f0f0f]"
                                style={{ background: loggingIn ? '#888' : '#faff00' }}
                            >
                                {loggingIn ? 'Entrando...' : '🚀 Entrar como Host'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // ── Authenticated — show sessions list ───────────────
    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            <header className="flex items-center justify-between px-6 py-5 border-b border-[#2a2a4a]">
                <Link href="/" className="text-xl font-black text-[var(--text-primary)]">
                    Event<span style={{ color: 'var(--accent-1)' }}>Connect</span>
                </Link>
                <div className="flex items-center gap-3">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{userEmail}</span>
                    <ThemeToggle />
                    <button onClick={handleLogout} className="neo-btn px-3 py-2 text-sm"
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }} id="logout-btn">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)]">Mis Sesiones</h1>
                        <p className="text-[#a0a0b0] mt-1">Gestiona tus eventos de networking</p>
                    </div>
                    <Link href="/create" className="neo-btn px-5 py-3 font-black text-[#0f0f0f]"
                        style={{ background: '#faff00' }} id="create-session-btn">
                        <Plus size={18} /> Nueva Sesión
                    </Link>
                </div>

                {sessions.length === 0 ? (
                    <div className="neo-card p-16 text-center">
                        <Zap size={48} className="mx-auto mb-4" style={{ color: 'var(--accent-4)' }} />
                        <p className="text-xl font-black text-[var(--text-primary)] mb-2">Sin sesiones activas</p>
                        <p className="text-[#a0a0b0] mb-6">Crea tu primera sesión de networking</p>
                        <Link href="/create" className="neo-btn px-6 py-3 font-black text-[#0f0f0f]"
                            style={{ background: '#faff00' }}>
                            <Plus size={18} /> Crear Sesión
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {sessions.map((s) => (
                            <Link key={s.id} href={`/session/${s.id}`}
                                className="neo-card p-6 flex items-center justify-between hover:translate-x-1 transition-transform group"
                                id={`session-${s.id}`}>
                                <div>
                                    <h2 className="text-lg font-black text-[var(--text-primary)]">{s.title}</h2>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-sm font-mono font-bold text-[#a0a0b0]">
                                            PIN: {formatPin(s.pin)}
                                        </span>
                                        <StateTag state={s.state} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-sm text-[#a0a0b0]">
                                        <Users size={14} /> {s.current_round}/{s.total_rounds} rondas
                                    </div>
                                    <ChevronRight size={20} className="text-[#a0a0b0] group-hover:text-[var(--text-primary)] transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StateTag({ state }: { state: string }) {
    const map: Record<string, { label: string; color: string; bg: string }> = {
        lobby: { label: 'Lobby', color: '#0f0f0f', bg: 'var(--accent-4)' },
        active: { label: 'Activa', color: '#fff', bg: 'var(--accent-3)' },
        question: { label: 'Quiz', color: '#fff', bg: 'var(--accent-2)' },
        matching: { label: 'Matching', color: '#fff', bg: 'var(--accent-1)' },
        results: { label: 'Resultados', color: '#0f0f0f', bg: '#faff00' },
        closed: { label: 'Cerrada', color: '#fff', bg: '#555' },
    };
    const tag = map[state] ?? { label: state, color: '#fff', bg: '#555' };
    return (
        <span className="text-xs font-black px-2 py-0.5 rounded-full border-2 border-black"
            style={{ background: tag.bg, color: tag.color }}>
            {tag.label}
        </span>
    );
}
