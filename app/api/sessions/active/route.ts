import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Create a service-role client that bypasses RLS
function createServiceClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => [],
                setAll: () => { },
            },
        }
    );
}

export async function GET() {
    const supabase = createServiceClient();

    // Fetch up to 5 active or lobbying sessions
    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id, title, state, pin')
        .in('state', ['lobby', 'active', 'voting', 'question', 'matching'])
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions });
}
