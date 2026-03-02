'use client';

import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';

const COMMON_EMOJIS = [
    '😊', '😎', '🎉', '🚀', '💡', '🎨', '💻', '👾',
    '👋', '🤔', '🔥', '✨', '☕', '🌟', '🌮', '🙌',
    '🤓', '🤩', '🛠️', '⚡', '🏆', '🎯', '🎧', '🥑'
];

interface EmojiPickerProps {
    value: string;
    onChange: (emoji: string) => void;
    className?: string;
}

export default function EmojiPicker({ value, onChange, className = '' }: EmojiPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={pickerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-12 h-12 text-2xl bg-[var(--bg-surface)] border-2 border-[var(--border)] rounded-lg hover:border-[#faff00] transition-colors"
                title="Elegir emoji"
            >
                {value || <Smile size={24} className="text-[var(--text-secondary)]" />}
            </button>

            {isOpen && (
                <div className="absolute z-50 top-full mt-2 left-0 neo-card p-3 w-64 bg-white grid grid-cols-6 gap-2 origin-top-left animate-in fade-in zoom-in duration-200">
                    {COMMON_EMOJIS.map((emoji) => (
                        <button
                            type="button"
                            key={emoji}
                            onClick={() => {
                                onChange(emoji);
                                setIsOpen(false);
                            }}
                            className={`flex items-center justify-center w-8 h-8 text-xl rounded hover:bg-[#faff00] hover:scale-110 transition-transform ${emoji === value ? 'bg-[#faff00]' : ''}`}
                        >
                            {emoji}
                        </button>
                    ))}
                    <div className="col-span-6 mt-2 pt-2 border-t border-[var(--neo-black)] text-center text-xs font-black text-[#0f0f0f]">
                        Selecciona tu avatar
                    </div>
                </div>
            )}
        </div>
    );
}
