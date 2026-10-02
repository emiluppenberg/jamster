import { useState, type SetStateAction } from "react";
import type { PatternData, TimelineRowData } from "../types";
import { useJamsterContext } from "../Context";
import { createSlots, resizeSlots } from "../utils";

export interface TimelineProps {
    isPlaying: boolean;
    bpm: number;
    setBpm: React.Dispatch<SetStateAction<number>>;
    patterns: PatternData[];
    timelineRows: TimelineRowData[];
    timelineLength: number;
    onTimelineRowsChange: React.Dispatch<SetStateAction<TimelineRowData[]>>;
    playingSlotIndex: number | undefined;
    onPlayTimeline: () => void;
    onStopPlayback: () => void;
}

const TimelineRows = (props: TimelineProps) => {
    const { beatName, setBeatName } = useJamsterContext();

    const [show, setShow] = useState(true);

    const addTimelineRow = () => {
        props.onTimelineRowsChange([
            ...props.timelineRows,
            {
                slots: createSlots(props.timelineLength),
            },
        ]);
    }

    const handleTimelineLengthChange = (value: number) => {
        if (!Number.isFinite(value)) return;

        const nextTimelineLength = Math.max(1, Math.floor(value));
        props.onTimelineRowsChange(props.timelineRows.map((timeline) => ({
            ...timeline,
            slots: resizeSlots(timeline.slots, nextTimelineLength),
        })));
    }

    const handleSlotChange = (
        timelineRowIndex: number,
        slotIndex: number,
        value: string,
    ) => {
        const patternId = value === "" ? undefined : value;

        props.onTimelineRowsChange(props.timelineRows.map((timelineRow, currentRowIndex) => {
            if (currentRowIndex !== timelineRowIndex) return timelineRow;

            const slots = resizeSlots(timelineRow.slots, props.timelineLength);
            slots[slotIndex] = patternId;

            return {
                ...timelineRow,
                slots,
            };
        }));
    }

    const handleDeleteTimelineRow = (deleteRowIndex: number) => {
        props.onTimelineRowsChange(props.timelineRows.filter((_, rowIndex) => rowIndex !== deleteRowIndex))
    }

    const handleTogglePlay = () => {
        if (props.isPlaying) {
            props.onStopPlayback()
            return;
        }
        if (!props.isPlaying) {
            props.onPlayTimeline()
            return;
        }
    }

    return (
        <>
            <div className="timeline">
                <div className="controls">
                    <input
                        type="text"
                        className="beat-name"
                        value={beatName}
                        onChange={(e) => setBeatName(e.target.value)}
                    />
                    <div className="options">
                        <div className="flex-row-align-center">
                            <button className={`btn ${props.isPlaying ? "stop" : "play"}`} onClick={handleTogglePlay}>{props.isPlaying ? "Stop" : "Play"}</button>
                            <div className="flex-row-align-center">
                                <label>Measures</label>
                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={props.timelineLength}
                                    onChange={(e) => handleTimelineLengthChange(Number(e.target.value))}
                                />
                            </div>
                            <div className="flex-row-align-center">
                                <label>BPM</label>
                                <input
                                    className="bpm-input"
                                    type="number"
                                    min={1}
                                    value={props.bpm}
                                    onChange={(e) => {
                                        const nextBpm = Number(e.target.value);
                                        if (!Number.isFinite(nextBpm)) return;
                                        props.setBpm(Math.max(1, nextBpm));
                                    }}
                                />
                            </div>
                        </div>
                        <button className="btn show-hide" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
                    </div>
                </div>
                {props.timelineRows.length > 0 && show && props.timelineRows.map((timeline, timelineRowIndex) => (
                    <div key={`timeline-${timelineRowIndex}`} className="timeline-row">
                        <button className="btn delete" onClick={() => handleDeleteTimelineRow(timelineRowIndex)}>-</button>
                        {Array.from({ length: props.timelineLength }, (_, slotIndex) => (
                            <select
                                key={`timeline-${timelineRowIndex}-slot-${slotIndex}`}
                                className={`slot-pattern${slotIndex === props.playingSlotIndex ? " is-playing" : ""}`}
                                value={timeline.slots[slotIndex] ?? ""}
                                onChange={(e) => handleSlotChange(timelineRowIndex, slotIndex, e.target.value)}
                            >
                                <option value="">-</option>
                                {props.patterns.map((pattern) => (
                                    <option key={`${timelineRowIndex}-${pattern.id}`} value={pattern.id}>{pattern.name}</option>
                                ))}
                            </select>
                        ))}
                    </div>
                ))}
                {show && (
                    <div className="add">
                        <button className="btn" onClick={addTimelineRow}>Add track</button>
                    </div>
                )}
            </div>
        </>
    )
}

export default TimelineRows;
