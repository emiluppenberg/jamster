import { useRef } from "react";
import SampleInput from "./SampleInput";
import type { RhythmData } from "../types";

const notesPerMeasureOptions = [4, 8, 16, 32, 64];

export interface RhythmProps {
    rhythm: RhythmData;
    playingMeasureIndex?: number;
    playingPosition64?: number;
    onNoteChange: (
        rhythmIndex: number,
        measureIndex: number,
        noteIndex: number,
        value: string,
    ) => void;
    onSampleChange: (rhythmIndex: number, sample: AudioBuffer) => void;
    onNotesPerMeasureChange: (rhythmIndex: number, notesPerMeasure: number) => void;
}

const Rhythm = (props: RhythmProps) => {
    const noteInputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const focusNextNote = (measureIndex: number, noteIndex: number) => {
        const currentInputIndex = measureIndex * props.rhythm.notesPerMeasure + noteIndex;
        noteInputRefs.current[currentInputIndex + 1]?.focus();
    }

    const focusPreviousNote = (measureIndex: number, noteIndex: number) => {
        const currentInputIndex = measureIndex * props.rhythm.notesPerMeasure + noteIndex;
        noteInputRefs.current[currentInputIndex - 1]?.focus();
    }

    return (
        <div className="rhythm">
            <SampleInput
                setSample={(sample) => props.onSampleChange(props.rhythm.index, sample)}
            />
            <select
                className="notes-per-measure-input"
                value={props.rhythm.notesPerMeasure}
                onChange={(e) => {
                    props.onNotesPerMeasureChange(props.rhythm.index, Number(e.target.value));
                }}
            >
                {notesPerMeasureOptions.map((notesPerMeasure) => (
                    <option key={notesPerMeasure} value={notesPerMeasure}>
                        {notesPerMeasure}
                    </option>
                ))}
            </select>
            <div className="measures">
                {props.rhythm.measures.map((measure) => (
                    <div
                        key={measure.index}
                        className={`measure${measure.index === props.playingMeasureIndex ? " is-playing" : ""}`}
                    >
                        {measure.notes.map((note) => (
                            <input
                                key={note.index}
                                ref={(input) => {
                                    noteInputRefs.current[measure.index * props.rhythm.notesPerMeasure + note.index] = input;
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
                                        props.rhythm.index,
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

export default Rhythm;
