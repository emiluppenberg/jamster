import { useEffect, useRef, useState, type ReactNode, type SetStateAction } from "react";
import { useJamsterContext } from "../Context";
import type { PatternData, RhythmData, TimelineRowData } from "../types";
import Equalizer from "./Equalizer";
import McpSocket from "./McpSocket";
import LoadPresetDialog from "./menu/LoadPresetDialog";
import SavePresetDialog from "./menu/SavePresetDialog";
import ManageSamplesDialog from "./menu/ManageSamplesDialog";

const defaultBpm = 120;
const beatsPerMeasure = 4;
const positionsPerMeasure = 64;
const schedulerIntervalMs = 25;
const scheduleAheadSeconds = 0.1;
const startDelaySeconds = 0.05;

const getPositionDurationSeconds = (bpm: number) => (
    60 / bpm / (positionsPerMeasure / beatsPerMeasure)
)

const getMeasureIndex = (cursorTick: number, pattern: PatternData, slotCount: number) => {
    if (pattern.numberOfMeasures <= 0) return undefined;
    return Math.floor(cursorTick / positionsPerMeasure) % Math.min(pattern.numberOfMeasures, slotCount);
}

const getNoteGain = (value: string) => {
    const gain = Number(value) / 9;
    if (!Number.isFinite(gain)) return 0;
    return Math.max(0, Math.min(1, gain));
}

type PlaybackMode = "timelines" | "pattern";

const getSlotCount = (timelines: TimelineRowData[]) => (
    Math.max(0, ...timelines.map((timeline) => timeline.slots.length))
)

const getPatternByIndex = (patterns: PatternData[], patternIndex: number | undefined) => {
    if (patternIndex === undefined) return undefined;
    return patterns.find((pattern) => pattern.index === patternIndex);
}

const getPlaybackTimelines = (
    mode: PlaybackMode | undefined,
    timelines: TimelineRowData[],
    patternIndex: number | undefined,
    patterns: PatternData[],
): TimelineRowData[] => {
    if (mode === "pattern" && patternIndex !== undefined) {
        const slotsLength = patterns[patternIndex].numberOfMeasures
        return [{ index: 0, slots: Array.from({ length: slotsLength }, () => patternIndex) }];
    }

    if (mode === "timelines") {
        return timelines;
    }

    return [];
}

const getPlaybackState = (
    mode: PlaybackMode | undefined,
    timelines: TimelineRowData[],
    patternIndex: number | undefined,
    patterns: PatternData[]
) => {
    const playbackTimelines = getPlaybackTimelines(mode, timelines, patternIndex, patterns);
    const playbackSlotCount = getSlotCount(playbackTimelines);

    return {
        timelines: playbackTimelines,
        slotCount: playbackSlotCount,
    };
}

export type PlaybackRenderProps = {
    isPlaying: boolean;
    bpm: number;
    setBpm: React.Dispatch<SetStateAction<number>>;
    playingPosition64?: number;
    playingSlotIndex?: number;
    getPlayingMeasureIndex: (pattern: PatternData) => number | undefined;
    playPattern: (pattern: PatternData) => void;
    playTimeline: () => void;
    stopPlayback: () => void;
}

export interface PlaybackProps {
    patterns: PatternData[];
    timelineRows: TimelineRowData[];
    children: (props: PlaybackRenderProps) => ReactNode;
    onStoreLoaded: (patterns: PatternData[], timelines: TimelineRowData[]) => void;
    onPatternChange: (pattern: PatternData) => void;
    onPatternAdded: (pattern: PatternData) => void;
    onTimelineRowsChange: React.Dispatch<SetStateAction<TimelineRowData[]>>;
}

