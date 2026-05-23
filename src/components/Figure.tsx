import { useState } from "react";
import Pattern from "./Pattern";

export type PatternData = {
    index: number;
    notesPerMeasure: number;
    measures: MeasureData[];
    sample?: AudioBuffer;
}

export type MeasureData = {
    index: number;
    notes: NoteData[];
}

export type NoteData = {
    index: number;
    value: string;
}

const createNotes = (notesPerMeasure: number): NoteData[] => (
    Array.from({ length: notesPerMeasure }, (_, noteIndex) => ({
        index: noteIndex,
        value: "",
    }))
)

const createMeasure = (index: number, notesPerMeasure: number): MeasureData => ({
    index,
    notes: createNotes(notesPerMeasure),
})

const findClosestAvailableNoteIndex = (notes: NoteData[], noteIndex: number): number | undefined => {
    if (notes[noteIndex]?.value === "") return noteIndex;

    for (let offset = 1; offset < notes.length; offset++) {
        const nextIndex = noteIndex + offset;
        const previousIndex = noteIndex - offset;

        if (notes[nextIndex]?.value === "") return nextIndex;
        if (notes[previousIndex]?.value === "") return previousIndex
    }
}

const resizeMeasureNotes = (
    measure: MeasureData,
    previousNotesPerMeasure: number,
    nextNotesPerMeasure: number,
): MeasureData => {
    const notes = createNotes(nextNotesPerMeasure);

    measure.notes.forEach((note) => {
        if (note.value === "") return;

        const rhythmicPosition = note.index / previousNotesPerMeasure;
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

const updatePatternNoteValue = (
    pattern: PatternData,
    measureIndex: number,
    noteIndex: number,
    value: string,
): PatternData => {
    return {
        ...pattern,
        measures: pattern.measures.map((measure) => {
            if (measure.index !== measureIndex) return measure;

            return {
                ...measure,
                notes: measure.notes.map((note) => {
                    if (note.index !== noteIndex) return note;

                    return {
                        ...note,
                        value,
                    };
                }),
            };
        }),
    };
}

const updatePatternSample = (
    pattern: PatternData,
    sample: AudioBuffer | undefined,
): PatternData => {
    return {
        ...pattern,
        sample,
    };
}

const updatePatternNotesPerMeasure = (
    pattern: PatternData,
    notesPerMeasure: number,
): PatternData => {
    return {
        ...pattern,
        notesPerMeasure,
        measures: pattern.measures.map((measure) => (
            resizeMeasureNotes(measure, pattern.notesPerMeasure, notesPerMeasure)
        )),
    };
}

const updatePatternNumberOfMeasures = (
    pattern: PatternData,
    numberOfMeasures: number,
): PatternData => {
    return {
        ...pattern,
        measures: Array.from({ length: numberOfMeasures }, (_, measureIndex) => (
            pattern.measures[measureIndex] ?? createMeasure(measureIndex, pattern.notesPerMeasure)
        )),
    };
}

const Figure = () => {
    const [patterns, setPatterns] = useState<PatternData[]>([]);
    const [numberOfMeasures, setNumberOfMeasures] = useState<number>(4);

    const createMeasures = (notesPerMeasure: number): MeasureData[] => (
        Array.from({ length: numberOfMeasures }, (_, measureIndex) => (
            createMeasure(measureIndex, notesPerMeasure)
        ))
    )

    const createPattern = (index: number): PatternData => ({
        index,
        notesPerMeasure: 4,
        measures: createMeasures(4),
    })

    const addPattern = () => setPatterns((currentPatterns) => [
        ...currentPatterns,
        createPattern(currentPatterns.length),
    ])

    const handleNoteChange = (
        patternIndex: number,
        measureIndex: number,
        noteIndex: number,
        value: string,
    ) => {
        setPatterns((currentPatterns) => currentPatterns.map((pattern) => {
            if (pattern.index !== patternIndex) return pattern;
            return updatePatternNoteValue(pattern, measureIndex, noteIndex, value);
        }));
    }

    const handleSampleChange = (patternIndex: number, sample: AudioBuffer) => {
        setPatterns((currentPatterns) => currentPatterns.map((pattern) => {
            if (pattern.index !== patternIndex) return pattern;
            return updatePatternSample(pattern, sample);
        }));
    }

    const handleNotesPerMeasureChange = (patternIndex: number, notesPerMeasure: number) => {
        setPatterns((currentPatterns) => currentPatterns.map((pattern) => {
            if (pattern.index !== patternIndex) return pattern;
            return updatePatternNotesPerMeasure(pattern, notesPerMeasure);
        }));
    }

    const handleNumberOfMeasuresChange = (numberOfMeasures: number) => {
        setNumberOfMeasures(numberOfMeasures);
        setPatterns((currentPatterns) => currentPatterns.map((pattern) => (
            updatePatternNumberOfMeasures(pattern, numberOfMeasures)
        )));
    }

    return (
        <div className="figure">
            <div className="figure-options">
                <button className="btn-default" onClick={addPattern}>Add pattern</button>
                <input
                    className="measures-input"
                    type="number"
                    value={numberOfMeasures}
                    onChange={(e) => {
                        const value = e.target.value
                        handleNumberOfMeasuresChange(Number(value));
                    }}
                />
            </div>
            {patterns.map((pattern) => (
                <Pattern
                    key={pattern.index}
                    pattern={pattern}
                    onNoteChange={handleNoteChange}
                    onSampleChange={handleSampleChange}
                    onNotesPerMeasureChange={handleNotesPerMeasureChange}
                />
            ))}
        </div>
    )
}

export default Figure;
