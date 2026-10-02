import { describe, expect, it } from 'vitest';
import { appStateReducer, type AppState } from './state';
import type { PatternData } from './types';

const createPattern = (id: string, name: string): PatternData => ({
    id,
    name,
    numberOfMeasures: 4,
    rhythms: [],
});

describe('appStateReducer', () => {
    it('clears patterns and timeline rows for a new beat', () => {
        const pattern = createPattern('pattern-a', 'Pattern 0');
        const initial: AppState = {
            patterns: [pattern],
            timelineRows: [{ slots: [pattern.id] }],
        };

        expect(appStateReducer(initial, { type: 'newBeat' })).toEqual({
            patterns: [],
            timelineRows: [],
        });
    });

    it('updates only a newly added pattern after an earlier pattern is deleted', () => {
        const first = createPattern('pattern-a', 'Pattern 0');
        const remaining = createPattern('pattern-b', 'Pattern 1');
        const added = createPattern('pattern-c', 'Pattern 0');
        const initial: AppState = {
            patterns: [first, remaining],
            timelineRows: [{ slots: [first.id, remaining.id] }],
        };

        const afterDelete = appStateReducer(initial, {
            type: 'deletePattern',
            patternId: first.id,
        });
        const afterAdd = appStateReducer(afterDelete, {
            type: 'addPattern',
            pattern: added,
        });
        const changedAdded = { ...added, numberOfMeasures: 8 };
        const afterChange = appStateReducer(afterAdd, {
            type: 'changePattern',
            pattern: changedAdded,
        });

        expect(afterChange.patterns).toEqual([remaining, changedAdded]);
        expect(afterChange.patterns[0]).toBe(remaining);
    });

    it('clears every timeline slot that references a deleted pattern', () => {
        const deleted = createPattern('pattern-a', 'Pattern 0');
        const retained = createPattern('pattern-b', 'Pattern 1');
        const initial: AppState = {
            patterns: [deleted, retained],
            timelineRows: [
                { slots: [deleted.id, retained.id, deleted.id] },
                { slots: [undefined, deleted.id, retained.id] },
            ],
        };

        const result = appStateReducer(initial, {
            type: 'deletePattern',
            patternId: deleted.id,
        });

        expect(result.patterns).toEqual([retained]);
        expect(result.timelineRows).toEqual([
            { slots: [undefined, retained.id, undefined] },
            { slots: [undefined, undefined, retained.id] },
        ]);
    });

    it('applies functional timeline updates to the latest rows', () => {
        const initial: AppState = {
            patterns: [],
            timelineRows: [{ slots: [undefined] }],
        };

        const result = appStateReducer(initial, {
            type: 'setTimelineRows',
            update: (rows) => [...rows, { slots: [undefined] }],
        });

        expect(result.timelineRows).toHaveLength(2);
    });
});
