import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('i18n store (node)', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('defaults to en when window is unavailable', async () => {
        const { useLanguageStore } = await import('@/lib/i18n/store');
        expect(useLanguageStore.getState().locale).toBe('en');
    });

    it('updates locale without touching localStorage when window is unavailable', async () => {
        const { useLanguageStore } = await import('@/lib/i18n/store');
        useLanguageStore.getState().setLocale('id');

        expect(useLanguageStore.getState().locale).toBe('id');
    });
});
