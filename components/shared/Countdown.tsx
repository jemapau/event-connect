'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownProps {
    totalSeconds: number;
    timeLeft: number;
    label?: string;
    onComplete?: () => void;
}

export default function NeobrutalistCountdown({
    totalSeconds,
    timeLeft,
    label = 'TIEMPO RESTANTE',
    onComplete
}: CountdownProps) {
    const [hasCompleted, setHasCompleted] = useState(false);

    // Calculate percentage (0 to 100)
    // 100% means full time left
    // 0% means time is up
    const percentage = Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100));

    // Determine colors based on remaining time
    // Green -> Yellow -> Red
    let barColor = 'var(--accent-2)'; // Greenish/Cyan
    if (percentage <= 25) {
        barColor = 'var(--accent-1)'; // Red/Pink
    } else if (percentage <= 50) {
        barColor = '#faff00'; // Yellow
    }

    // Format time (MM:SS)
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Handle completion callback once
    useEffect(() => {
        if (timeLeft <= 0 && !hasCompleted) {
            setHasCompleted(true);
            onComplete?.();
        }
    }, [timeLeft, hasCompleted, onComplete]);

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-black text-[var(--text-secondary)] tracking-wider">
                    {label}
                </span>
                <div className="flex items-center gap-1.5 font-black text-[var(--text-primary)]">
                    <Clock size={16} style={{ color: barColor }} />
                    <span className="text-xl tabular-nums tracking-tighter" style={{ color: barColor }}>
                        {formattedTime}
                    </span>
                </div>
            </div>

            {/* Neobrutalist Progress Bar Track */}
            <div className="h-6 w-full bg-[var(--bg-surface)] border-2 border-[var(--neo-black)] rounded-sm relative overflow-hidden">
                {/* Neobrutalist Progress Bar Fill */}
                <div
                    className="h-full border-r-2 border-[var(--neo-black)] transition-all duration-1000 ease-linear flex items-center justify-end px-2"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: barColor,
                    }}
                >
                    {/* Add subtle animated stripes for visual interest when > 25% */}
                    {percentage > 25 && (
                        <div className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)'
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Urgency indicator text when low time */}
            {percentage <= 25 && timeLeft > 0 && (
                <p className="text-xs font-black text-center mt-2 animate-pulse" style={{ color: 'var(--accent-1)' }}>
                    ¡Date prisa!
                </p>
            )}

            {timeLeft <= 0 && (
                <p className="text-xs font-black text-center mt-2" style={{ color: 'var(--text-secondary)' }}>
                    ¡Tiempo agotado!
                </p>
            )}
        </div>
    );
}
