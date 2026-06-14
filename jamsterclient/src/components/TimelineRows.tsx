import { type SetStateAction } from "react";
import type { PatternData, TimelineRowData, PatternIndex } from "../types";
import { useJamsterContext } from "../Context";

export interface TimelineProps {
    isPlaying: boolean;
    bpm: number;
    setBpm: React.Dispatch<SetStateAction<number>>;
    patterns: PatternData[];
    timelineRows: TimelineRowData[];
    timelineLength: number;
    setTimelineLength: React.Dispatch<SetStateAction<number>>;
    onTimelineRowsChange: (timelines: TimelineRowData[]) => void;
    playingSlotIndex: number | undefined;
    onPlayTimeline: () => void;
    onStopPlayback: () => void;
}

const createSlots = (timelineLength: number): PatternIndex[] => (
    Array.from({ length: timelineLength }, () => undefined)
)

const resizeSlots = (
    slots: PatternIndex[],
    timelineLength: number,
): PatternIndex[] => (
    Array.from({ length: timelineLength }, (_, slotIndex) => slots[slotIndex])
)

const TimelineRows = (props: TimelineProps) => {
    const { beatName, setBeatName } = useJamsterContext();

    const addTimelineRow = () => {
        const nextIndex = Math.max(0, ...props.timelineRows.map(row => row.index)) + 1;

        props.onTimelineRowsChange([
            ...props.timelineRows,
            {
                index: nextIndex,
                slots: createSlots(props.timelineLength),
            },
        ]);
    }

    const handleTimelineLengthChange = (value: number) => {
        if (!Number.isFinite(value)) return;

        const nextTimelineLength = Math.max(0, Math.floor(value));
        props.setTimelineLength(nextTimelineLength);
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
        const patternIndex = value === "" ? undefined : Number(value);

        props.onTimelineRowsChange(props.timelineRows.map((timelineRow) => {
            if (timelineRow.index !== timelineRowIndex) return timelineRow;

            const slots = resizeSlots(timelineRow.slots, props.timelineLength);
            slots[slotIndex] = patternIndex;

            return {
                ...timelineRow,
                slots,
            };
        }));
    }

    const handleDeleteTimelineRow = (deleteTimeline: TimelineRowData) => {
        if (props.timelineRows.length === 1) return;
        props.onTimelineRowsChange(props.timelineRows.filter(timeline => timeline !== deleteTimeline))
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
            {props.timelineRows.length > 0 && (
                <div className="container timelines">
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
                        </div>
                    </div>
                    {props.timelineRows.map((timeline) => (
                        <div key={`timeline-${timeline.index}`} className="timeline">
                            <button className="btn delete" onClick={() => handleDeleteTimelineRow(timeline)}>-</button>
                            {Array.from({ length: props.timelineLength }, (_, slotIndex) => (
                                <select
                                    key={`timeline-${timeline.index}-slot-${slotIndex}`}
                                    className={`slot-pattern${slotIndex === props.playingSlotIndex ? " is-playing" : ""}`}
                                    value={timeline.slots[slotIndex] ?? ""}
                                    onChange={(e) => handleSlotChange(timeline.index, slotIndex, e.target.value)}
                                >
                                    <option value="">-</option>
                                    {props.patterns.map((pattern) => (
                                        <option key={`timeline-${timeline.index}-option-${pattern.index}`} value={pattern.index}>{pattern.name}</option>
                                    ))}
                                </select>
                            ))}
                        </div>
                    ))}
                    <div className="add">
                        <button className="btn" onClick={addTimelineRow}>Add track</button>
                    </div>
                </div>
            )}
        </>
    )
}

export default TimelineRows;
