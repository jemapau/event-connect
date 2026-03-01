import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

// Service role client — bypasses RLS for host operations
function createServiceClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

const ActivitySchema = z.object({
    session_id: z.string().uuid(),
    type: z.enum(['quiz', 'poll', 'icebreaker', 'open_question']),
    title: z.string().min(1).max(200),
    config: z.object({
        question: z.string().optional(),
        options: z.array(z.string()).optional(),
        correct_index: z.number().optional(),
        time_limit_seconds: z.number().default(30),
    }),
    sort_order: z.number().optional(),
});

const BulkActivitiesSchema = z.object({
    session_id: z.string().uuid(),
    activities: z.array(ActivitySchema.omit({ session_id: true })),
});

// GET /api/activities?session_id=xxx — list activities for a session
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    if (!session_id) {
        return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    }
    const supabase = createServiceClient();
    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('session_id', session_id)
        .order('sort_order');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ activities: data });
}

// POST /api/activities — create a single activity
export async function POST(request: NextRequest) {
    const body = await request.json();

    // Check if it's a bulk insert
    if (body.activities && Array.isArray(body.activities)) {
        const parsed = BulkActivitiesSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
        }
        const supabase = createServiceClient();
        const rows = parsed.data.activities.map((a, i) => ({
            session_id: parsed.data.session_id,
            type: a.type,
            title: a.title,
            config: a.config,
            sort_order: a.sort_order ?? i,
            state: 'pending',
        }));
        const { data, error } = await supabase.from('activities').insert(rows).select();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ activities: data }, { status: 201 });
    }

    // Single activity
    const parsed = ActivitySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }
    const supabase = createServiceClient();

    // Get current max sort_order
    const { data: existing } = await supabase
        .from('activities')
        .select('sort_order')
        .eq('session_id', parsed.data.session_id)
        .order('sort_order', { ascending: false })
        .limit(1);
    const nextOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0;

    const { data, error } = await supabase
        .from('activities')
        .insert({
            session_id: parsed.data.session_id,
            type: parsed.data.type,
            title: parsed.data.title,
            config: parsed.data.config,
            sort_order: parsed.data.sort_order ?? nextOrder,
            state: 'pending',
        })
        .select()
        .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ activity: data }, { status: 201 });
}

// DELETE /api/activities?id=xxx — delete an activity
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const supabase = createServiceClient();
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
