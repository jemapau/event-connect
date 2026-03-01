'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Users, Trophy, ArrowRight, Wifi } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { formatPin } from '@/lib/utils/pin';

export default function LandingPage() {
  const [pin, setPin] = useState('');
  const router = useRouter();

  const handlePinChange = async (rawInput: string) => {
    const raw = rawInput.replace(/\D/g, '').slice(0, 6);
    const splitFormat = raw.length > 3 ? `${raw.slice(0, 3)} ${raw.slice(3)}` : raw;
    setPin(splitFormat);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pin.replace(/\s/g, '');
    if (clean.length === 6) {
      router.push(`/join?pin=${clean}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Event<span style={{ color: 'var(--accent-blue)' }}>Connect</span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent-green)', color: '#fff' }}>
            <Wifi size={10} /> LIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="neo-btn px-5 py-2 text-sm font-black"
            style={{ background: 'var(--accent-blue)', color: '#000' }}
          >
            Soy Host <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div
          className="inline-block px-4 py-1.5 text-sm font-black mb-6 rounded-full border-2"
          style={{ background: 'var(--accent-yellow)', color: '#000', borderColor: 'var(--neo-black)' }}
        >
          🎉 NETWORKING EN TIEMPO REAL
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 max-w-3xl" style={{ color: 'var(--text-primary)' }}>
          Conecta con tu
          <br />
          <span className="gradient-text">comunidad</span> en vivo
        </h1>
        <p className="text-xl mb-12 max-w-xl" style={{ color: 'var(--text-secondary)' }}>
          Quiz interactivos, matchmaking por intereses y conexiones auténticas.
          Sin cuenta, sin descarga — solo escanea y juega.
        </p>

        {/* PIN Join Form */}
        <div className="neo-card p-8 w-full max-w-md mb-8">
          <p className="text-lg font-black mb-4" style={{ color: 'var(--text-primary)' }}>
            ¿Tienes un PIN? Únete ahora
          </p>
          <form onSubmit={handleJoin} className="flex gap-3">
            <input
              className="neo-input text-center text-2xl font-black tracking-widest"
              placeholder="000 000"
              value={pin}
              maxLength={7}
              onChange={(e) => handlePinChange(e.target.value)}
              id="pin-input"
            />
            <button
              type="submit"
              className="neo-btn px-6 py-3 font-black"
              style={{ background: 'var(--accent-blue)', color: '#fff', whiteSpace: 'nowrap' }}
              id="join-btn"
            >
              Entrar
            </button>
          </form>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mt-4">
          {[
            {
              icon: <Zap size={32} />,
              title: 'Quiz en vivo',
              desc: 'Preguntas con timer, colores y leaderboard en tiempo real.',
              color: 'var(--accent-orange)',
            },
            {
              icon: <Users size={32} />,
              title: 'Matchmaking',
              desc: 'Parejas por intereses con icebreakers para facilitar la conversación.',
              color: 'var(--accent-blue)',
            },
            {
              icon: <Trophy size={32} />,
              title: 'Leaderboard',
              desc: 'Ranking en vivo con puntos por velocidad y acierto.',
              color: 'var(--accent-yellow)',
            },
          ].map((feat) => (
            <div key={feat.title} className="neo-card p-6 text-left">
              <div className="mb-3" style={{ color: feat.color }}>{feat.icon}</div>
              <h3 className="text-lg font-black mb-1" style={{ color: 'var(--text-primary)' }}>{feat.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        EventConnect © 2026 — Built for communities
      </footer>
    </main>
  );
}
