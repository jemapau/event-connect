'use client';

import { use, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Pause, SkipForward, Shuffle, Users, Wifi } from 'lucide-react';
import { useSessionChannel, useParticipants, useActivityUpdates } from '@/lib/realtime/hooks';
import { formatPin } from '@/lib/utils/pin';
import { generateQRDataURL } from '@/lib/utils/qr';
import QRDisplay from '@/components/host/QRDisplay';
import LiveStats from '@/components/host/LiveStats';
import QuizTab from '@/components/host/QuizTab';
import NetworkingTab from '@/components/host/NetworkingTab';
import ResultsTab from '@/components/host/ResultsTab';
import ParticipantList from '@/components/host/ParticipantList';
import ActivitiesTab from '@/components/host/ActivitiesTab';

type Tab = 'actividades' | 'quiz' | 'networking' | 'resultados' | 'config';

export default function HostSessionPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: sessionId } = use(params);
    const [activeTab, setActiveTab] = useState<Tab>('actividades');
    const [qrDataUrl, setQrDataUrl] = useState('');

    const session = useSessionChannel(sessionId);
    const participants = useParticipants(sessionId);
    const { activities, currentActivity } = useActivityUpdates(sessionId);
    const lastSessionStateRef = useRef<string | null>(null);

    useEffect(() => {
        if (session?.pin) {
            generateQRDataURL(session.pin).then(setQrDataUrl);
        }
    }, [session?.pin]);

    useEffect(() => {
        if (!session?.state || session.state === lastSessionStateRef.current) return;

        if (session.state === 'matching' && activeTab !== 'networking') {
            setActiveTab('networking');
        } else if (session.state === 'results' && activeTab !== 'resultados') {
            setActiveTab('resultados');
        }
        lastSessionStateRef.current = session.state;
    }, [session?.state, activeTab]);

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-[var(--text-primary)] font-black text-xl animate-pulse">Cargando sesión...</div>
            </div>
        );
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: 'actividades', label: 'Actividades' },
        { key: 'quiz', label: 'Preguntas/Polls' },
        { key: 'networking', label: 'Networking' },
        { key: 'resultados', label: 'Resultados' },
        { key: 'config', label: 'Config' },
    ];

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a]">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-[#a0a0b0] hover:text-[var(--text-primary)] transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-[var(--text-primary)]">{session.title}</span>
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--accent-3)', color: '#0f0f0f' }}>
                                <Wifi size={10} /> LIVE
                            </span>
                        </div>
                        <span className="text-sm font-mono text-[#a0a0b0]">PIN: {formatPin(session.pin)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[#a0a0b0] text-sm">
                    <Users size={16} />
                    <span className="font-bold text-[var(--text-primary)]">{participants.length}</span> conectados
                </div>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-[#2a2a4a] px-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        id={`tab-${tab.key}`}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-3 text-sm font-black border-b-3 transition-colors ${activeTab === tab.key
                            ? 'text-[var(--text-primary)] border-b-4 border-[#faff00]'
                            : 'text-[#a0a0b0] border-b-4 border-transparent hover:text-[var(--text-primary)]'
                            }`}
                        style={{ borderBottomWidth: 3 }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main content */}
            <div className="flex-1 flex gap-0 overflow-hidden">
                {/* Left panel — QR + Stats (Only visible on Actividades tab) */}
                {activeTab === 'actividades' && (
                    <aside className="w-72 border-r border-[#2a2a4a] p-5 flex flex-col gap-5 overflow-y-auto">
                        <QRDisplay pin={session.pin} qrDataUrl={qrDataUrl} />
                        <LiveStats participants={participants} />
                        <ParticipantList participants={participants} />
                    </aside>
                )}

                {/* Right panel — Active tab */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {activeTab === 'actividades' && (
                        <ActivitiesTab
                            sessionId={sessionId}
                            session={session}
                            onSelectActivity={(type) => {
                                if (type === 'networking') setActiveTab('networking');
                                else setActiveTab('quiz');
                            }}
                        />
                    )}
                    {activeTab === 'quiz' && (
                        <QuizTab
                            sessionId={sessionId}
                            session={session}
                            activities={activities}
                            currentActivity={currentActivity}
                            onRefresh={() => window.location.reload()}
                        />
                    )}
                    {activeTab === 'networking' && (
                        <NetworkingTab
                            sessionId={sessionId}
                            session={session}
                            participants={participants}
                        />
                    )}
                    {activeTab === 'resultados' && (
                        <ResultsTab
                            sessionId={sessionId}
                            participants={participants}
                        />
                    )}
                    {activeTab === 'config' && (
                        <ConfigPanel session={session} />
                    )}
                </main>
            </div>
        </div>
    );
}

function ConfigPanel({ session }: { session: { id: string; title: string; state: string; expires_at: string } }) {
    const [closing, setClosing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const router = useRouter();

    const closeSession = async () => {
        setClosing(true);
        await fetch(`/api/sessions`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: session.id, state: 'closed' }),
        });

        // Wait a small bit and redirect to trigger refresh
        setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
        }, 500);
    };

    const deleteSession = async () => {
        setDeleting(true);
        await fetch(`/api/sessions`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: session.id }),
        });

        // Wait a small bit and redirect to trigger refresh
        setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
        }, 500);
    };

    return (
        <div className="max-w-xl flex flex-col gap-6">
            <h2 className="text-xl font-black text-[var(--text-primary)]">Configuración de Sesión</h2>
            <div className="neo-card p-6">
                <p className="text-sm text-[#a0a0b0] mb-1">Nombre de la sesión</p>
                <p className="font-black text-[var(--text-primary)] text-lg">{session.title}</p>
            </div>
            <div className="neo-card p-6">
                <p className="text-sm text-[#a0a0b0] mb-1">Estado actual</p>
                <p className="font-black text-[var(--text-primary)] capitalize">{session.state}</p>
            </div>
            <div className="neo-card p-6">
                <p className="text-sm text-[#a0a0b0] mb-1">Expira</p>
                <p className="font-black text-[var(--text-primary)]">{new Date(session.expires_at).toLocaleString('es-MX')}</p>
            </div>
            <div className="flex flex-col gap-3 mt-4">
                <button
                    onClick={closeSession}
                    disabled={closing || deleting}
                    id="close-session-btn"
                    className="neo-btn py-3 font-black text-[var(--text-primary)] w-full"
                    style={{ background: closing || deleting ? '#555' : 'var(--accent-1)' }}
                >
                    {closing ? 'Cerrando...' : '⛔ Cerrar Sesión'}
                </button>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={closing || deleting}
                    id="delete-session-btn"
                    className="neo-btn py-3 font-black text-white w-full border-[#d90429]"
                    style={{ background: closing || deleting ? '#555' : '#d90429' }}
                >
                    {deleting ? 'Eliminando...' : '🗑️ Eliminar Evento Definitivamente'}
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="neo-card p-8 max-w-md w-full" style={{ background: 'var(--bg-primary)' }}>
                        <h3 className="text-xl font-black text-[var(--text-primary)] mb-3 flex items-center gap-2">
                            ⚠️ Confirmar Eliminación
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-6">
                            ¿Estás seguro de que deseas eliminar este evento permanentemente? Esta acción borrará a todos los participantes, respuestas y rondas de networking, y <strong>no se puede deshacer</strong>.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                className="neo-btn flex-1 py-3 font-black text-[var(--text-primary)] bg-[var(--bg-card)] hover:bg-[#2a2a4a] transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={deleteSession}
                                disabled={deleting}
                                className="neo-btn flex-1 py-3 font-black text-white border-[#d90429] transition-colors"
                                style={{ background: deleting ? '#555' : '#d90429' }}
                            >
                                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
