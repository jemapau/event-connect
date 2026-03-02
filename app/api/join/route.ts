import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const JoinSchema = z.object({
    pin: z.string().length(6),
    display_name: z.string().min(1).max(50),
    avatar_emoji: z.string().default('😊'),
    profession: z.enum(['diseno_ux', 'diseno_ui', 'product_design', 'otro']),
    profession_custom: z.string().optional(),
    interests: z.array(z.string()).default([]),
});

// Create a service-role client that bypasses RLS (needed for anonymous joins)
function createServiceClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        // Fall back to anon key if service role not set — some ops still work
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => [],
                setAll: () => { },
            },
        }
    );
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const parsed = JoinSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { pin, display_name, avatar_emoji, profession, profession_custom, interests } = parsed.data;

    // Use service client to bypass RLS for the session lookup
    const supabase = createServiceClient();

    // Find active session by PIN
    const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, state, title, pin')
        .eq('pin', pin)
        .neq('state', 'closed')
        .single();

    if (sessionError || !session) {
        return NextResponse.json(
            { error: 'PIN inválido o sesión no encontrada.' },
            { status: 404 }
        );
    }


    // Insert participant using service role (bypasses RLS)
    const { data: participant, error: participantError } = await supabase
        .from('participants')
        .insert({
            session_id: session.id,
            user_id: null, // anonymous — no auth required
            display_name,
            avatar_emoji,
            profession,
            profession_custom,
            interests,
        })
        .select()
        .single();

    if (participantError) {
        if (participantError.code === '23505') {
            return NextResponse.json(
                { error: 'Ese nombre ya está en uso en esta sesión.' },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: participantError.message }, { status: 500 });
    }

    return NextResponse.json(
        { participant, session },
        { status: 201 }
    );
}
