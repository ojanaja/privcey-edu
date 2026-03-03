'use client';

import { useLanguageStore } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import { useEffect, useState } from 'react';

export function LanguageSwitcher() {
    const { locale, setLocale } = useLanguageStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="w-9 h-9" />;

    return (
        <button
            onClick={() => setLocale(locale === 'en' ? 'id' : 'en')}
            className="p-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors flex items-center gap-1.5"
            title={locale === 'en' ? 'Switch to Bahasa Indonesia' : 'Switch to English'}
        >
            <Globe className="w-4 h-4 text-foreground/60" />
            <span className="text-[11px] font-medium text-foreground/60 uppercase">
                {locale}
            </span>
        </button>
    );
}
