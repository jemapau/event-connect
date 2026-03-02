'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSessionChannel, useParticipants } from '@/lib/realtime/hooks';
import { Users, LogOut, Play, Pencil, X, Check } from 'lucide-react';
import { PROFESSION_LABELS } from '@/lib/types';
import EmojiPicker from '@/components/shared/EmojiPicker';

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

    // Modals state
    const [showExitModal, setShowExitModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Edit form state
    const [editName, setEditName] = useState('');
    const [editEmoji, setEditEmoji] = useState('😊');
    const [editProfession, setEditProfession] = useState('otro');

    useEffect(() => {
        const stored = localStorage.getItem(`ec_participant_${sessionId}`);
        if (!stored) {
            router.push('/');
        } else {
            setParticipantId(stored);
        }
    }, [sessionId, router]);

    const myParticipant = participantId ? participants.find((p) => p.id === participantId) : undefined;

    if (!session || !participantId) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-[var(--text-primary)] font-black text-xl animate-pulse">Cargando directorio...</div>
            </div>
        );
    }

    const handleExitSession = async () => {
        if (!participantId) return;
        setIsSaving(true);
        try {
            await fetch(`/api/participants/${participantId}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Error deleting participant on exit:', error);
        } finally {
            localStorage.removeItem(`ec_participant_${sessionId}`);
            router.push('/');
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!participantId || !editName.trim()) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/participants/${participantId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    display_name: editName,
                    avatar_emoji: editEmoji,
                    profession: editProfession
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update profile');
            }
            setShowEditModal(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('No se pudieron guardar los cambios. Intenta de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowExitModal(true)}
                        className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[var(--neo-black)] hover:bg-[var(--bg-error-subtle)] hover:text-[var(--bg-error)] transition-colors text-[var(--text-secondary)]"
                        title="Salir del evento"
                    >
                        <LogOut size={14} />
                    </button>
                    <span className="font-black text-[var(--text-primary)]">
                        Salir
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Users size={14} />
                    <span className="font-bold text-[var(--text-primary)]">{participants.length}</span>
                </div>
            </header>

            <main className="flex-1 flex flex-col px-4 py-6 max-w-sm mx-auto w-full pb-28">
                {myParticipant && (
                    <div className="neo-card-bright p-5 mb-8 flex items-center justify-between gap-4 w-full">
                        <div className="flex items-center gap-4 min-w-0">
                            <span className="text-4xl">{myParticipant.avatar_emoji}</span>
                            <div className="min-w-0">
                                <p className="font-black text-[var(--text-primary)] truncate text-lg">{myParticipant.display_name} (Tú)</p>
                                <p className="text-sm text-[var(--text-secondary)]">{PROFESSION_LABELS[myParticipant.profession]}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (myParticipant) {
                                    setEditName(myParticipant.display_name);
                                    setEditEmoji(myParticipant.avatar_emoji || '😊');
                                    setEditProfession(myParticipant.profession || 'otro');
                                }
                                setShowEditModal(true);
                            }}
                            className="p-2 border-2 border-[var(--neo-black)] rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                            title="Editar Perfil"
                        >
                            <Pencil size={16} />
                        </button>
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

            {/* EXIT CONFIRMATION MODAL */}
            {showExitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="neo-card p-6 w-full max-w-sm bg-white origin-bottom animate-in slide-in-from-bottom-8 zoom-in-95">
                        <div className="text-4xl mb-4 text-center">👋</div>
                        <h3 className="text-xl font-black text-center text-[#0f0f0f] mb-2">¿Estás seguro/a de abandonar la sesión?</h3>
                        <p className="text-sm text-center text-[#555] mb-6">Al salir tendrás que volver a ingresar el PIN si quieres volver.</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleExitSession}
                                disabled={isSaving}
                                className="neo-btn py-3 font-black text-white w-full border-[#d90429]"
                                style={{ background: isSaving ? '#888' : '#d90429' }}
                            >
                                {isSaving ? 'Saliendo...' : 'Sí, salir'}
                            </button>
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="py-3 font-black text-[#555] hover:text-[#0f0f0f] w-full"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT PROFILE MODAL */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="neo-card w-full max-w-sm bg-white flex flex-col origin-bottom animate-in slide-in-from-bottom-8">
                        <div className="flex items-center justify-between p-4 border-b-4 border-black" style={{ background: '#faff00' }}>
                            <h3 className="font-black text-[#0f0f0f] flex items-center gap-2"><Pencil size={18} /> Editar Perfil</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-[#0f0f0f] p-1 rounded hover:bg-black/10">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="p-5 flex flex-col gap-5">
                            <div className="flex flex-col items-center gap-3">
                                <label className="text-sm font-black text-[#555]">Avatar</label>
                                <EmojiPicker value={editEmoji} onChange={setEditEmoji} />
                            </div>

                            <div>
                                <label className="block text-sm font-black text-[#0f0f0f] mb-1">Nombre</label>
                                <input
                                    type="text"
                                    className="neo-input w-full"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    required
                                    maxLength={30}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-black text-[#0f0f0f] mb-1">Rol / Profesión</label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {Object.entries(PROFESSION_LABELS).map(([value, label]) => (
                                        <button
                                            type="button"
                                            key={value}
                                            onClick={() => setEditProfession(value)}
                                            className={`p-2 text-sm font-bold border-2 border-black rounded-lg transition-colors ${editProfession === value ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving || !editName.trim()}
                                className="neo-btn w-full py-4 mt-2 text-[#0f0f0f] font-black flex items-center justify-center gap-2"
                                style={{ background: isSaving ? '#ccc' : '#faff00' }}
                            >
                                {isSaving ? 'Guardando...' : <><Check size={18} /> Guardar Cambios</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
