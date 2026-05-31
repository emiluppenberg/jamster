import { useState } from "react";
import type { PatternData, TimelineData, Slot } from "../types";

export interface TimelinesProps {
    patterns: PatternData[];
    timelines: TimelineData[];
    onTimelinesChange: (timelines: TimelineData[]) => void;
}

const getSlotCount = (timelines: TimelineData[]) => (
    Math.max(1, ...timelines.map((timeline) => timeline.slots.length))
)

const createSlots = (slotCount: number): Slot[] => (
    Array.from({ length: slotCount }, () => undefined)
)

const resizeSlots = (
    slots: Slot[],
    slotCount: number,
): Slot[] => (
    Array.from({ length: slotCount }, (_, slotIndex) => slots[slotIndex])
)

const Timelines = (props: TimelinesProps) => {
    const [slotCount, setSlotCount] = useState(() => getSlotCount(props.timelines));

    const addTimeline = () => {
        props.onTimelinesChange([
            ...props.timelines,
            {
                index: props.timelines.length,
                slots: createSlots(slotCount),
            },
        ]);
    }

    const handleSlotCountChange = (value: number) => {
        if (!Number.isFinite(value)) return;

        const nextSlotCount = Math.max(0, Math.floor(value));
        setSlotCount(nextSlotCount);
        props.onTimelinesChange(props.timelines.map((timeline) => ({
            ...timeline,
            slots: resizeSlots(timeline.slots, nextSlotCount),
        })));
    }

    const handleSlotChange = (
        timelineDataIndex: number,
        slotIndex: number,
        value: string,
    ) => {
        const patternIndex = value === "" ? undefined : Number(value);

        props.onTimelinesChange(props.timelines.map((timeline) => {
            if (timeline.index !== timelineDataIndex) return timeline;

            const slots = resizeSlots(timeline.slots, slotCount);
            slots[slotIndex] = patternIndex;

            return {
                ...timeline,
                slots,
            };
        }));
    }

    return (
        <>
            <div className="controls">
                <h1>Timelines</h1>
                <div className="options">
                    <button className="btn-default" onClick={addTimeline}>Add</button>
                    <div>
                        <label>Length</label>
                        <input
                            type="number"
                            min={1}
                            step={1}
                            value={slotCount}
                            onChange={(e) => handleSlotCountChange(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>
            <div className="container timelines">
                {props.timelines.map((timeline) => (
                    <div key={timeline.index} className="timeline">
                        {Array.from({ length: slotCount }, (_, slotIndex) => (
                            <select
                                key={slotIndex}
                                className="slot-pattern-select"
                                value={timeline.slots[slotIndex] ?? ""}
                                onChange={(e) => handleSlotChange(timeline.index, slotIndex, e.target.value)}
                            >
                                <option value="">-</option>
                                {props.patterns.map((pattern) => (
                                    <option key={pattern.index} value={pattern.index}>
                                        Pattern {pattern.index}
                                    </option>
                                ))}
                            </select>
                        ))}
                    </div>
                ))}
            </div>
        </>
    )
}

export default Timelines;
