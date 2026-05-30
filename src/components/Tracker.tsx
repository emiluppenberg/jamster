import { useState } from "react";
import type { FigureData, Track, Timeline } from "../types";

export interface TrackerProps {
    figures: FigureData[];
    tracks: Track[];
    onTracksChange: (tracks: Track[]) => void;
}

const getTimelineLength = (tracks: Track[]) => (
    Math.max(0, ...tracks.map((track) => track.timeline.length))
)

const createTimeline = (timelineLength: number): Timeline => (
    Array.from({ length: timelineLength }, () => undefined)
)

const resizeTimeline = (
    timeline: Timeline,
    timelineLength: number,
): Timeline => (
    Array.from({ length: timelineLength }, (_, timelineIndex) => timeline[timelineIndex])
)

const Tracker = (props: TrackerProps) => {
    const [timelineLength, setTimelineLength] = useState(() => getTimelineLength(props.tracks));

    const addTrack = () => {
        props.onTracksChange([
            ...props.tracks,
            {
                index: props.tracks.length,
                timeline: createTimeline(timelineLength),
            },
        ]);
    }

    const handleTimelineLengthChange = (value: number) => {
        if (!Number.isFinite(value)) return;

        const nextTimelineLength = Math.max(0, Math.floor(value));
        setTimelineLength(nextTimelineLength);
        props.onTracksChange(props.tracks.map((track) => ({
            ...track,
            timeline: resizeTimeline(track.timeline, nextTimelineLength),
        })));
    }

    const handleTimelineChange = (
        trackIndex: number,
        timelineIndex: number,
        value: string,
    ) => {
        const figureIndex = value === "" ? undefined : Number(value);

        props.onTracksChange(props.tracks.map((track) => {
            if (track.index !== trackIndex) return track;

            const timeline = resizeTimeline(track.timeline, timelineLength);
            timeline[timelineIndex] = figureIndex;

            return {
                ...track,
                timeline,
            };
        }));
    }

    return (
        <div className="tracker">
            <div className="tracker-controls">
                <button className="btn-default" onClick={addTrack}>Add track</button>
                <input
                    className="timeline-input"
                    type="number"
                    min={0}
                    step={1}
                    value={timelineLength}
                    onChange={(e) => handleTimelineLengthChange(Number(e.target.value))}
                />
            </div>
            {props.tracks.map((track) => (
                <div key={track.index} className="track">
                    {Array.from({ length: timelineLength }, (_, timelineIndex) => (
                        <select
                            key={timelineIndex}
                            className="timeline-figure-select"
                            value={track.timeline[timelineIndex] ?? ""}
                            onChange={(e) => handleTimelineChange(track.index, timelineIndex, e.target.value)}
                        >
                            <option value="">-</option>
                            {props.figures.map((figure) => (
                                <option key={figure.index} value={figure.index}>
                                    Figure {figure.index}
                                </option>
                            ))}
                        </select>
                    ))}
                </div>
            ))}
        </div>
    )
}

export default Tracker;
