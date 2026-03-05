/**
 * Sound effects for STRENGTHENS quiz game.
 * Uses Web Audio API — no external files needed.
 * All sounds are synthesized programmatically.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.15,
) {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch {

    }
}

function scheduleNote(
    frequency: number,
    delay: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.12,
) {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
    } catch {
    }
}

export const sounds = {
    countdownTick() {
        playTone(880, 0.12, 'sine', 0.1);
    },

    countdownGo() {
        scheduleNote(523, 0, 0.15, 'square', 0.1);    // C5
        scheduleNote(659, 0.06, 0.15, 'square', 0.1);  // E5
        scheduleNote(784, 0.12, 0.15, 'square', 0.1);  // G5
        scheduleNote(1047, 0.18, 0.3, 'square', 0.12);  // C6
    },

    optionSelect() {
        playTone(600, 0.06, 'square', 0.06);
    },

    correct() {
        scheduleNote(523, 0, 0.12, 'sine', 0.12);     // C5
        scheduleNote(659, 0.08, 0.12, 'sine', 0.12);   // E5
        scheduleNote(784, 0.16, 0.2, 'sine', 0.14);    // G5
    },

    incorrect() {
        scheduleNote(392, 0, 0.2, 'sawtooth', 0.06);    // G4
        scheduleNote(330, 0.15, 0.3, 'sawtooth', 0.06);  // E4
    },

    streak() {
        scheduleNote(784, 0, 0.1, 'square', 0.08);     // G5
        scheduleNote(988, 0.08, 0.1, 'square', 0.08);   // B5
        scheduleNote(1175, 0.16, 0.2, 'square', 0.1);   // D6
    },

    timeWarning() {
        playTone(440, 0.08, 'triangle', 0.06);
    },

    timeUp() {
        playTone(220, 0.3, 'sawtooth', 0.08);
        scheduleNote(196, 0.15, 0.3, 'sawtooth', 0.06);
    },

    gameComplete() {
        scheduleNote(523, 0, 0.2, 'sine', 0.1);        // C5
        scheduleNote(659, 0, 0.2, 'sine', 0.08);        // E5
        scheduleNote(784, 0, 0.2, 'sine', 0.08);        // G5
        scheduleNote(659, 0.2, 0.15, 'sine', 0.1);      // E5
        scheduleNote(784, 0.35, 0.15, 'sine', 0.1);     // G5
        scheduleNote(1047, 0.5, 0.4, 'sine', 0.12);     // C6
        scheduleNote(784, 0.5, 0.4, 'sine', 0.08);      // G5
        scheduleNote(1319, 0.5, 0.4, 'sine', 0.08);     // E6
    },

    masterRank() {
        sounds.gameComplete();
        scheduleNote(1568, 0.9, 0.15, 'sine', 0.06);   // G6
        scheduleNote(1760, 1.0, 0.15, 'sine', 0.06);    // A6
        scheduleNote(2093, 1.1, 0.4, 'sine', 0.08);     // C7
    },

    uiClick() {
        playTone(1200, 0.04, 'sine', 0.04);
    },

    newQuestion() {
        playTone(440, 0.08, 'triangle', 0.06);
        scheduleNote(554, 0.06, 0.08, 'triangle', 0.06);
    },
};
