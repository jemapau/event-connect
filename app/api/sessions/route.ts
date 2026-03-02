import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePin } from '@/lib/utils/pin';
import { z } from 'zod';

const CreateSessionSchema = z.object({
    title: z.string().min(1).max(100),
    matching_mode: z.enum(['random', 'interests', 'rounds']).default('interests'),
    total_rounds: z.number().int().min(1).max(10).default(4),
});

const UpdateSessionSchema = z.object({
    id: z.string().uuid(),
    state: z.string().optional(),
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
    const icebreakers = [
        '¿Cuál fue tu último proyecto de diseño favorito?',
        '¿Qué herramienta no podrías vivir sin ella?',
        '¿En qué proyecto te gustaría trabajar?',
        '¿Cuál es tu mayor reto hoy en diseño?',
    ];
    const defaultIcebreaker = icebreakers[Math.floor(Math.random() * icebreakers.length)];

    const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
            pin,
            host_id: user.id,
            title: parsed.data.title,
            matching_mode: parsed.data.matching_mode,
            total_rounds: parsed.data.total_rounds,
            current_icebreaker: defaultIcebreaker
        })
        .select()
        .single();

    if (sessionError) {
        return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    // Seed default activities
    const defaultActivities = [
        {
            session_id: sessionData.id,
            title: '¿Qué es Auto Layout en Figma?',
            type: 'quiz',
            sort_order: 0,
            config: {
                question: '¿Qué es Auto Layout en Figma?',
                options: ['Una forma automática de espaciar', 'Un plugin para exportar código', 'Un tipo de animación'],
                correct_index: 0,
                time_limit_seconds: 15
            }
        },
        {
            session_id: sessionData.id,
            title: '¿Para qué sirve Variants?',
            type: 'quiz',
            sort_order: 1,
            config: {
                question: '¿Para qué sirve crear Variantes en un Componente?',
                options: ['Para probar diferentes colores en toda la app', 'Para agrupar estados de un mismo componente (ej. hover, pressed)', 'Para exportar el diseño a distintas resoluciones automáticamente'],
                correct_index: 1,
                time_limit_seconds: 20
            }
        },
        {
            session_id: sessionData.id,
            title: '¿Qué plugin prefieres?',
            type: 'poll',
            sort_order: 2,
            config: {
                question: '¿Qué tipo de plugin de Figma utilizas más en tu día a día?',
                options: ['Eliminador de fondos', 'Generadores de texto o lorum ipsum', 'Librerías de iconos', 'Analizadores de accesibilidad y contraste']
            }
        }
    ];

    await supabase.from('activities').insert(defaultActivities);

    return NextResponse.json({ session: sessionData }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateSessionSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('sessions')
        .update({ state: parsed.data.state })
        .eq('id', parsed.data.id)
        .eq('host_id', user.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session: data });
}

export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // We expect the ID in the body for the DELETE method or in the URL search params.
    // Given the previous instructions, let's look for it in the JSON body.
    let id: string;
    try {
        const body = await request.json();
        id = body.id;
    } catch {
        // Fallback to query param
        const url = new URL(request.url);
        id = url.searchParams.get('id') || '';
    }

    if (!id) {
        return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Relying on RLS and host_id to ensure only the owner can delete
    const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)
        .eq('host_id', user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
