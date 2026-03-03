import { useMemo } from 'react';
import { useLanguageStore } from './store';
import { en } from './en';
import { id } from './id';
import type { Translations } from './types';

const translations: Record<string, Translations> = { en, id };

export function useTranslation() {
    const locale = useLanguageStore((s) => s.locale);

    const t = useMemo(() => translations[locale] ?? translations.en, [locale]);

    return { t, locale };
}
