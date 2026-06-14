import type { RhythmData, MeasureData, NoteData } from "./types";

export const eq_fftSize = 1024;
export const wssUrl = "wss://beatdoc-mcp.fly.dev"
export const mcpUrl = "https://beatdoc-mcp.fly.dev/mcp"

export const getUrlFilename = (url: string) => url.split("/").pop()?.replace("%20", " ") ?? url

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
        value: "-",
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
