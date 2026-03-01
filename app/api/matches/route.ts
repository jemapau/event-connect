import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateMatches } from '@/lib/utils/matching';
import { z } from 'zod';

const GenerateMatchesSchema = z.object({
    session_id: z.string().uuid(),
    round: z.number().int().min(1),
    mode: z.enum(['random', 'interests', 'rounds']).default('interests'),
    icebreaker: z.string().optional(),
});

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const round = searchParams.get('round');

    if (!sessionId || !round) {
        return NextResponse.json({ error: 'Missing session_id or round' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('matches')
        .select(`
      *,
      participant_a_data:participants!matches_participant_a_fkey(id, display_name, profession, avatar_emoji),
      participant_b_data:participants!matches_participant_b_fkey(id, display_name, profession, avatar_emoji)
    `)
        .eq('session_id', sessionId)
        .eq('round', parseInt(round));

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ matches: data });
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = GenerateMatchesSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { session_id, round, mode, icebreaker } = parsed.data;

    // Verify host owns session
    const { data: session } = await supabase
        .from('sessions')
        .select('id, host_id')
        .eq('id', session_id)
        .eq('host_id', user.id)
        .single();

    if (!session) {
        return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 403 });
    }

    // Get active participants
    const { data: participants } = await supabase
        .from('participants')
        .select('id, interests, profession')
        .eq('session_id', session_id)
        .eq('is_active', true);

    if (!participants || participants.length < 2) {
        return NextResponse.json({ error: 'Not enough participants' }, { status: 400 });
    }

    // Get previous matches to avoid repeating pairs
    const { data: previousMatchesData } = await supabase
        .from('matches')
        .select('participant_a, participant_b')
        .eq('session_id', session_id);

    const previousMatches = new Set<string>(
        (previousMatchesData ?? []).map((m) =>
            [m.participant_a, m.participant_b].sort().join('-')
        )
    );

    const { pairs, waiting } = generateMatches(participants, previousMatches, mode);

    // Insert matches
    const matchInserts = pairs.map(([a, b]) => ({
        session_id,
        participant_a: a,
        participant_b: b,
        round,
    }));

    const { data: newMatches, error: matchError } = await supabase
        .from('matches')
        .insert(matchInserts)
        .select();

    if (matchError) {
        return NextResponse.json({ error: matchError.message }, { status: 500 });
    }

    // Update session state to 'matching' with icebreaker
    await supabase
        .from('sessions')
        .update({
            state: 'matching',
            current_round: round,
            current_icebreaker: icebreaker,
        })
        .eq('id', session_id);

    return NextResponse.json({ matches: newMatches, waiting, pairs }, { status: 201 });
}
