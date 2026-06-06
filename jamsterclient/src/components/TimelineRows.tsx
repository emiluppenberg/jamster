import { type SetStateAction } from "react";
import type { PatternData, TimelineRowData, PatternIndex } from "../types";

export interface TimelineProps {
    patterns: PatternData[];
    timelineRows: TimelineRowData[];
    timelineLength: number;
    setTimelineLength: React.Dispatch<SetStateAction<number>>;
    onTimelineRowsChange: (timelines: TimelineRowData[]) => void;
    playingSlotIndex: number | undefined;
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

    const addTimelineRow = () => {
        props.onTimelineRowsChange([
            ...props.timelineRows,
            {
                index: props.timelineRows.length,
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
        timelineDataIndex: number,
        slotIndex: number,
        value: string,
    ) => {
        const patternIndex = value === "" ? undefined : Number(value);

        props.onTimelineRowsChange(props.timelineRows.map((timeline) => {
            if (timeline.index !== timelineDataIndex) return timeline;

            const slots = resizeSlots(timeline.slots, props.timelineLength);
            slots[slotIndex] = patternIndex;

            return {
                ...timeline,
                slots,
            };
        }));
    }

    const handleDeleteTimelineRow = (deleteTimeline: TimelineRowData) => {
        props.onTimelineRowsChange(props.timelineRows.filter(timeline => timeline !== deleteTimeline))
    }

    return (
        <>
            <div className="controls">
                <h1>Timeline</h1>
                <div className="options">
                    <button className="btn" onClick={addTimelineRow}>Add</button>
                    <div className="flex-row-align-center">
                        <label>Length</label>
                        <input
                            type="number"
                            min={1}
                            step={1}
                            value={props.timelineLength}
                            onChange={(e) => handleTimelineLengthChange(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>
            {props.timelineRows.length > 0 && (
                <div className="container timelines">
                {props.timelineRows.map((timeline) => (
                    <div key={timeline.index} className="timeline">
                        <button className="btn delete" onClick={() => handleDeleteTimelineRow(timeline)}>-</button>
                        {Array.from({ length: props.timelineLength }, (_, slotIndex) => (
                            <select
                            key={slotIndex}
                            className={`slot-pattern${slotIndex === props.playingSlotIndex ? " is-playing" : ""}`}
                            value={timeline.slots[slotIndex] ?? ""}
                            onChange={(e) => handleSlotChange(timeline.index, slotIndex, e.target.value)}
                            >
                                <option value="">-</option>
                                {props.patterns.map((pattern) => (
                                    <option key={pattern.index} value={pattern.index}>{pattern.name}</option>
                                ))}
                            </select>
                        ))}
                    </div>
                ))}
            </div>
            )}
        </>
    )
}

export default TimelineRows;
