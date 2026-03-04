import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const RespondSchema = z.object({
    activity_id: z.string().uuid(),
    participant_id: z.string().uuid(),
    value: z.any(),
});

function createServiceClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const parsed = RespondSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { activity_id, participant_id, value } = parsed.data;
    const supabase = createServiceClient();

    const { data: activity } = await supabase
        .from('activities')
        .select('id, type, config')
        .eq('id', activity_id)
        .single();

    if (!activity) {
        return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    let score_earned = 0;

    if (activity.type === 'quiz' && typeof value === 'object' && value.selected_index !== undefined) {
        if (value.selected_index === activity.config.correct_index) {
            score_earned = 10;
        }
    }

    const { data, error } = await supabase
        .from('responses')
        .insert({
            activity_id,
            participant_id,
            value,
            score_earned
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Ya has respondido' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let new_score = 0;
    if (score_earned > 0) {
        const { data: pData } = await supabase.from('participants').select('score').eq('id', participant_id).single();
        if (pData) {
            new_score = (pData.score || 0) + score_earned;
            await supabase.from('participants').update({ score: new_score }).eq('id', participant_id);
        }
    }

    return NextResponse.json({ response: data, score_earned, new_score }, { status: 201 });
}
