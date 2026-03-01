'use client';

import { useState } from 'react';
import { Share2, CheckCircle, Linkedin, Twitter, Mail, X } from 'lucide-react';
import type { Participant, Match } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface ContactExchangeProps {
    myMatch: Match | null;
    myParticipant: Participant;
}

export default function ContactExchange({ myMatch, myParticipant }: ContactExchangeProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [contactShared, setContactShared] = useState(false);
    const [loading, setLoading] = useState(false);

    // Local state for contact info
    const [linkedin, setLinkedin] = useState(myParticipant.contact_info?.linkedin || '');
    const [twitter, setTwitter] = useState(myParticipant.contact_info?.twitter || '');
    const [email, setEmail] = useState(myParticipant.contact_info?.email || '');

    const handleShare = async () => {
        if (!myMatch) return;
        setLoading(true);
        const supabase = createClient();

        try {
            // Update user's profile with latest contact info
            await supabase.from('participants').update({
                contact_info: { linkedin, twitter, email }
            }).eq('id', myParticipant.id);

            // Update match to mark contact exchanged
            await supabase.from('matches').update({ contact_exchanged: true }).eq('id', myMatch.id);

            setContactShared(true);
            setIsOpen(false);
        } catch (error) {
            console.error('Error sharing contact:', error);
        } finally {
            setLoading(false);
        }
    };

    if (contactShared) {
        return (
            <button
                disabled
                className="neo-btn w-full py-4 font-black gap-2 transition-all opacity-80"
                style={{ background: 'var(--accent-3)', color: '#fff' }}
            >
                <CheckCircle size={18} /> ¡Contacto compartido!
            </button>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="neo-btn w-full py-4 font-black gap-2"
                style={{ background: 'var(--accent-2)', color: '#fff' }}
            >
                <Share2 size={18} /> Intercambiar Contacto
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="neo-card-bright p-6 w-full max-w-sm relative" style={{ background: 'var(--bg-primary)' }}>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6 mt-2">
                            <div className="w-12 h-12 rounded-full border-2 border-[var(--neo-black)] flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--accent-2)' }}>
                                <Share2 size={24} color="#fff" />
                            </div>
                            <h3 className="text-xl font-black text-[var(--text-primary)]">Compartir Contacto</h3>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                                Añade o actualiza tus redes para que tu pareja pueda conectar contigo después.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <Linkedin size={20} className="text-[#0077b5]" />
                                <input
                                    type="text"
                                    placeholder="Usuario de LinkedIn"
                                    className="neo-input flex-1 py-2 text-sm"
                                    value={linkedin}
                                    onChange={(e) => setLinkedin(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Twitter size={20} className="text-[#1da1f2]" />
                                <input
                                    type="text"
                                    placeholder="Usuario de X (Twitter)"
                                    className="neo-input flex-1 py-2 text-sm"
                                    value={twitter}
                                    onChange={(e) => setTwitter(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail size={20} className="text-[var(--text-secondary)]" />
                                <input
                                    type="email"
                                    placeholder="Correo electrónico"
                                    className="neo-input flex-1 py-2 text-sm"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleShare}
                            disabled={loading || (!linkedin && !twitter && !email)}
                            className="neo-btn w-full py-4 font-black text-[#0f0f0f]"
                            style={{ background: (linkedin || twitter || email) ? '#faff00' : 'var(--bg-surface)' }}
                        >
                            {loading ? 'Compartiendo...' : 'Confirmar y Compartir'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
