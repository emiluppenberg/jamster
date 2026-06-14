import { useEffect, useRef } from "react";
import RhythmSampleDialog from "./RhythmSampleDialog";
import type { FocusRhythm, RhythmData } from "../types";

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
    onFocusNewRhythm: (target: "next" | "previous", rhythmIndex: number, inputIndex: number) => void;
    focusRhythm: FocusRhythm | undefined;
}

const Rhythm = (props: RhythmProps) => {
    const noteInputRefs = useRef<Array<HTMLInputElement | undefined>>([]);

    useEffect(() => {
        if (!props.focusRhythm) return;
        if (props.focusRhythm.rhythmIndex !== props.rhythm.index) return;

        const focusInput = noteInputRefs.current[props.focusRhythm.inputIndex] ?? noteInputRefs.current[0]
        focusAndSelectNote(focusInput);
    }, [props.focusRhythm])

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

    const focusNote = (measureIndex: number, noteIndex: number, target?: "next" | "previous") => {
        const currentInputIndex = measureIndex * props.rhythm.notesPerMeasure + noteIndex;

        let targetInput = noteInputRefs.current[currentInputIndex];

        if (target === "next") {
            targetInput = noteInputRefs.current[currentInputIndex + 1] ?? noteInputRefs.current[0]
        }
        if (target === "previous") {
            targetInput = noteInputRefs.current[currentInputIndex - 1] ?? noteInputRefs.current[noteInputRefs.current.length - 1]
        }

        focusAndSelectNote(targetInput);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, measureIndex: number, noteIndex: number) => {
        const currentInputIndex = measureIndex * props.rhythm.notesPerMeasure + noteIndex;

        if (e.key === "ArrowRight") {
            e.preventDefault();
            focusNote(measureIndex, noteIndex, "next");
            return;
        }

        if (e.key === "ArrowLeft") {
            e.preventDefault();
            focusNote(measureIndex, noteIndex, "previous");
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            props.onFocusNewRhythm("previous", props.rhythm.index, currentInputIndex)
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            props.onFocusNewRhythm("next", props.rhythm.index, currentInputIndex)
            return;
        }

        if (e.ctrlKey || e.metaKey || e.altKey) {
            return;
        }

        const isDeletion = e.key === "Backspace" || e.key === "Delete";
        const isTextInput = e.key.length === 1;

        if (!isDeletion && !isTextInput) {
            return;
        }

        e.preventDefault();

        const inputValue = isDeletion ? "" : e.key;
        const deleteKey = isDeletion && e.key === "Backspace"
            ? e.key
            : isDeletion && e.key === "Delete"
                ? e.key
                : undefined

        handleInput(inputValue, measureIndex, noteIndex, deleteKey);
    }

    const handleInput = (
        value: string,
        measureIndex: number,
        noteIndex: number,
        deleteKey?: "Backspace" | "Delete") => {
        const isNumber = /^[0-9]$/.test(value);

        value = isNumber ? value : "-";

        props.onNoteChange(
            props.rhythm.index,
            measureIndex,
            noteIndex,
            value,
        );

        if (isNumber || deleteKey === "Delete") {
            focusNote(measureIndex, noteIndex, "next");
        } else if (deleteKey === "Backspace") {
            focusNote(measureIndex, noteIndex, "previous");
        } else {
            focusNote(measureIndex, noteIndex)
        }
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
                                onKeyDown={(e) => handleKeyDown(e, measure.index, note.index)}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Rhythm;
