'use client';

import { useState } from 'react';
import { Share2, CheckCircle } from 'lucide-react';
import type { Session, Participant, Match } from '@/lib/types';
import { PROFESSION_LABELS } from '@/lib/types';
import ContactExchange from './ContactExchange';
import ProgressBar from '@/components/shared/ProgressBar';

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

    if (!myParticipant) {
        return (
            <div className="neo-card p-8 text-center">
                <p className="text-[var(--text-primary)] font-black">Cargando tu pareja...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Round indicator */}
            <div className="mb-4">
                <ProgressBar current={round} total={totalRounds} label="RONDA NETWORKING" />
            </div>

            {/* Partner card */}
            {partner ? (
                <div className="neo-card p-6 text-center">
                    <p className="text-xs font-black text-[#a0a0b0] mb-4">TU PAREJA ES</p>
                    <div className="text-6xl mb-3">{partner.avatar_emoji}</div>
                    <h2 className="text-2xl font-black text-[var(--text-primary)]">{partner.display_name}</h2>
                    <p className="text-[#a0a0b0] mt-1">{PROFESSION_LABELS[partner.profession]}</p>
                    {partner.profession_custom && (
                        <p className="text-sm text-[#a0a0b0]">({partner.profession_custom})</p>
                    )}
                </div>
            ) : (
                <div className="neo-card p-8 text-center border-dashed">
                    <div className="text-4xl mb-3">⏳</div>
                    <p className="font-black text-[var(--text-primary)]">En espera</p>
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
                    <p className="text-[var(--text-primary)] font-bold leading-relaxed">&ldquo;{icebreaker}&rdquo;</p>
                </div>
            )}

            {/* Contact exchange */}
            {partner && myParticipant ? (
                <ContactExchange myMatch={myMatch!} myParticipant={myParticipant} />
            ) : null}
        </div>
    );
}