const Playback = (props: PlaybackProps) => {
    const { audioContext } = useJamsterContext();
    const [bpm, setBpm] = useState(defaultBpm);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackMode, setPlaybackMode] = useState<PlaybackMode | undefined>(undefined);
    const [soloPatternIndex, setSoloPatternIndex] = useState<number | undefined>(undefined);
    const [cursorTick, setCursorTick] = useState(0);
    const patternsRef = useRef(props.patterns);
    const timelineRowsRef = useRef(props.timelineRows);
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
        timelineRowsRef.current = props.timelineRows;
    }, [props.timelineRows]);

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

    const playSample = (sample: AudioBuffer, destination: AudioNode, startTime: number, stopTime?: number,) => {
        const source = audioContext.createBufferSource();

        source.buffer = sample;
        source.connect(destination);
        source.start(startTime);
        if (stopTime) source.stop(stopTime)
    }

    const getNoteStopTime = (rhythm: RhythmData, currentMeasureIndex: number, currentNoteIndex: number, startTime: number) => {
        let stopTime = startTime;
        const notesPerMeasureFactor = positionsPerMeasure / rhythm.notesPerMeasure

        for (const note of rhythm.measures[currentMeasureIndex].notes) {
            if (note.index <= currentNoteIndex) continue;

            stopTime += getPositionDurationSeconds(bpmRef.current) * notesPerMeasureFactor
            if (note.value !== "-" && note.index !== currentNoteIndex) return stopTime;
        }

        for (let i = currentMeasureIndex + 1; i < rhythm.measures.length; i++) {
            for (let j = 0; j < rhythm.measures[i].notes.length; j++) {
                stopTime += getPositionDurationSeconds(bpmRef.current) * notesPerMeasureFactor

                const note = rhythm.measures[i].notes[j];
                if (note.value !== "-") return stopTime
            }
        }

        for (let i = 0; i <= currentMeasureIndex; i++) {
            for (let j = 0; j < rhythm.measures[i].notes.length; j++) {
                stopTime += getPositionDurationSeconds(bpmRef.current) * notesPerMeasureFactor

                const note = rhythm.measures[i].notes[j];
                if (i === currentMeasureIndex && j === currentNoteIndex) return undefined;
                if (note.value !== "-") return stopTime
            }
        }

        return undefined;
    }

    const schedulePattern = (pattern: PatternData, cursorTick: number, time: number) => {
        const { slotCount } = getPlaybackState(playbackModeRef.current, timelineRowsRef.current, soloPatternIndexRef.current, patternsRef.current)
        const position64 = cursorTick % positionsPerMeasure;
        const currentMeasureIndex = getMeasureIndex(cursorTick, pattern, slotCount);
        if (currentMeasureIndex === undefined) return;

        pattern.rhythms.forEach((rhythm) => {
            const currentMeasure = rhythm.measures[currentMeasureIndex];
            const sample = rhythm.sample;
            if (!currentMeasure || !sample) return;

            const currentNote = currentMeasure.notes.find((note) => note.position64 === position64);
            if (!currentNote) return;
            if (currentNote.value === "-") return;

            const stopTime = getNoteStopTime(rhythm, currentMeasureIndex, currentNote.index, time);

            const gain = getNoteGain(currentNote.value);
            rhythm.gainNode.gain.setValueAtTime(gain, time);

            if (gain <= 0) return;
            playSample(sample, rhythm.gainNode, time, stopTime);
        });
    }

    const scheduleTick = (cursorTick: number, time: number) => {
        const { timelines, slotCount } = getPlaybackState(playbackModeRef.current, timelineRowsRef.current, soloPatternIndexRef.current, patternsRef.current)
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

    const { timelines, slotCount } = getPlaybackState(playbackMode, props.timelineRows, soloPatternIndex, props.patterns)
    const playingPosition64 = isPlaying ? cursorTick % positionsPerMeasure : undefined;
    const playingSlotIndex = isPlaying && slotCount > 0
        ? Math.floor(cursorTick / positionsPerMeasure) % slotCount
        : undefined;

    const getPlayingMeasureIndex = (pattern: PatternData) => {
        if (!isPlaying) return undefined;
        if (slotCount <= 0) return undefined;

        const slotIndex = Math.floor(cursorTick / positionsPerMeasure) % slotCount;
        const isPatternPlaying = timelines.some((timeline) => (
            timeline.slots[slotIndex] === pattern.index
        ));

        if (!isPatternPlaying) return undefined;
        return getMeasureIndex(cursorTick, pattern, slotCount);
    }

    const handleOnStoreLoaded = (patterns: PatternData[], timelineRows: TimelineRowData[], bpm: number) => {
        setBpm(bpm)
        props.onStoreLoaded(patterns, timelineRows)
    }

    return (
        <div className="playback">
            <div className="menu">
                <div className="store">
                    <LoadPresetDialog onStoreLoaded={handleOnStoreLoaded} patterns={props.patterns} timelineRows={props.timelineRows} />
                    <SavePresetDialog patterns={props.patterns} timelineRows={props.timelineRows} bpm={bpm} />
                    <ManageSamplesDialog onPlaySample={playSample} />
                </div>
                <McpSocket patterns={props.patterns} timelineRows={props.timelineRows} onPatternChange={props.onPatternChange} onPatternAdded={props.onPatternAdded} onTimelineRowsChange={props.onTimelineRowsChange} />
                <Equalizer isPlaying={isPlaying} />
            </div>
            {props.children({
                isPlaying,
                bpm,
                setBpm,
                playingPosition64,
                playingSlotIndex: playingSlotIndex,
                getPlayingMeasureIndex,
                playPattern: (pattern) => {
                    void startPlayback("pattern", pattern.index);
                },
                playTimeline: () => void startPlayback("timelines"),
                stopPlayback: stopPlayback
            })}
        </div>
    )
}

export default Playback;
