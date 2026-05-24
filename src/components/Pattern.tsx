import { useRef, type CSSProperties } from "react";
import SampleInput from "./SampleInput";
import type { PatternData } from "../types";

const notesPerMeasureOptions = [4, 8, 16, 32, 64];

export interface PatternProps {
    pattern: PatternData;
    playingMeasureIndex?: number;
    playingPosition64?: number;
    onNoteChange: (
        patternIndex: number,
        measureIndex: number,
        noteIndex: number,
        value: string,
    ) => void;
    onSampleChange: (patternIndex: number, sample: AudioBuffer) => void;
    onNotesPerMeasureChange: (patternIndex: number, notesPerMeasure: number) => void;
}

const Pattern = (props: PatternProps) => {
    const noteInputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const focusNextNote = (measureIndex: number, noteIndex: number) => {
        const currentInputIndex = measureIndex * props.pattern.notesPerMeasure + noteIndex;
        noteInputRefs.current[currentInputIndex + 1]?.focus();
    }

    const focusPreviousNote = (measureIndex: number, noteIndex: number) => {
        const currentInputIndex = measureIndex * props.pattern.notesPerMeasure + noteIndex;
        noteInputRefs.current[currentInputIndex - 1]?.focus();
    }

    return (
        <div className="pattern">
            <SampleInput
                setSample={(sample) => props.onSampleChange(props.pattern.index, sample)}
            />
            <select
                className="notes-per-measure-input"
                value={props.pattern.notesPerMeasure}
                onChange={(e) => {
                    props.onNotesPerMeasureChange(props.pattern.index, Number(e.target.value));
                }}
            >
                {notesPerMeasureOptions.map((notesPerMeasure) => (
                    <option key={notesPerMeasure} value={notesPerMeasure}>
                        {notesPerMeasure}
                    </option>
                ))}
            </select>
            <div className="measures">
                {props.pattern.measures.map((measure) => (
                    <div
                        key={measure.index}
                        className={`measure${measure.index === props.playingMeasureIndex ? " is-playing" : ""}`}
                    >
                        {measure.notes.map((note) => (
                            <input
                                key={note.index}
                                ref={(input) => {
                                    noteInputRefs.current[measure.index * props.pattern.notesPerMeasure + note.index] = input;
                                }}
                                className={`note${measure.index === props.playingMeasureIndex && note.position64 === props.playingPosition64 ? " is-playing" : ""}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                pattern="[0-9]"
                                placeholder="-"
                                value={note.value}
                                onChange={(e) => {
                                    const numberValue = e.target.value.replace(/\D/g, "");

                                    props.onNoteChange(
                                        props.pattern.index,
                                        measure.index,
                                        note.index,
                                        numberValue,
                                    );

                                    if (numberValue !== "") {
                                        focusNextNote(measure.index, note.index);
                                    } else if (note.value !== "") {
                                        focusPreviousNote(measure.index, note.index);
                                    }
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Pattern;
