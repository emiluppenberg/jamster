import { useRef } from "react";
import RhythmSampleDialog from "./RhytmSampleDialog";
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
    onSampleChange: (rhythmIndex: number, sample: AudioBuffer, fileName: string) => void;
    onNotesPerMeasureChange: (rhythmIndex: number, notesPerMeasure: number) => void;
    onDelete: (rhytmIndex: number) => void;
    onNameChange: (rhythmIndex: number, newName: string) => void;
}

const Rhythm = (props: RhythmProps) => {
    const noteInputRefs = useRef<Array<HTMLInputElement | undefined>>([]);

    const focusAndSelectNote = (input: HTMLInputElement | undefined) => {
        if (input === undefined) {
            return;
        }

        input.focus();
        requestAnimationFrame(() => {
            input.focus();
            input.select();
        });
    }

    const focusNote = (
        measureIndex: number,
        noteIndex: number,
        target?: "next" | "previous") => {
        const currentInputIndex = measureIndex * props.rhythm.notesPerMeasure + noteIndex;

        const targetInputIndex = target === "next"
            ? currentInputIndex + 1
            : target === "previous"
                ? currentInputIndex - 1
                : currentInputIndex;
        
        const targetInput = noteInputRefs.current[targetInputIndex] ?? noteInputRefs.current[currentInputIndex];
        focusAndSelectNote(targetInput);
    }

    return (
        <div className="rhythm">
            <div className="anchor">
                <button className="btn delete delete-rhythm" onClick={() => props.onDelete(props.rhythm.index)}>-</button>
                <input
                    type="text"
                    className="rhythm-name"
                    value={props.rhythm.name}
                    onChange={(e) => props.onNameChange(props.rhythm.index, e.target.value)}
                />
            </div>
            <RhythmSampleDialog
                setSample={(sample, fileName) => props.onSampleChange(props.rhythm.index, sample, fileName)}
                sampleFileName={props.rhythm.sampleFilename}
                rhythm={props.rhythm}
            />
            <select
                className="notes-per-measure"
                value={props.rhythm.notesPerMeasure}
                onChange={(e) => {
                    props.onNotesPerMeasureChange(props.rhythm.index, Number(e.target.value));
                }}
            >
                {notesPerMeasureOptions.map((notesPerMeasure) => (
                    <option key={`${props.rhythm.name}-notes-per-measure-${notesPerMeasure}`} value={notesPerMeasure}>
                        /{notesPerMeasure}
                    </option>
                ))}
            </select>
            <div className="measures">
                {props.rhythm.measures.map((measure) => (
                    <div
                        key={`${props.rhythm.name}-measure-${measure.index}`}
                        className={`measure${measure.index === props.playingMeasureIndex ? " is-playing" : ""}`}
                    >
                        {measure.notes.map((note) => (
                            <input
                                key={`${props.rhythm.name}-measure-${measure.index}-note-${note.index}`}
                                ref={(input) => {
                                    noteInputRefs.current[measure.index * props.rhythm.notesPerMeasure + note.index] = input === null ? undefined : input;
                                }}
                                className={`note${measure.index === props.playingMeasureIndex && note.position64 === props.playingPosition64 ? " is-playing" : ""}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                pattern={"[0-9\\-]"}
                                value={note.value}
                                onFocus={(e) => e.currentTarget.select()}
                                onInput={(e) => {
                                    let value = e.currentTarget.value;
                                    const isEmpty = value.length === 0;
                                    const isNumber = /^[0-9]$/.test(value);
                                    const inputType = (e.nativeEvent as InputEvent).inputType;
                                    const isDeletion = inputType.startsWith("delete") || isEmpty;
                                    
                                    value = isNumber ? value : "-";
                                    
                                    props.onNoteChange(
                                        props.rhythm.index,
                                        measure.index,
                                        note.index,
                                        value,
                                    );
                                    
                                    if (isNumber) {
                                        focusNote(measure.index, note.index, "next");
                                    } else if (isDeletion) {
                                        focusNote(measure.index, note.index, "previous");
                                    } else {
                                        focusNote(measure.index, note.index)
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
