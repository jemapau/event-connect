import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePin } from '@/lib/utils/pin';
import { z } from 'zod';

const CreateSessionSchema = z.object({
    title: z.string().min(1).max(100),
    matching_mode: z.enum(['random', 'interests', 'rounds']).default('interests'),
    total_rounds: z.number().int().min(1).max(10).default(4),
});

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('host_id', user.id)
        .neq('state', 'closed')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions: data });
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateSessionSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const pin = generatePin();

    const { data, error } = await supabase
        .from('sessions')
        .insert({
            pin,
            host_id: user.id,
            title: parsed.data.title,
            matching_mode: parsed.data.matching_mode,
            total_rounds: parsed.data.total_rounds,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session: data }, { status: 201 });
}
