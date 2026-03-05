// @vitest-environment jsdom

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

describe('i18n store (browser)', () => {
    beforeEach(() => {
        vi.resetModules();
        const localStorageMock = createStorageMock();
        vi.stubGlobal('localStorage', localStorageMock);
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            configurable: true,
        });
    });

    it('uses saved locale from localStorage', async () => {
        window.localStorage.setItem('privcey-locale', 'id');

        const { useLanguageStore } = await import('@/lib/i18n/store');
        expect(useLanguageStore.getState().locale).toBe('id');
    });

    it('falls back to en for unsupported localStorage value', async () => {
        window.localStorage.setItem('privcey-locale', 'fr');

        const { useLanguageStore } = await import('@/lib/i18n/store');
        expect(useLanguageStore.getState().locale).toBe('en');
    });

    it('persists locale updates', async () => {
        const { useLanguageStore } = await import('@/lib/i18n/store');
        useLanguageStore.getState().setLocale('id');

        expect(useLanguageStore.getState().locale).toBe('id');
        expect(window.localStorage.getItem('privcey-locale')).toBe('id');
    });
});
