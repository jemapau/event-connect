'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, Participant, Activity, Match } from '@/lib/types';

/**
 * Subscribe to session state changes in real time
 */
export function useSessionChannel(sessionId: string) {
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        const supabase = createClient();

        // Initial fetch
        supabase
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single()
            .then(({ data }) => setSession(data));

        // Realtime subscription
        const channel = supabase
            .channel(`session:${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'sessions',
                    filter: `id=eq.${sessionId}`,
                },
                (payload) => {
                    setSession(payload.new as Session);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId]);

    return session;
}

/**
 * Subscribe to participants list for a session.
 * Uses Realtime for INSERT/UPDATE and a 3s polling fallback
 * so DELETE operations always reflect in the UI.
 */
export function useParticipants(sessionId: string) {
    const [participants, setParticipants] = useState<Participant[]>([]);

    useEffect(() => {
        const supabase = createClient();

        const fetchParticipants = () =>
            supabase
                .from('participants')
                .select('*')
                .eq('session_id', sessionId)
                .eq('is_active', true)
                .then(({ data }) => setParticipants(data ?? []));

        // Initial fetch
        fetchParticipants();

        // Realtime subscription (handles INSERT/UPDATE instantly)
        const channel = supabase
            .channel(`participants:${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'participants',
                    filter: `session_id=eq.${sessionId}`,
                },
                fetchParticipants,
            )
            .subscribe();

        // Polling fallback every 3s — keeps DELETE/bulk changes in sync
        const pollInterval = setInterval(fetchParticipants, 3000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
        };
    }, [sessionId]);

    return participants;
}

/**
 * Subscribe to activity updates for a session
 */
export function useActivityUpdates(sessionId: string) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);

    useEffect(() => {
        const supabase = createClient();

        supabase
            .from('activities')
            .select('*')
            .eq('session_id', sessionId)
            .order('sort_order')
            .then(({ data }) => {
                setActivities(data ?? []);
                const active = (data ?? []).find((a) => a.state === 'active');
                setCurrentActivity(active ?? null);
            });

        const channel = supabase
            .channel(`activities:${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'activities',
                    filter: `session_id=eq.${sessionId}`,
                },
                () => {
                    supabase
                        .from('activities')
                        .select('*')
                        .eq('session_id', sessionId)
                        .order('sort_order')
                        .then(({ data }) => {
                            setActivities(data ?? []);
                            const active = (data ?? []).find((a) => a.state === 'active');
                            setCurrentActivity(active ?? null);
                        });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId]);

    return { activities, currentActivity };
}

/**
 * Subscribe to match updates for a session and round
 */
export function useMatchUpdates(sessionId: string, round: number) {
    const [matches, setMatches] = useState<Match[]>([]);

    const fetchMatches = useCallback(async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('matches')
            .select('*')
            .eq('session_id', sessionId)
            .eq('round', round);
        setMatches(data ?? []);
    }, [sessionId, round]);

    useEffect(() => {
        fetchMatches();

        const supabase = createClient();
        const channel = supabase
            .channel(`matches:${sessionId}:${round}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'matches',
                    filter: `session_id=eq.${sessionId}`,
                },
                fetchMatches
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, round, fetchMatches]);

    return matches;
}

/**
 * Subscribe to broadcast events from the host (countdowns, round changes)
 */
export function useHostBroadcast(
    sessionId: string,
    onEvent: (event: string, payload: unknown) => void
) {
    useEffect(() => {
        const supabase = createClient();

        const channel = supabase
            .channel(`broadcast:${sessionId}`)
            .on('broadcast', { event: '*' }, ({ event, payload }) => {
                onEvent(event, payload);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, onEvent]);
}
