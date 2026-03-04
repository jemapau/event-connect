'use client';

import {
    HelpCircle,
    BarChart2,
    MessageCircle,
    Users,
    Coffee,
    MessageSquare
} from 'lucide-react';
import type { Session } from '@/lib/types';

interface ActivitiesTabProps {
    sessionId: string;
    session: Session;
    panelWidth?: number;
    onSelectActivity: (activityType: 'quiz' | 'poll' | 'wordcloud' | 'networking' | 'open_question' | 'icebreaker') => void;
}

const ACTIVITY_TYPES = [
    {
        id: 'quiz',
        name: 'Quiz',
        description: 'Preguntas de opción múltiple con una respuesta correcta para ganar puntos.',
        icon: <HelpCircle size={32} className="mb-4 text-[#faff00]" />,
        color: '#faff00',
        textColor: '#0f0f0f',
        tab: 'quiz'
    },
    {
        id: 'poll',
        name: 'Votación',
        description: 'Encuestas rápidas para conocer la opinión de la audiencia en tiempo real.',
        icon: <BarChart2 size={32} className="mb-4 text-[#54a0ff]" />,
        color: '#54a0ff',
        textColor: '#fff',
        tab: 'quiz' // Handled in Quiz builder for now
    },
    {
        id: 'wordcloud',
        name: 'Nube de Palabras',
        description: 'Los participantes envían palabras que forman una nube visual interactiva.',
        icon: <MessageCircle size={32} className="mb-4 text-[#ff6b6b]" />,
        color: '#ff6b6b',
        textColor: '#fff',
        tab: 'quiz' // Handled in Quiz builder for now
    },
    {
        id: 'networking',
        name: 'Networking',
        description: 'Crea parejas o grupos de trabajo basados en intereses o de forma aleatoria.',
        icon: <Users size={32} className="mb-4 text-[var(--accent-1)]" />,
        color: 'var(--accent-1)',
        textColor: '#fff',
        tab: 'networking'
    },
    {
        id: 'open_question',
        name: 'Pregunta Abierta',
        description: 'Permite a los participantes responder con texto libre.',
        icon: <MessageSquare size={32} className="mb-4 text-[#5ab651]" />,
        color: '#5ab651',
        textColor: '#fff',
        tab: 'quiz' // Handled in Quiz builder for now
    },
    {
        id: 'icebreaker',
        name: 'Icebreaker',
        description: 'Preguntas divertidas para romper el hielo al inicio del evento.',
        icon: <Coffee size={32} className="mb-4 text-[#f9ca24]" />,
        color: '#f9ca24',
        textColor: '#0f0f0f',
        tab: 'quiz' // Handled in Quiz builder for now
    }
] as const;

export default function ActivitiesTab({ sessionId, session, panelWidth = 224, onSelectActivity }: ActivitiesTabProps) {
    // Estimate available width: viewport minus QR panel (256px) minus participant panel
    // Use a simple threshold: if total panels are wide, reduce columns
    const cols = panelWidth > 300 ? 1 : panelWidth > 220 ? 2 : 3;
    const gridClass = cols === 1
        ? 'grid grid-cols-1 gap-5'
        : cols === 2
            ? 'grid grid-cols-1 md:grid-cols-2 gap-5'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5';

    return (
        <div className="flex flex-col gap-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-black text-[var(--text-primary)]">Lanzador de Actividades</h2>
                <p className="text-[#a0a0b0] mt-1">Selecciona el tipo de dinámica que deseas iniciar o configurar.</p>
            </div>

            <div className={gridClass}>
                {ACTIVITY_TYPES.map((act) => (
                    <button
                        key={act.id}
                        onClick={() => onSelectActivity(act.id as any)}
                        className="neo-card p-6 text-left flex flex-col items-start transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000]"
                        style={{ borderTop: `6px solid ${act.color}` }}
                    >
                        {act.icon}
                        <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">{act.name}</h3>
                        <p className="text-sm text-[#a0a0b0] leading-relaxed">
                            {act.description}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}
