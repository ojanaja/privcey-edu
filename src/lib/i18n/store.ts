import { create } from 'zustand';
import type { Locale } from './types';

interface LanguageState {
    locale: Locale;
    setLocale: (locale: Locale) => void;
}

const getInitialLocale = (): Locale => {
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem('privcey-locale');
    if (saved === 'en' || saved === 'id') return saved;
    return 'en';
};

export const useLanguageStore = create<LanguageState>((set) => ({
    locale: getInitialLocale(),
    setLocale: (locale) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('privcey-locale', locale);
        }
        set({ locale });
    },
}));
