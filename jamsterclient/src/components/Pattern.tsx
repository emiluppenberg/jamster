import Rhythm from "./Rhythm";
import { useJamsterContext } from "../Context";
import type { FocusRhythm, PatternData, RhythmData } from "../types";
import { useEffect, useState, type CSSProperties } from "react";
import { createMeasure, createRhythm, getViewportWidthRem, resizeMeasureNotes } from "../utils";

const defaultMeasuresAtScreenWidth = 4;
const defaultMeasuresScreenRatio = 0.75;
const minimumZoomLevel = 0.25;
const noteValueWidthRem = 0.6;

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
        sampleFilename: fileName
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
    isPlaying: boolean;
    playingMeasureIndex?: number;
    playingPosition64?: number;
    onPatternChange: (pattern: PatternData) => void;
    onPatternDelete: (pattern: PatternData) => void;
    onPlayPattern: (pattern: PatternData) => void;
    onStopPlayback: () => void;
}

const Pattern = (props: PatternProps) => {
    const { audioContext, analyserNode } = useJamsterContext();
    const [zoomLevel, setZoomLevel] = useState(1);
    const [viewportWidthRem, setViewportWidthRem] = useState(getViewportWidthRem);
    const [focusRhythm, setFocusRhythm] = useState<FocusRhythm>()

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

    const updatePatternRhythms = (rhythms: RhythmData[]) => {
        props.onPatternChange({
            ...props.pattern,
            rhythms,
        });
    }

    const addRhythm = () => {
        const nextIndex = Math.max(0, ...props.pattern.rhythms.map(rhythm => rhythm.index)) + 1

        updatePatternRhythms([
            ...props.pattern.rhythms,
            createRhythm(nextIndex, props.pattern.numberOfMeasures, audioContext, analyserNode),
        ])
    }

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

    const handlePatternNameChange = (newName: string) => {
        props.onPatternChange({
            ...props.pattern,
            name: newName,
        });
    }

    const handleRhythmNameChange = (rhythmIndex: number, newName: string) => {
        props.onPatternChange({
            ...props.pattern,
            rhythms: props.pattern.rhythms.map((rhythm) => {
                if (rhythm.index !== rhythmIndex) return rhythm;
                return {
                    ...rhythm,
                    name: newName
                }
            })
        })
    }

    const handleTogglePlay = () => {
        if (props.isPlaying) {
            props.onStopPlayback()
            return;
        }
        if (!props.isPlaying) {
            props.onPlayPattern(props.pattern)
            return;
        }
    }

    const handleFocusNewRhythm = (target: "next" | "previous", rhythmIndex: number, inputIndex: number) => {
        const currentRhythmIndex = props.pattern.rhythms.findIndex(rhythm => rhythm.index === rhythmIndex);

        let targetRhythm = props.pattern.rhythms[currentRhythmIndex];

        if (target === "next") {
            targetRhythm = props.pattern.rhythms[currentRhythmIndex + 1] ?? props.pattern.rhythms[0];
        }
        if (target === "previous") {
            targetRhythm = props.pattern.rhythms[currentRhythmIndex - 1] ?? props.pattern.rhythms[props.pattern.rhythms.length - 1]
        }

        setFocusRhythm({ rhythmIndex: targetRhythm.index, inputIndex: inputIndex });
    }


    return (
        <div className="pattern" style={patternStyle}>
            <div className="controls">
                <div className="anchor">
                    <button className="btn delete" onClick={() => props.onPatternDelete(props.pattern)}>-</button>
                    <input
                        type="text"
                        className="pattern-name"
                        value={props.pattern.name}
                        onChange={(e) => handlePatternNameChange(e.target.value)}
                    />
                </div>
                <div className="options ">
                    <button className={`btn ${props.isPlaying ? "stop" : "play"}`} onClick={handleTogglePlay}>{props.isPlaying ? "Stop" : "Play"}</button>
                    <div className="flex-row-align-center">
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
                    <div className="flex-row-align-center">
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
                </div>
            </div>
            {props.pattern.rhythms.map((rhythm) => (
                <Rhythm
                    key={`${props.pattern.name}-rhythm-${rhythm.index}`}
                    rhythm={rhythm}
                    playingMeasureIndex={props.playingMeasureIndex}
                    playingPosition64={props.playingPosition64}
                    onNoteChange={handleNoteChange}
                    onSampleChange={handleSampleChange}
                    onNotesPerMeasureChange={handleNotesPerMeasureChange}
                    onDelete={handleDeleteRhythm}
                    onNameChange={handleRhythmNameChange}
                    onFocusNewRhythm={handleFocusNewRhythm}
                    focusRhythm={focusRhythm}
                />
            ))}
            <div className="add">
                <button className="btn" onClick={addRhythm}>Add rhythm</button>
            </div>
        </div>
    )
}

export default Pattern;