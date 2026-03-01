'use client';

interface QuizOptionsProps {
    options: string[];
    onAnswer: (index: number) => void;
    selectedIndex: number | null;
}

const COLORS = [
    { bg: 'var(--accent-1)', label: '🔴' },
    { bg: 'var(--accent-2)', label: '🔵' },
    { bg: 'var(--accent-3)', label: '🟢' },
    { bg: 'var(--accent-4)', label: '🟡' },
];

export default function QuizOptions({
    options,
    onAnswer,
    selectedIndex,
}: QuizOptionsProps) {
    return (
        <div className="flex flex-col gap-3">
            {options.map((opt, i) => {
                const color = COLORS[i % COLORS.length];
                const isSelected = selectedIndex === i;
                return (
                    <button
                        key={i}
                        id={`answer-${i}`}
                        onClick={() => onAnswer(i)}
                        disabled={selectedIndex !== null}
                        className="neo-btn w-full py-5 px-5 text-left font-black text-white text-base"
                        style={{
                            background: color.bg,
                            opacity: selectedIndex !== null && !isSelected ? 0.5 : 1,
                            fontSize: '1rem',
                            minHeight: 64,
                        }}
                    >
                        <span className="mr-2">{color.label}</span>
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}
