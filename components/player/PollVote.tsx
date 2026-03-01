import React from 'react';

interface PollVoteProps {
    question: string;
    options: string[];
    onAnswer: (index: number) => void;
    answered: boolean;
    selectedIndex: number | null;
}

export default function PollVote({
    question,
    options,
    onAnswer,
    answered,
    selectedIndex,
}: PollVoteProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="neo-card p-5">
                <p className="text-xs font-black text-[var(--text-secondary)] mb-2">ENCUESTA</p>
                <p className="text-lg font-black text-[var(--text-primary)]">
                    {question}
                </p>
            </div>
            {options.map((opt, i) => (
                <button
                    key={i}
                    id={`poll-option-${i}`}
                    onClick={() => onAnswer(i)}
                    disabled={answered}
                    className="neo-btn w-full py-4 font-black text-left px-5"
                    style={{
                        background: answered && selectedIndex === i
                            ? 'var(--accent-3)'
                            : 'var(--bg-card)',
                        color: answered && selectedIndex === i ? '#fff' : 'var(--text-primary)',
                        opacity: answered && selectedIndex !== i ? 0.5 : 1,
                    }}
                >
                    {opt}
                </button>
            ))}
            {answered && (
                <p className="text-center text-[var(--text-secondary)] text-sm">
                    ¡Voto enviado! Esperando resultados...
                </p>
            )}
        </div>
    );
}
