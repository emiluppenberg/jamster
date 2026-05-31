import { useEffect, useRef, useState, type ReactNode } from "react";
import { useJamsterContext } from "../Context";
import type { PatternData, TimelineData } from "../types";

const defaultBpm = 120;
const beatsPerMeasure = 4;
const positionsPerMeasure = 64;
const schedulerIntervalMs = 25;
const scheduleAheadSeconds = 0.1;
const startDelaySeconds = 0.05;

const getPositionDurationSeconds = (bpm: number) => (
    60 / bpm / (positionsPerMeasure / beatsPerMeasure)
)

const getMeasureIndex = (cursorTick: number, pattern: PatternData) => {
    if (pattern.numberOfMeasures <= 0) return undefined;
    return Math.floor(cursorTick / positionsPerMeasure) % pattern.numberOfMeasures;
}

const getNoteGain = (value: string) => {
    const gain = Number(value) / 9;
    if (!Number.isFinite(gain)) return 0;
    return Math.max(0, Math.min(1, gain));
}

type PlaybackMode = "timelines" | "pattern";

const getSlotCount = (timelines: TimelineData[]) => (
    Math.max(0, ...timelines.map((timeline) => timeline.slots.length))
)

const getPatternByIndex = (patterns: PatternData[], patternIndex: number | undefined) => {
    if (patternIndex === undefined) return undefined;
    return patterns.find((pattern) => pattern.index === patternIndex);
}

const getPlaybackTimelines = (
    mode: PlaybackMode | undefined,
    timelines: TimelineData[],
    patternIndex: number | undefined,
): TimelineData[] => {
    if (mode === "pattern" && patternIndex !== undefined) {
        return [{ index: 0, slots: [patternIndex] }];
    }

    if (mode === "timelines") {
        return timelines;
    }

    return [];
}

export type PlaybackRenderProps = {
    isPlaying: boolean;
    playingPosition64?: number;
    getPlayingMeasureIndex: (pattern: PatternData) => number | undefined;
    playPattern: (pattern: PatternData) => void;
}

export interface PlaybackProps {
    patterns: PatternData[];
    timelines: TimelineData[];
    children: (props: PlaybackRenderProps) => ReactNode;
}

