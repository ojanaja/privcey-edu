'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="w-9 h-9" />;

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        >
            {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5 text-foreground/60" />
            ) : (
                <Moon className="w-4.5 h-4.5 text-foreground/60" />
            )}
        </button>
    );
}
