import React from 'react';

interface ProgressBarProps {
    current: number;
    total: number;
    label?: string;
    showLabel?: boolean;
    color?: string;
}

export default function ProgressBar({
    current,
    total,
    label = 'Progreso',
    showLabel = true,
    color = '#faff00' // Default to our vibrant yellow
}: ProgressBarProps) {
    // Calculate percentage, ensuring it stays between 0 and 100
    const percentage = Math.max(0, Math.min(100, (current / total) * 100));

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-black text-[var(--text-secondary)] tracking-wider uppercase">
                        {label}
                    </span>
                    <span className="text-sm font-black text-[var(--text-primary)]">
                        {current} / {total}
                    </span>
                </div>
            )}

            {/* Neobrutalist Progress Bar Track */}
            <div className="h-6 w-full bg-[#f5f5f5] border-2 border-[var(--neo-black)] rounded-sm relative overflow-hidden">
                {/* Neobrutalist Progress Bar Fill */}
                <div
                    className="h-full border-r-2 border-[var(--neo-black)] transition-all duration-500 ease-out flex items-center justify-end"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                    }}
                >
                    {/* Add subtle animated stripes for visual interest */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.15) 10px, rgba(0,0,0,0.15) 20px)'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
