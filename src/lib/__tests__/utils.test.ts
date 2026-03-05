import { describe, expect, it } from 'vitest';
import {
    cn,
    formatDate,
    formatDateTime,
    formatTimer,
    getScoreBgColor,
    getScoreColor,
    truncate,
    getInitials,
} from '@/lib/utils';

describe('utils', () => {
    it('combines class names with cn', () => {
        expect(cn('a', undefined, 'b', false && 'c')).toBe('a b');
    });

    it('formats date using Indonesian locale', () => {
        const date = '2026-03-04T10:15:00.000Z';
        const expected = new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date(date));

        expect(formatDate(date)).toBe(expected);
    });

    it('formats datetime using Indonesian locale', () => {
        const date = '2026-03-04T10:15:00.000Z';
        const expected = new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));

        expect(formatDateTime(date)).toBe(expected);
    });

    it('formats timer with and without hours', () => {
        expect(formatTimer(59)).toBe('00:59');
        expect(formatTimer(3661)).toBe('01:01:01');
    });

    it('returns score colors for all ranges', () => {
        expect(getScoreColor(95)).toBe('text-green-400');
        expect(getScoreColor(70)).toBe('text-yellow-400');
        expect(getScoreColor(10)).toBe('text-red-400');
    });

    it('returns score background colors for all ranges', () => {
        expect(getScoreBgColor(95)).toBe('bg-green-500/20 border-green-500/30');
        expect(getScoreBgColor(70)).toBe('bg-yellow-500/20 border-yellow-500/30');
        expect(getScoreBgColor(10)).toBe('bg-red-500/20 border-red-500/30');
    });

    it('truncates long strings and keeps short strings', () => {
        expect(truncate('abcdef', 3)).toBe('abc...');
        expect(truncate('abc', 3)).toBe('abc');
    });

    it('builds initials from one or more names', () => {
        expect(getInitials('john doe')).toBe('JD');
        expect(getInitials('single')).toBe('S');
    });
});
