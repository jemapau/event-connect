import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface WordCloudInputProps {
    prompt: string;
    maxWords?: number;
    onAnswer: (words: string[]) => void;
    answered: boolean;
}

export default function WordCloudInput({
    prompt,
    maxWords = 3,
    onAnswer,
    answered
}: WordCloudInputProps) {
    const [words, setWords] = useState<string[]>([]);
    const [currentWord, setCurrentWord] = useState('');

    const handleAdd = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = currentWord.trim();
        if (trimmed && words.length < maxWords) {
            setWords([...words, trimmed]);
            setCurrentWord('');
        }
    };

    const handleRemove = (index: number) => {
        setWords(words.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (words.length > 0) {
            onAnswer(words);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="neo-card p-5">
                <p className="text-xs font-black text-[var(--text-secondary)] mb-2">NUBE DE PALABRAS</p>
                <p className="text-lg font-black text-[var(--text-primary)] leading-tight">
                    {prompt}
                </p>
                <p className="text-sm font-bold text-[var(--text-secondary)] mt-3">
                    {words.length} / {maxWords} palabras agregadas
                </p>
            </div>

            {!answered ? (
                <div className="neo-card p-5">
                    <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={currentWord}
                            onChange={(e) => setCurrentWord(e.target.value)}
                            disabled={words.length >= maxWords}
                            placeholder={words.length >= maxWords ? "Límite alcanzado" : "Escribe una palabra..."}
                            className="neo-input flex-1"
                        />
                        <button
                            type="submit"
                            disabled={!currentWord.trim() || words.length >= maxWords}
                            className="neo-btn px-4 py-2 font-black"
                            style={{
                                background: (!currentWord.trim() || words.length >= maxWords) ? 'var(--bg-surface)' : 'var(--accent-1)',
                                color: (!currentWord.trim() || words.length >= maxWords) ? 'var(--text-secondary)' : 'var(--accent-cta-text)'
                            }}
                        >
                            <Plus size={18} />
                        </button>
                    </form>

                    {words.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {words.map((w, i) => (
                                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[var(--neo-black)] font-bold text-sm bg-[var(--bg-card-hover)] text-[var(--text-primary)]">
                                    {w}
                                    <button type="button" onClick={() => handleRemove(i)} className="text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={words.length === 0}
                        className="neo-btn w-full py-4 font-black"
                        style={{
                            background: words.length > 0 ? 'var(--accent-3)' : 'var(--bg-surface)',
                            color: words.length > 0 ? '#fff' : 'var(--text-secondary)'
                        }}
                    >
                        Enviar palabras
                    </button>
                </div>
            ) : (
                <div className="neo-card p-6 text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="font-black text-[var(--text-primary)]">¡Palabras enviadas!</p>
                    <p className="text-[var(--text-secondary)] text-sm mt-1 mb-4">Esperando a que el host muestre la nube...</p>
                    <div className="flex flex-wrap justify-center gap-2 opacity-80">
                        {words.map((w, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-full border-2 border-[var(--neo-black)] font-bold text-sm bg-[var(--bg-card-hover)] text-[var(--text-primary)]">
                                {w}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
