'use client';

import { useState } from 'react';
import { Share2, CheckCircle } from 'lucide-react';
import type { Session, Participant, Match } from '@/lib/types';
import { PROFESSION_LABELS } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface MatchCardProps {
    sessionId: string;
    session: Session;
    matches: Match[];
    participants: Participant[];
    round: number;
    totalRounds: number;
    icebreaker: string;
}

export default function MatchCard({
    sessionId,
    session,
    matches,
    participants,
    round,
    totalRounds,
    icebreaker,
}: MatchCardProps) {
    const [contactShared, setContactShared] = useState(false);

    // Find current user's participant
    const currentUserId =
        typeof window !== 'undefined'
            ? sessionStorage.getItem(`participant_${sessionId}`)
            : null;
    const myParticipant = participants.find((p) => p.id === currentUserId);

    // Find my match
    const myMatch = myParticipant
        ? matches.find(
            (m) => m.participant_a === myParticipant.id || m.participant_b === myParticipant.id
        )
        : null;

    const partnerId = myMatch
        ? myMatch.participant_a === myParticipant?.id
            ? myMatch.participant_b
            : myMatch.participant_a
        : null;

    const partner = participants.find((p) => p.id === partnerId);

    const shareContact = async () => {
        if (!myMatch) return;
        const supabase = createClient();
        await supabase.from('matches').update({ contact_exchanged: true }).eq('id', myMatch.id);
        setContactShared(true);
    };

    if (!myParticipant) {
        return (
            <div className="neo-card p-8 text-center">
                <p className="text-white font-black">Cargando tu pareja...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Round indicator */}
            <div className="flex justify-between items-center">
                <span className="text-sm font-black text-[#a0a0b0]">NETWORKING</span>
                <span
                    className="text-sm font-black px-3 py-1 rounded-full border-2 border-black"
                    style={{ background: '#faff00', color: '#0f0f0f' }}
                >
                    Ronda {round} / {totalRounds}
                </span>
            </div>

            {/* Partner card */}
            {partner ? (
                <div className="neo-card p-6 text-center">
                    <p className="text-xs font-black text-[#a0a0b0] mb-4">TU PAREJA ES</p>
                    <div className="text-6xl mb-3">{partner.avatar_emoji}</div>
                    <h2 className="text-2xl font-black text-white">{partner.display_name}</h2>
                    <p className="text-[#a0a0b0] mt-1">{PROFESSION_LABELS[partner.profession]}</p>
                    {partner.profession_custom && (
                        <p className="text-sm text-[#a0a0b0]">({partner.profession_custom})</p>
                    )}
                </div>
            ) : (
                <div className="neo-card p-8 text-center border-dashed">
                    <div className="text-4xl mb-3">⏳</div>
                    <p className="font-black text-white">En espera</p>
                    <p className="text-sm text-[#a0a0b0] mt-1">
                        Te conectaremos en la próxima ronda
                    </p>
                </div>
            )}

            {/* Icebreaker */}
            {partner && (
                <div
                    className="neo-card p-5 border-[#faff00]"
                    style={{ borderColor: 'var(--accent-3)', borderWidth: 3 }}
                >
                    <p className="text-xs font-black mb-2" style={{ color: 'var(--accent-3)' }}>
                        💬 ICEBREAKER
                    </p>
                    <p className="text-white font-bold leading-relaxed">&ldquo;{icebreaker}&rdquo;</p>
                </div>
            )}

            {/* Contact exchange */}
            {partner && (
                <button
                    id="share-contact-btn"
                    onClick={shareContact}
                    disabled={contactShared}
                    className="neo-btn w-full py-4 font-black gap-2"
                    style={{
                        background: contactShared ? 'var(--accent-3)' : 'var(--accent-2)',
                        color: '#fff',
                    }}
                >
                    {contactShared ? (
                        <>
                            <CheckCircle size={18} /> ¡Contacto compartido!
                        </>
                    ) : (
                        <>
                            <Share2 size={18} /> Intercambiar Contacto
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
