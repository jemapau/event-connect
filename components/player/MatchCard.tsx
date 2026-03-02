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
            (m) =>
                m.participant_ids?.includes(myParticipant.id) ||
                m.participant_a === myParticipant.id ||
                m.participant_b === myParticipant.id
        )
        : null;

    // Get all IDs in the group (fallback to participant_a/b if missing)
    const teamIds =
        myMatch?.participant_ids?.length && myMatch.participant_ids.length > 0
            ? myMatch.participant_ids
            : [myMatch?.participant_a, myMatch?.participant_b].filter(Boolean) as string[];

    const partnerIds = teamIds.filter((id) => id !== myParticipant?.id);
    const partners = participants.filter((p) => partnerIds.includes(p.id));

    const isTeam = partners.length > 1;

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
            {partners.length > 0 ? (
                <div className="neo-card p-6 text-center">
                    <p className="text-xs font-black text-[#a0a0b0] mb-4">
                        {isTeam ? 'TU EQUIPO ES' : 'TU PAREJA ES'}
                    </p>
                    {isTeam ? (
                        <div className="flex flex-col gap-3">
                            {partners.map((p) => (
                                <div key={p.id} className="flex items-center gap-3 bg-[#f5f5f5] p-3 rounded-lg border-2 border-[#ddd]">
                                    <div className="text-3xl">{p.avatar_emoji}</div>
                                    <div className="text-left flex-1 min-w-0">
                                        <h3 className="text-lg font-black text-[var(--text-primary)] truncate">
                                            {p.display_name}
                                        </h3>
                                        <p className="text-xs text-[#555] truncate">
                                            {PROFESSION_LABELS[p.profession]}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>
                            <div className="text-6xl mb-3">{partners[0].avatar_emoji}</div>
                            <h2 className="text-2xl font-black text-[var(--text-primary)]">
                                {partners[0].display_name}
                            </h2>
                            <p className="text-[#a0a0b0] mt-1">
                                {PROFESSION_LABELS[partners[0].profession]}
                            </p>
                            {partners[0].profession_custom && (
                                <p className="text-sm text-[#a0a0b0]">
                                    ({partners[0].profession_custom})
                                </p>
                            )}
                        </div>
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
            {partners.length > 0 && (
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

            {/* Contact exchange (only for pairs for now) */}
            {!isTeam && partners.length === 1 && myParticipant ? (
                <ContactExchange myMatch={myMatch!} myParticipant={myParticipant} />
            ) : null}
        </div>
    );
}
