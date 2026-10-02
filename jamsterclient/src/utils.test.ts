import { describe, expect, it, vi } from 'vitest';
import { createRhythm, getUniqueNumberedName } from './utils';

describe('runtime data creation', () => {
    it('chooses the lowest unused numbered name', () => {
        expect(getUniqueNumberedName('Pattern', ['Pattern 0', 'Custom', 'Pattern 2'])).toBe('Pattern 1');
    });

    it('gives rhythms stable unique IDs while leaving positions derived', () => {
        const analyserNode = {} as AnalyserNode;
        const audioContext = {
            createGain: () => ({
                gain: { value: 0 },
                connect: vi.fn(),
            }),
        } as unknown as AudioContext;

        const first = createRhythm('Rhythm 0', 1, audioContext, analyserNode);
        const second = createRhythm('Rhythm 1', 1, audioContext, analyserNode);

        expect(first.id).not.toBe(second.id);
        expect(first.measures[0]).not.toHaveProperty('index');
        expect(first.measures[0].notes[0]).not.toHaveProperty('index');
    });
});
