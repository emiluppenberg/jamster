import Rhythm from "./Rhythm";
import { useJamsterContext } from "../Context";
import type { MeasureData, NoteData, PatternData, RhythmData } from "../types";
import { useEffect, useState, type CSSProperties } from "react";
import { getViewportWidthRem } from "../utils";

const positionsPerMeasure = 64;
const defaultMeasuresAtScreenWidth = 4;
const defaultMeasuresScreenRatio = 0.75;
const minimumZoomLevel = 0.25;
const noteValueWidthRem = 0.6;

const getNotePosition64 = (noteIndex: number, notesPerMeasure: number) => (
    noteIndex * (positionsPerMeasure / notesPerMeasure)
)

const createNotes = (notesPerMeasure: number): NoteData[] => (
    Array.from({ length: notesPerMeasure }, (_, noteIndex) => ({
        index: noteIndex,
        position64: getNotePosition64(noteIndex, notesPerMeasure),
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

const updateRhythmNoteValue = (
    rhythm: RhythmData,
    measureIndex: number,
    noteIndex: number,
    value: string,
): RhythmData => {
    return {
        ...rhythm,
        measures: rhythm.measures.map((measure) => {
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

const updateRhythmSample = (
    rhythm: RhythmData,
    sample: AudioBuffer | undefined,
    fileName: string
): RhythmData => {
    return {
        ...rhythm,
        sample,
        sampleFileName: fileName
    };
}

const updateRhythmNotesPerMeasure = (
    rhythm: RhythmData,
    notesPerMeasure: number,
): RhythmData => {
    return {
        ...rhythm,
        notesPerMeasure,
        measures: rhythm.measures.map((measure) => (
            resizeMeasureNotes(measure, rhythm.notesPerMeasure, notesPerMeasure)
        )),
    };
}

const updateRhythmNumberOfMeasures = (
    rhythm: RhythmData,
    numberOfMeasures: number,
): RhythmData => {
    return {
        ...rhythm,
        measures: Array.from({ length: numberOfMeasures }, (_, measureIndex) => (
            rhythm.measures[measureIndex] ?? createMeasure(measureIndex, rhythm.notesPerMeasure)
        )),
    };
}

export interface PatternProps {
    pattern: PatternData;
    playingMeasureIndex?: number;
    playingPosition64?: number;
    onPatternChange: (pattern: PatternData) => void;
    onPlayPattern: (pattern: PatternData) => void;
}

const Pattern = (props: PatternProps) => {
    const { audioContext, analyserNode } = useJamsterContext();
    const [zoomLevel, setZoomLevel] = useState(1);
    const [viewportWidthRem, setViewportWidthRem] = useState(getViewportWidthRem);

    useEffect(() => {
        const updateViewportWidthRem = () => {
            setViewportWidthRem(getViewportWidthRem());
        }

        updateViewportWidthRem();
        window.addEventListener("resize", updateViewportWidthRem);

        return () => {
            window.removeEventListener("resize", updateViewportWidthRem);
        }
    }, []);

    const measureWidthRem = (
        viewportWidthRem
        * defaultMeasuresScreenRatio
        / defaultMeasuresAtScreenWidth
        * zoomLevel
    );
    const maxNotesPerMeasure = Math.max(
        1,
        ...props.pattern.rhythms.map((rhythm) => rhythm.notesPerMeasure),
    );
    const densestNoteWidthRem = measureWidthRem / maxNotesPerMeasure;
    const noteValuePaddingLeftRem = Math.max(
        0,
        (densestNoteWidthRem - noteValueWidthRem) / 2,
    );

    const patternStyle = {
        "--measure-width": `${measureWidthRem}rem`,
        "--number-of-measures": props.pattern.numberOfMeasures,
        "--max-notes-per-measure": maxNotesPerMeasure,
        "--note-value-padding-left": `${noteValuePaddingLeftRem}rem`,
    } as CSSProperties;

    const updateZoomLevel = (value: number) => {
        if (!Number.isFinite(value)) return;
        setZoomLevel(Math.max(minimumZoomLevel, value));
    }

    const createMeasures = (notesPerMeasure: number): MeasureData[] => (
        Array.from({ length: props.pattern.numberOfMeasures }, (_, measureIndex) => (
            createMeasure(measureIndex, notesPerMeasure)
        ))
    )

    const createRhythm = (index: number): RhythmData => {
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(analyserNode);

        return {
            index,
            gainNode,
            notesPerMeasure: 4,
            measures: createMeasures(4),
            sampleFileName: ""
        };
    }

    const updatePatternRhythms = (rhythms: RhythmData[]) => {
        props.onPatternChange({
            ...props.pattern,
            rhythms,
        });
    }

    const addRhythm = () => updatePatternRhythms([
        ...props.pattern.rhythms,
        createRhythm(props.pattern.rhythms.length),
    ])

    const handleNoteChange = (
        rhythmIndex: number,
        measureIndex: number,
        noteIndex: number,
        value: string,
    ) => {
        updatePatternRhythms(props.pattern.rhythms.map((rhythm) => {
            if (rhythm.index !== rhythmIndex) return rhythm;
            return updateRhythmNoteValue(rhythm, measureIndex, noteIndex, value);
        }));
    }

    const handleSampleChange = (rhythmIndex: number, sample: AudioBuffer, fileName: string) => {
        updatePatternRhythms(props.pattern.rhythms.map((rhythm) => {
            if (rhythm.index !== rhythmIndex) return rhythm;
            return updateRhythmSample(rhythm, sample, fileName);
        }));
    }

    const handleNotesPerMeasureChange = (rhythmIndex: number, notesPerMeasure: number) => {
        updatePatternRhythms(props.pattern.rhythms.map((rhythm) => {
            if (rhythm.index !== rhythmIndex) return rhythm;
            return updateRhythmNotesPerMeasure(rhythm, notesPerMeasure);
        }));
    }

    const handleNumberOfMeasuresChange = (numberOfMeasures: number) => {
        props.onPatternChange({
            ...props.pattern,
            numberOfMeasures,
            rhythms: props.pattern.rhythms.map((rhythm) => (
                updateRhythmNumberOfMeasures(rhythm, numberOfMeasures)
            )),
        });
    }

    const handleDeleteRhythm = (rhythmIndex: number) => {
        props.onPatternChange({
            ...props.pattern,
            rhythms: props.pattern.rhythms.filter((rhythm) => rhythm.index !== rhythmIndex)
        })
    }

    const handlePatternNameChange = (name: string) => {
        props.onPatternChange({
            ...props.pattern,
            name,
        });
    }

    return (
        <div className="pattern" style={patternStyle}>
            <div className="controls">
                <div className="anchor">
                    <button className="btn delete">-</button>
                    <input
                        type="text"
                        className="pattern-name"
                        value={props.pattern.name}
                        onChange={(e) => handlePatternNameChange(e.target.value)}
                    />
                </div>
                <div className="options ">
                    <button className="btn" onClick={() => props.onPlayPattern(props.pattern)}>Play</button>
                    <div>
                        <label>Measures</label>
                        <input
                            type="number"
                            min={1}
                            value={props.pattern.numberOfMeasures}
                            onChange={(e) => {
                                const numberOfMeasures = Number(e.target.value);
                                if (!Number.isFinite(numberOfMeasures)) return;
                                handleNumberOfMeasuresChange(Math.max(1, numberOfMeasures));
                            }}
                        />
                    </div>
                    <div>
                        <label>Zoom</label>
                        <input
                            type="number"
                            min={minimumZoomLevel}
                            step={0.25}
                            value={zoomLevel}
                            onChange={(e) => {
                                updateZoomLevel(Number(e.target.value));
                            }}
                        />
                    </div>
                    <button className="btn">MCP</button>
                </div>
            </div>
            {props.pattern.rhythms.map((rhythm) => (
                <Rhythm
                    key={rhythm.index}
                    rhythm={rhythm}
                    playingMeasureIndex={props.playingMeasureIndex}
                    playingPosition64={props.playingPosition64}
                    onNoteChange={handleNoteChange}
                    onSampleChange={handleSampleChange}
                    onNotesPerMeasureChange={handleNotesPerMeasureChange}
                    onDelete={handleDeleteRhythm}
                />
            ))}
            <div className="add-rhythm">
                <button className="btn" onClick={addRhythm}>Add rhythm</button>
            </div>
        </div>
    )
}

export default Pattern;
