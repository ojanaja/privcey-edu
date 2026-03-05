// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

function createStorageMock() {
    const storage = new Map<string, string>();
    return {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
            storage.set(key, value);
        },
        removeItem: (key: string) => {
            storage.delete(key);
        },
        clear: () => {
            storage.clear();
        },
    };
}

describe('useTranslation', () => {
    beforeEach(() => {
        vi.resetModules();
        const localStorageMock = createStorageMock();
        vi.stubGlobal('localStorage', localStorageMock);
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            configurable: true,
        });
    });

    it('returns Indonesian translations for id locale', async () => {
        const { useLanguageStore } = await import('@/lib/i18n/store');
        const { useTranslation } = await import('@/lib/i18n/useTranslation');

        useLanguageStore.setState({ locale: 'id' });

        const { result } = renderHook(() => useTranslation());

        expect(result.current.locale).toBe('id');
        expect(result.current.t.common.loading).toBe('Memuat...');
    });

    it('falls back to English when locale key is unknown', async () => {
        const { useLanguageStore } = await import('@/lib/i18n/store');
        const { useTranslation } = await import('@/lib/i18n/useTranslation');

        useLanguageStore.setState({ locale: 'xx' as never });

        const { result } = renderHook(() => useTranslation());

        expect(result.current.locale).toBe('xx');
        expect(result.current.t.common.loading).toBe('Loading...');
    });
});
