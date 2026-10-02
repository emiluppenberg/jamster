import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { PatternData, RhythmData, TimelineRowData } from '../types';
import Pattern from './Pattern';
import Rhythm from './Rhythm';
import TimelineRows from './TimelineRows';

vi.mock('../Context', () => ({
    useJamsterContext: () => ({
        audioContext: {
            createGain: () => ({
                gain: { value: 0 },
                connect: vi.fn(),
            }),
        },
        analyserNode: {},
        beatName: 'Test beat',
        setBeatName: vi.fn(),
        storedSamples: [
            { sampleFilename: 'sample-a.wav', mcpDescription: '', audioBuffer: {}, arrayBuffer: new ArrayBuffer(0) },
            { sampleFilename: 'sample-b.wav', mcpDescription: '', audioBuffer: {}, arrayBuffer: new ArrayBuffer(0) },
        ],
        saveStoredSampleArrayBuffer: vi.fn(),
        saveStoredSampleMcpDescription: vi.fn(),
        deleteStoredSample: vi.fn(),
    }),
}));

const createRhythm = (id: string, name: string, sampleFilename: string): RhythmData => ({
    id,
    name,
    gainNode: {} as GainNode,
    notesPerMeasure: 2,
    measures: [
        { notes: [{ position64: 0, value: '-' }, { position64: 32, value: '-' }] },
        { notes: [{ position64: 0, value: '-' }, { position64: 32, value: '-' }] },
    ],
    sampleFilename,
});

describe('derived positions and stable identities', () => {
    it('passes derived measure and note positions while retaining the rhythm ID', () => {
        const onNoteChange = vi.fn();
        const rhythm = createRhythm('rhythm-a', 'Rhythm A', 'sample-a.wav');
        const { container } = render(
            <Rhythm
                rhythm={rhythm}
                onNoteChange={onNoteChange}
                onSampleChange={vi.fn()}
                onNotesPerMeasureChange={vi.fn()}
                onDelete={vi.fn()}
                onNameChange={vi.fn()}
                onFocusNewRhythm={vi.fn()}
                focusRhythm={undefined}
            />,
        );

        const noteInputs = container.querySelectorAll<HTMLInputElement>('input.note');
        fireEvent.keyDown(noteInputs[3], { key: '7' });

        expect(onNoteChange).toHaveBeenCalledWith('rhythm-a', 1, 1, '7');
    });

    it('does not transfer rhythm-local dialog state after deleting an earlier rhythm', () => {
        const first = createRhythm('rhythm-a', 'Rhythm A', 'sample-a.wav');
        const second = createRhythm('rhythm-b', 'Rhythm B', 'sample-b.wav');

        const Harness = () => {
            const [pattern, setPattern] = useState<PatternData>({
                id: 'pattern-a',
                name: 'Pattern A',
                numberOfMeasures: 2,
                rhythms: [first, second],
            });

            return (
                <Pattern
                    pattern={pattern}
                    patterns={[pattern]}
                    isPlaying={false}
                    onPatternChange={setPattern}
                    onPatternDelete={vi.fn()}
                    onPlayPattern={vi.fn()}
                    onStopPlayback={vi.fn()}
                />
            );
        };

        const { container } = render(<Harness />);
        const deleteButtons = container.querySelectorAll<HTMLButtonElement>('.delete-rhythm');
        fireEvent.click(deleteButtons[0]);

        expect(container.querySelectorAll('.rhythm')).toHaveLength(1);
        expect(container.querySelector('.dialog-field.filename.selected-sample')).toHaveTextContent('sample-b.wav');
    });

    it('uses the derived timeline-row position when deleting a row', () => {
        const rows: TimelineRowData[] = [
            { slots: ['pattern-a'] },
            { slots: ['pattern-b'] },
        ];
        const onTimelineRowsChange = vi.fn();

        const { container } = render(
            <TimelineRows
                isPlaying={false}
                bpm={120}
                setBpm={vi.fn()}
                patterns={[
                    { id: 'pattern-a', name: 'A', numberOfMeasures: 1, rhythms: [] },
                    { id: 'pattern-b', name: 'B', numberOfMeasures: 1, rhythms: [] },
                ]}
                timelineRows={rows}
                timelineLength={1}
                onTimelineRowsChange={onTimelineRowsChange}
                playingSlotIndex={undefined}
                onPlayTimeline={vi.fn()}
                onStopPlayback={vi.fn()}
            />,
        );

        const deleteButtons = container.querySelectorAll<HTMLButtonElement>('.timeline-row .delete');
        fireEvent.click(deleteButtons[1]);

        expect(onTimelineRowsChange).toHaveBeenCalledWith([rows[0]]);
        expect(screen.getByDisplayValue('Test beat')).toBeInTheDocument();
    });
});
