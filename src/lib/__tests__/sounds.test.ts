import { beforeEach, describe, expect, it, vi } from 'vitest';

class AudioContextMock {
    state: 'running' | 'suspended' | 'closed' = 'running';
    currentTime = 0;
    destination = {};
    resume = vi.fn(() => Promise.resolve());
    createOscillator = vi.fn(() => ({
        type: 'sine',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
    }));
    createGain = vi.fn(() => ({
        gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
    }));
}

describe('sounds', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('plays tones and schedules notes across all public sound APIs', async () => {
        const instances: AudioContextMock[] = [];
        class MockedAudioContext extends AudioContextMock {
            constructor() {
                super();
                this.state = 'suspended';
                instances.push(this);
            }
        }
        vi.stubGlobal('AudioContext', MockedAudioContext);

        const { sounds } = await import('@/lib/sounds');

        sounds.countdownTick();
        sounds.countdownGo();
        sounds.optionSelect();
        sounds.correct();
        sounds.incorrect();
        sounds.streak();
        sounds.timeWarning();
        sounds.timeUp();
        sounds.gameComplete();
        sounds.masterRank();
        sounds.uiClick();
        sounds.newQuestion();

        expect(instances.length).toBeGreaterThan(0);
        expect(instances[0].resume).toHaveBeenCalled();
        expect(instances[0].createOscillator).toHaveBeenCalled();
        expect(instances[0].createGain).toHaveBeenCalled();
    });

    it('recovers when audio creation throws', async () => {
        class ThrowingAudioContext extends AudioContextMock {
            constructor() {
                super();
                this.createOscillator = vi.fn(() => {
                    throw new Error('audio unavailable');
                });
            }
        }
        vi.stubGlobal('AudioContext', ThrowingAudioContext);

        const { sounds } = await import('@/lib/sounds');

        expect(() => sounds.countdownTick()).not.toThrow();
        expect(() => sounds.countdownGo()).not.toThrow();
    });

    it('re-creates context when previous one is closed', async () => {
        const ctor = vi.fn(function AudioContextCtor(this: unknown) {
            return new AudioContextMock();
        });
        vi.stubGlobal('AudioContext', ctor);

        const { sounds } = await import('@/lib/sounds');
        sounds.countdownTick();

        const first = ctor.mock.results[0]?.value as AudioContextMock;
        first.state = 'closed';

        sounds.optionSelect();

        expect(ctor).toHaveBeenCalledTimes(2);
    });
});
