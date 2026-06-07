import hihat1Url from './assets/hihat1.wav';
import kick1Url from './assets/kick1.wav';
import snare1Url from './assets/snare1.wav';
import hihat2Url from './assets/hihat2.wav';
import kick2Url from './assets/kick2.wav';
import snare2Url from './assets/snare2.wav';
import type { MeasureData, NoteData, RhythmData, StoredData, StoredPatternData, StoredTimelineRowData } from './types';

export const examplePatterns: StoredPatternData[] = [
    {
        index: 0,
        rhythms:
            [{
                index: 0,
                name: "hihat",
                sampleFileName: hihat1Url,
                notesPerMeasure: 16,
                measures: [
                    {
                        index: 0,
                        noteSequence: "555-5-5-55-55-5-"
                    }
                ],
            },
            {
                index: 1,
                name: "kick",
                sampleFileName: kick1Url,
                notesPerMeasure: 8,
                measures: [
                    {
                        index: 0,
                        noteSequence: "5--2-5-2"
                    }
                ],
            },
            {
                index: 2,
                name: "snare",
                sampleFileName: snare1Url,
                notesPerMeasure: 4,
                measures: [
                    {
                        index: 0,
                        noteSequence: "-5-5"
                    }
                ],
            }],
        name: "Skip-beat"
    },
    {
        index: 1,
        rhythms:
            [{
                index: 0,
                name: "hihat",
                sampleFileName: hihat2Url,
                notesPerMeasure: 32,
                measures: [
                    {
                        index: 0,
                        noteSequence: "555-555-----5---5-----5-5-----5-"
                    }
                ],
            },
            {
                index: 1,
                name: "kick",
                sampleFileName: kick2Url,
                notesPerMeasure: 8,
                measures: [
                    {
                        index: 0,
                        noteSequence: "5----2-2"
                    }
                ],
            },
            {
                index: 2,
                name: "snare",
                sampleFileName: snare2Url,
                notesPerMeasure: 16,
                measures: [
                    {
                        index: 0,
                        noteSequence: "----5----2--5---"
                    }
                ],
            }],
        name: "Trap-beat"
    }
];

export const exampleTimelines: StoredTimelineRowData[] = [
    { slots: [0, 0, 1, 1] },
    { slots: [1, 0, 1, 0] }
]

export const exampleData: StoredData = {
    name: "example",
    timelineRows: exampleTimelines,
    patterns: examplePatterns
}

export const eq_fftSize = 1024;
export const wssUrl = "ws://localhost:8000"
export const mcpUrl = "http://localhost:8000/mcp"

export const getViewportWidthRem = () => {
    if (typeof window === "undefined") return 75;

    const rootFontSize = Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
    );

    if (!Number.isFinite(rootFontSize) || rootFontSize <= 0) return 75;
    return window.innerWidth / rootFontSize;
}

export const getNotePosition64 = (noteIndex: number, notesPerMeasure: number) => (
    noteIndex * (64 / notesPerMeasure)
)

export const createRhythm = (
    index: number,
    numberOfMeasures: number,
    audioContext: AudioContext,
    analyserNode: AnalyserNode
): RhythmData => {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    gainNode.connect(analyserNode);

    return {
        index: index,
        name: `Rhythm ${index}`,
        gainNode: gainNode,
        notesPerMeasure: 4,
        measures: createMeasures(numberOfMeasures, 4),
        sampleFilename: ""
    };
}

export const createMeasures = (numberOfMeasures: number, notesPerMeasure: number): MeasureData[] => (
    Array.from({ length: numberOfMeasures }, (_, measureIndex) => (
        createMeasure(measureIndex, notesPerMeasure)
    ))
)


export const createNotes = (notesPerMeasure: number): NoteData[] => (
    Array.from({ length: notesPerMeasure }, (_, noteIndex) => ({
        index: noteIndex,
        position64: getNotePosition64(noteIndex, notesPerMeasure),
        value: "",
    }))
)

export const createMeasure = (index: number, notesPerMeasure: number): MeasureData => ({
    index,
    notes: createNotes(notesPerMeasure),
})

export const findClosestAvailableNoteIndex = (notes: NoteData[], noteIndex: number): number | undefined => {
    if (notes[noteIndex]?.value === "") return noteIndex;

    for (let offset = 1; offset < notes.length; offset++) {
        const nextIndex = noteIndex + offset;
        const previousIndex = noteIndex - offset;

        if (notes[nextIndex]?.value === "") return nextIndex;
        if (notes[previousIndex]?.value === "") return previousIndex
    }
}

const positionsPerMeasure = 64;

export const resizeMeasureNotes = (
    measure: MeasureData,
    previousNotesPerMeasure: number,
    nextNotesPerMeasure: number,
): MeasureData => {
    const notes = createNotes(nextNotesPerMeasure);

    measure.notes.forEach((note) => {
        if (note.value === "") return;

        const position64 = note.position64 ?? getNotePosition64(note.index, previousNotesPerMeasure);
        const rhythmicPosition = position64 / positionsPerMeasure;
        const noteIndex = Math.min(
            nextNotesPerMeasure - 1,
            Math.round(rhythmicPosition * nextNotesPerMeasure),
        );
        const availableIndex = findClosestAvailableNoteIndex(notes, noteIndex);

        if (availableIndex === undefined) return;

        notes[availableIndex] = {
            ...notes[availableIndex],
            value: note.value,
        };
    });

    return {
        ...measure,
        notes,
    };
}