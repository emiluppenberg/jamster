import Pattern from "./Pattern";
import { useJamsterContext } from "../Context";
import type { FigureData, MeasureData, NoteData, PatternData } from "../types";
import { useEffect, useState, type CSSProperties } from "react";

const positionsPerMeasure = 64;
const defaultMeasuresAtScreenWidth = 4;
const defaultMeasuresScreenRatio = 0.75;
const minimumZoomLevel = 0.25;
const zoomStep = 0.25;

const getViewportWidthRem = () => {
    if (typeof window === "undefined") return 75;

    const rootFontSize = Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
    );

    if (!Number.isFinite(rootFontSize) || rootFontSize <= 0) return 75;
    return window.innerWidth / rootFontSize;
}

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

export interface FigureProps {
    figure: FigureData;
    playingMeasureIndex?: number;
    playingPosition64?: number;
    onFigureChange: (figure: FigureData) => void;
    onPlayFigure: (figure: FigureData) => void;
}

const Figure = (props: FigureProps) => {
    const { audioContext } = useJamsterContext();
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
        ...props.figure.patterns.map((pattern) => pattern.notesPerMeasure),
    );

    const figureStyle = {
        "--measure-width": `${measureWidthRem}rem`,
        "--number-of-measures": props.figure.numberOfMeasures,
        "--max-notes-per-measure": maxNotesPerMeasure,
    } as CSSProperties;

    const updateZoomLevel = (value: number) => {
        if (!Number.isFinite(value)) return;
        setZoomLevel(Math.max(minimumZoomLevel, value));
    }

    const createMeasures = (notesPerMeasure: number): MeasureData[] => (
        Array.from({ length: props.figure.numberOfMeasures }, (_, measureIndex) => (
            createMeasure(measureIndex, notesPerMeasure)
        ))
    )

    const createPattern = (index: number): PatternData => {
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(audioContext.destination);

        return {
            index,
            gainNode,
            notesPerMeasure: 4,
            measures: createMeasures(4),
        };
    }

    const updateFigurePatterns = (patterns: PatternData[]) => {
        props.onFigureChange({
            ...props.figure,
            patterns,
        });
    }

    const addPattern = () => updateFigurePatterns([
        ...props.figure.patterns,
        createPattern(props.figure.patterns.length),
    ])

    const handleNoteChange = (
        patternIndex: number,
        measureIndex: number,
        noteIndex: number,
        value: string,
    ) => {
        updateFigurePatterns(props.figure.patterns.map((pattern) => {
            if (pattern.index !== patternIndex) return pattern;
            return updatePatternNoteValue(pattern, measureIndex, noteIndex, value);
        }));
    }

    const handleSampleChange = (patternIndex: number, sample: AudioBuffer) => {
        updateFigurePatterns(props.figure.patterns.map((pattern) => {
            if (pattern.index !== patternIndex) return pattern;
            return updatePatternSample(pattern, sample);
        }));
    }

    const handleNotesPerMeasureChange = (patternIndex: number, notesPerMeasure: number) => {
        updateFigurePatterns(props.figure.patterns.map((pattern) => {
            if (pattern.index !== patternIndex) return pattern;
            return updatePatternNotesPerMeasure(pattern, notesPerMeasure);
        }));
    }

    const handleNumberOfMeasuresChange = (numberOfMeasures: number) => {
        props.onFigureChange({
            ...props.figure,
            numberOfMeasures,
            patterns: props.figure.patterns.map((pattern) => (
                updatePatternNumberOfMeasures(pattern, numberOfMeasures)
            )),
        });
    }

    return (
        <div className="figure" style={figureStyle}>
            <div className="figure-options">
                <button className="btn-default" onClick={addPattern}>Add pattern</button>
                <input
                    className="measures-input"
                    type="number"
                    min={1}
                    value={props.figure.numberOfMeasures}
                    onChange={(e) => {
                        const numberOfMeasures = Number(e.target.value);
                        if (!Number.isFinite(numberOfMeasures)) return;
                        handleNumberOfMeasuresChange(Math.max(1, numberOfMeasures));
                    }}
                />
                <button className="btn-default" onClick={() => updateZoomLevel(zoomLevel - zoomStep)}>-</button>
                <input
                    className="zoom-input"
                    type="number"
                    min={minimumZoomLevel}
                    step={zoomStep}
                    value={zoomLevel}
                    onChange={(e) => {
                        updateZoomLevel(Number(e.target.value));
                    }}
                />
                <button className="btn-default" onClick={() => updateZoomLevel(zoomLevel + zoomStep)}>+</button>
            </div>
            {props.figure.patterns.map((pattern) => (
                <Pattern
                    key={pattern.index}
                    pattern={pattern}
                    playingMeasureIndex={props.playingMeasureIndex}
                    playingPosition64={props.playingPosition64}
                    onNoteChange={handleNoteChange}
                    onSampleChange={handleSampleChange}
                    onNotesPerMeasureChange={handleNotesPerMeasureChange}
                />
            ))}
        </div>
    )
}

export default Figure;
