import { describe, expect, it } from 'vitest';
import type { PatternData } from '../types';
import { loadTimelineRows } from './load';
import { storeTimelineRows } from './save';

const patterns: PatternData[] = [
    { id: 'pattern-a', name: 'A', numberOfMeasures: 1, rhythms: [] },
    { id: 'pattern-b', name: 'B', numberOfMeasures: 1, rhythms: [] },
];

describe('timeline storage translation', () => {
    it('translates runtime IDs to stored positions and back', () => {
        const runtimeRows = [{ slots: ['pattern-b', undefined, 'pattern-a'] }];

        const storedRows = storeTimelineRows(patterns, runtimeRows);

        expect(storedRows).toEqual([{ slots: [1, undefined, 0] }]);
        expect(loadTimelineRows(storedRows, patterns)).toEqual(runtimeRows);
    });

    it('keeps dangling runtime IDs and invalid stored positions empty', () => {
        expect(storeTimelineRows(patterns, [{ slots: ['missing', undefined] }])).toEqual([
            { slots: [undefined, undefined] },
        ]);
        expect(loadTimelineRows([{ slots: [-1, 10, undefined] }], patterns)).toEqual([
            { slots: [undefined, undefined, undefined] },
        ]);
    });
});
