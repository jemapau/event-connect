import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const UpdateParticipantSchema = z.object({
    display_name: z.string().min(1).max(50),
    avatar_emoji: z.string(),
    profession: z.string(),
});

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

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const parsed = UpdateParticipantSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Update participant using service role to bypass RLS for anonymous users
        const { data, error } = await supabase
            .from('participants')
            .update({
                display_name: parsed.data.display_name,
                avatar_emoji: parsed.data.avatar_emoji,
                profession: parsed.data.profession,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ participant: data }, { status: 200 });
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    try {
        const supabase = createServiceClient();

        const { error } = await supabase
            .from('participants')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
