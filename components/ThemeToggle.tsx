'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const [theme, setTheme] = useState<'dark' | 'light'>('light');

    // Load saved theme on mount
    useEffect(() => {
        const saved = localStorage.getItem('ec-theme') as 'dark' | 'light' | null;
        const initial = saved ?? 'light';
        setTheme(initial);
        document.documentElement.setAttribute('data-theme', initial);
    }, []);

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('ec-theme', next);
    };

    return (
        <button
            onClick={toggle}
            className="theme-toggle"
            aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            title={theme === 'dark' ? '☀️ Modo claro' : '🌙 Modo oscuro'}
            id="theme-toggle-btn"
        >
            <div className="theme-toggle-knob" />
            <span className="sr-only">{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>
    );
}
