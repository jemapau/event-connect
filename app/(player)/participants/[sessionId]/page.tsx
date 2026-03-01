'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSessionChannel, useParticipants } from '@/lib/realtime/hooks';
import { Users, LogOut, Play } from 'lucide-react';
import { PROFESSION_LABELS } from '@/lib/types';

export default function ParticipantsDirectoryPage({
    params,
}: {
    params: Promise<{ sessionId: string }>;
}) {
    const { sessionId } = use(params);
    const router = useRouter();
    const session = useSessionChannel(sessionId);
    const participants = useParticipants(sessionId);
    const [participantId, setParticipantId] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(`ec_participant_${sessionId}`);
        if (!stored) {
            router.push('/');
        } else {
            setParticipantId(stored);
        }
    }, [sessionId, router]);

    if (!session || !participantId) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-[var(--text-primary)] font-black text-xl animate-pulse">Cargando directorio...</div>
            </div>
        );
    }

    const myParticipant = participants.find((p) => p.id === participantId);

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[var(--neo-black)] hover:bg-[var(--bg-error-subtle)] hover:text-[var(--bg-error)] transition-colors text-[var(--text-secondary)]"
                        title="Salir del evento"
                    >
                        <LogOut size={14} />
                    </Link>
                    <span className="font-black text-[var(--text-primary)]">
                        Directorio
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Users size={14} />
                    <span className="font-bold text-[var(--text-primary)]">{participants.length}</span>
                </div>
            </header>

            <main className="flex-1 flex flex-col px-4 py-6 max-w-sm mx-auto w-full pb-28">
                {myParticipant && (
                    <div className="neo-card-bright p-5 mb-8 flex items-center gap-4 w-full">
                        <span className="text-4xl">{myParticipant.avatar_emoji}</span>
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-[var(--text-primary)] truncate text-lg">{myParticipant.display_name} (Tú)</p>
                            <p className="text-sm text-[var(--text-secondary)]">{PROFESSION_LABELS[myParticipant.profession]}</p>
                        </div>
                    </div>
                )}

                <h2 className="text-lg font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Users size={18} /> Todos los participantes
                </h2>

                <div className="flex flex-col gap-3">
                    {participants.filter(p => p.id !== participantId).map((p) => (
                        <div key={p.id} className="neo-card flex items-center gap-4 px-4 py-3" style={{ background: 'var(--bg-card)' }}>
                            <span className="text-2xl">{p.avatar_emoji}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-[var(--text-primary)] truncate text-sm">{p.display_name}</p>
                                <p className="text-xs text-[var(--text-secondary)]">{PROFESSION_LABELS[p.profession]}</p>
                            </div>
                        </div>
                    ))}

                    {participants.length <= 1 && (
                        <div className="text-center py-8 px-4 border-2 border-dashed border-[var(--border)] rounded-xl">
                            <p className="text-[var(--text-secondary)] font-bold text-sm">Eres el único aquí en este momento.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Sticky Action Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-[var(--border)]" style={{ background: 'var(--bg-primary)' }}>
                <div className="max-w-sm mx-auto w-full">
                    <Link
                        href={`/play/${sessionId}`}
                        className="neo-btn w-full py-4 text-lg font-black text-[#0f0f0f] flex items-center justify-center gap-2"
                        style={{ background: '#faff00' }}
                    >
                        <Play fill="currentColor" size={18} /> Volver al Evento
                    </Link>
                </div>
            </div>
        </div>
    );
}
