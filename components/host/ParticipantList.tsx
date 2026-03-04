'use client';

import { useState } from 'react';
import { Trash2, CheckSquare, Square, XSquare } from 'lucide-react';
import type { Participant } from '@/lib/types';
import { PROFESSION_LABELS } from '@/lib/types';

interface ParticipantListProps {
    participants: Participant[];
    onDelete?: (participantId: string) => void;
}

export default function ParticipantList({ participants, onDelete }: ParticipantListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);

    const allSelected = participants.length > 0 && selected.size === participants.length;
    const someSelected = selected.size > 0 && !allSelected;

    const toggleOne = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(participants.map(p => p.id)));
        }
    };

    const handleDelete = async (id: string) => {
        if (deletingId) return;
        setDeletingId(id);
        try {
            await fetch(`/api/participants/${id}`, { method: 'DELETE' });
            onDelete?.(id);
            setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
        } catch (e) {
            console.error('Error eliminando participante', e);
        } finally {
            setDeletingId(null);
        }
    };

    const handleBulkDelete = async () => {
        if (bulkDeleting || selected.size === 0) return;
        setBulkDeleting(true);
        const ids = Array.from(selected);
        try {
            await Promise.all(ids.map(id => fetch(`/api/participants/${id}`, { method: 'DELETE' })));
            ids.forEach(id => onDelete?.(id));
            setSelected(new Set());
        } catch (e) {
            console.error('Error en eliminación masiva', e);
        } finally {
            setBulkDeleting(false);
        }
    };

    return (
        <div className="flex flex-col overflow-hidden h-full gap-2">
            {/* Header row */}
            <div className="flex items-center justify-between flex-shrink-0">
                <p className="text-xs font-black text-[#a0a0b0]">
                    ASISTENTES ({participants.length})
                </p>
                {/* Select all toggle */}
                <button
                    onClick={toggleAll}
                    title={allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    className="text-[#a0a0b0] hover:text-[#faff00] transition-colors"
                >
                    {allSelected
                        ? <CheckSquare size={15} />
                        : someSelected
                            ? <XSquare size={15} className="text-[#faff00]" />
                            : <Square size={15} />}
                </button>
            </div>

            {/* Bulk delete bar */}
            {selected.size > 0 && (
                <div className="flex items-center justify-between bg-[#2a1a1a] border border-[#e94455]/40 rounded-lg px-3 py-1.5 flex-shrink-0">
                    <span className="text-xs font-black text-[#e94455]">
                        {selected.size} seleccionado{selected.size > 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={handleBulkDelete}
                        disabled={bulkDeleting}
                        className="flex items-center gap-1 text-xs font-black text-[#e94455] hover:text-white transition-colors disabled:opacity-50"
                        title="Eliminar seleccionados"
                    >
                        <Trash2 size={12} />
                        {bulkDeleting ? 'Eliminando...' : 'Eliminar'}
                    </button>
                </div>
            )}

            {/* List */}
            <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
                {participants.map((p) => (
                    <div
                        key={p.id}
                        className={`flex items-center gap-2 p-2 rounded-lg group cursor-pointer transition-colors ${selected.has(p.id) ? 'bg-[#2a1a1a] border border-[#e94455]/30' : 'bg-[#1e1e3a]'
                            }`}
                        onClick={() => toggleOne(p.id)}
                    >
                        {/* Checkbox */}
                        <span className={`flex-shrink-0 transition-colors ${selected.has(p.id) ? 'text-[#e94455]' : 'text-[#444466] group-hover:text-[#a0a0b0]'}`}>
                            {selected.has(p.id) ? <CheckSquare size={13} /> : <Square size={13} />}
                        </span>
                        <span className="text-lg flex-shrink-0">{p.avatar_emoji}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{p.display_name}</p>
                            <p className="text-xs text-[#a0a0b0]">{PROFESSION_LABELS[p.profession]}</p>
                        </div>
                        <span className="text-xs font-black text-[#faff00] mr-1 flex-shrink-0">{p.score}</span>
                        {/* Single delete — only visible on hover if not in selection mode */}
                        {selected.size === 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                disabled={deletingId === p.id}
                                title="Eliminar participante"
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#e9445530] text-[#a0a0b0] hover:text-[#e94455] flex-shrink-0"
                                aria-label={`Eliminar a ${p.display_name}`}
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
                {participants.length === 0 && (
                    <p className="text-xs text-[#a0a0b0] text-center py-4">
                        Esperando asistentes...
                    </p>
                )}
            </div>
        </div>
    );
}