const Playback = (props: PlaybackProps) => {
    const { audioContext } = useJamsterContext();
    const [bpm, setBpm] = useState(defaultBpm);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackMode, setPlaybackMode] = useState<PlaybackMode | undefined>(undefined);
    const [soloPatternIndex, setSoloPatternIndex] = useState<number | undefined>(undefined);
    const [cursorTick, setCursorTick] = useState(0);
    const patternsRef = useRef(props.patterns);
    const timelinesRef = useRef(props.timelines);
    const playbackModeRef = useRef<PlaybackMode | undefined>(undefined);
    const soloPatternIndexRef = useRef<number | undefined>(undefined);
    const bpmRef = useRef(bpm);
    const schedulerTimerRef = useRef<number | undefined>(undefined);
    const nextCursorTickRef = useRef(0);
    const nextTickTimeRef = useRef(0);

    useEffect(() => {
        patternsRef.current = props.patterns;
    }, [props.patterns]);

    useEffect(() => {
        timelinesRef.current = props.timelines;
    }, [props.timelines]);

    useEffect(() => {
        bpmRef.current = bpm;
    }, [bpm]);

    useEffect(() => {
        return () => {
            if (schedulerTimerRef.current !== undefined) {
                window.clearInterval(schedulerTimerRef.current);
            }
        }
    }, []);

    const playSample = (sample: AudioBuffer, time: number, destination: AudioNode) => {
        const source = audioContext.createBufferSource();

        source.buffer = sample;
        source.connect(destination);
        source.start(time);
    }

    const schedulePattern = (pattern: PatternData, cursorTick: number, time: number) => {
        const position64 = cursorTick % positionsPerMeasure;
        const measureIndex = getMeasureIndex(cursorTick, pattern);
        if (measureIndex === undefined) return;

        pattern.rhythms.forEach((rhythm) => {
            const measure = rhythm.measures[measureIndex];
            const sample = rhythm.sample;
            if (!measure || !sample) return;

            const note = measure.notes.find((note) => note.position64 === position64);
            if (!note) return;

            const gain = getNoteGain(note.value);
            rhythm.gainNode.gain.setValueAtTime(gain, time);

            if (gain <= 0) return;
            playSample(sample, time, rhythm.gainNode);
        });
    }

    const scheduleTick = (cursorTick: number, time: number) => {
        const timelines = getPlaybackTimelines(
            playbackModeRef.current,
            timelinesRef.current,
            soloPatternIndexRef.current,
        );
        const slotCount = getSlotCount(timelines);
        if (slotCount <= 0) return;

        const slotIndex = Math.floor(cursorTick / positionsPerMeasure) % slotCount;

        timelines.forEach((timeline) => {
            const pattern = getPatternByIndex(patternsRef.current, timeline.slots[slotIndex]);
            if (!pattern) return;
            schedulePattern(pattern, cursorTick, time);
        });
    }

    const runScheduler = () => {
        while (nextTickTimeRef.current < audioContext.currentTime + scheduleAheadSeconds) {
            scheduleTick(nextCursorTickRef.current, nextTickTimeRef.current);
            nextCursorTickRef.current += 1;
            nextTickTimeRef.current += getPositionDurationSeconds(bpmRef.current);
        }

        setCursorTick(nextCursorTickRef.current);
    }

    const startPlayback = async (mode: PlaybackMode, patternIndex?: number) => {
        const timelines = getPlaybackTimelines(mode, props.timelines, patternIndex);
        if (getSlotCount(timelines) <= 0) return;

        if (schedulerTimerRef.current !== undefined) {
            window.clearInterval(schedulerTimerRef.current);
            schedulerTimerRef.current = undefined;
        }

        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        playbackModeRef.current = mode;
        soloPatternIndexRef.current = patternIndex;
        nextCursorTickRef.current = 0;
        nextTickTimeRef.current = audioContext.currentTime + startDelaySeconds;
        setPlaybackMode(mode);
        setSoloPatternIndex(patternIndex);
        setCursorTick(0);
        setIsPlaying(true);
        runScheduler();
        schedulerTimerRef.current = window.setInterval(runScheduler, schedulerIntervalMs);
    }

    const stopPlayback = () => {
        if (schedulerTimerRef.current !== undefined) {
            window.clearInterval(schedulerTimerRef.current);
            schedulerTimerRef.current = undefined;
        }

        nextCursorTickRef.current = 0;
        nextTickTimeRef.current = 0;
        playbackModeRef.current = undefined;
        soloPatternIndexRef.current = undefined;
        setPlaybackMode(undefined);
        setSoloPatternIndex(undefined);
        setCursorTick(0);
        setIsPlaying(false);
    }

    const playingPosition64 = isPlaying ? cursorTick % positionsPerMeasure : undefined;

    const getPlayingMeasureIndex = (pattern: PatternData) => {
        if (!isPlaying) return undefined;

        const timelines = getPlaybackTimelines(playbackMode, props.timelines, soloPatternIndex);
        const slotCount = getSlotCount(timelines);
        if (slotCount <= 0) return undefined;

        const slotIndex = Math.floor(cursorTick / positionsPerMeasure) % slotCount;
        const isPatternPlaying = timelines.some((timeline) => (
            timeline.slots[slotIndex] === pattern.index
        ));

        if (!isPatternPlaying) return undefined;
        return getMeasureIndex(cursorTick, pattern);
    }

    return (
        <div className="playback">
            <div className="playback-controls">
                <button
                    className="btn-default"
                    onClick={() => {
                        if (isPlaying) {
                            stopPlayback();
                            return;
                        }

                        void startPlayback("timelines");
                    }}
                >
                    {isPlaying ? "Stop" : "Play"}
                </button>
                <input
                    className="bpm-input"
                    type="number"
                    min={1}
                    value={bpm}
                    onChange={(e) => {
                        const nextBpm = Number(e.target.value);
                        if (!Number.isFinite(nextBpm)) return;
                        setBpm(Math.max(1, nextBpm));
                    }}
                />
            </div>
            {props.children({
                isPlaying,
                playingPosition64,
                getPlayingMeasureIndex,
                playPattern: (pattern) => {
                    void startPlayback("pattern", pattern.index);
                },
            })}
        </div>
    )
}

export default Playback;
