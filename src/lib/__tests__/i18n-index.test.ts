import { describe, expect, it } from 'vitest';
import { useLanguageStore, useTranslation } from '@/lib/i18n';

describe('i18n index exports', () => {
    it('re-exports store and translation hook symbols', () => {
        expect(useLanguageStore).toBeTypeOf('function');
        expect(useTranslation).toBeTypeOf('function');
    });
});
