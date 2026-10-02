import { useEffect, useRef, useState, type ReactNode, type SetStateAction } from "react";
import { useJamsterContext } from "../Context";
import type { PatternData, PatternId, RhythmData, TimelineRowData } from "../types";
import Equalizer from "./Equalizer";
import McpSocket from "./McpSocket";
import LoadDialog from "./menu/LoadDialog";
import SaveDialog from "./menu/SaveDialog";
import SamplesDialog from "./menu/SamplesDialog";
import Brand from "./menu/Brand";

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

const getPatternById = (patterns: PatternData[], patternId: PatternId | undefined) => {
    if (patternId === undefined) return undefined;
    return patterns.find((pattern) => pattern.id === patternId);
}

const getPlaybackTimelines = (
    mode: PlaybackMode | undefined,
    timelines: TimelineRowData[],
    patternId: PatternId | undefined,
    patterns: PatternData[],
): TimelineRowData[] => {
    if (mode === "pattern" && patternId !== undefined) {
        const slotsLength = patterns.find((pattern) => pattern.id === patternId)?.numberOfMeasures
        
        if (!slotsLength) throw new Error(`Could not find pattern with id: ${patternId}`);

        return [{ slots: Array.from({ length: slotsLength }, () => patternId) }];
    }

    if (mode === "timelines") {
        return timelines;
    }

    return [];
}

const getPlaybackState = (
    mode: PlaybackMode | undefined,
    timelines: TimelineRowData[],
    patternId: PatternId | undefined,
    patterns: PatternData[]
) => {
    const playbackTimelines = getPlaybackTimelines(mode, timelines, patternId, patterns);
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
    onPatternDelete: (pattern: PatternData) => void;
    onTimelineRowsChange: React.Dispatch<SetStateAction<TimelineRowData[]>>;
}

const Playback = (props: PlaybackProps) => {
    const { audioContext } = useJamsterContext();
    const [bpm, setBpm] = useState(defaultBpm);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackMode, setPlaybackMode] = useState<PlaybackMode | undefined>(undefined);
    const [soloPatternId, setSoloPatternId] = useState<PatternId | undefined>(undefined);
    const [cursorTick, setCursorTick] = useState(0);
    const patternsRef = useRef(props.patterns);
    const timelineRowsRef = useRef(props.timelineRows);
    const playbackModeRef = useRef<PlaybackMode | undefined>(undefined);
    const soloPatternIdRef = useRef<PatternId | undefined>(undefined);
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

        const currentNotes = rhythm.measures[currentMeasureIndex].notes;
        for (let noteIndex = currentNoteIndex + 1; noteIndex < currentNotes.length; noteIndex++) {
            stopTime += getPositionDurationSeconds(bpmRef.current) * notesPerMeasureFactor
            if (currentNotes[noteIndex].value !== "-") return stopTime;
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
        const { slotCount } = getPlaybackState(playbackModeRef.current, timelineRowsRef.current, soloPatternIdRef.current, patternsRef.current)
        const position64 = cursorTick % positionsPerMeasure;
        const currentMeasureIndex = getMeasureIndex(cursorTick, pattern, slotCount);
        if (currentMeasureIndex === undefined) return;

        pattern.rhythms.forEach((rhythm) => {
            const currentMeasure = rhythm.measures[currentMeasureIndex];
            const sample = rhythm.sample;
            if (!currentMeasure || !sample) return;

            const currentNoteIndex = currentMeasure.notes.findIndex((note) => note.position64 === position64);
            if (currentNoteIndex < 0) return;
            const currentNote = currentMeasure.notes[currentNoteIndex];
            if (currentNote.value === "-") return;

            const stopTime = getNoteStopTime(rhythm, currentMeasureIndex, currentNoteIndex, time);

            const gain = getNoteGain(currentNote.value);
            rhythm.gainNode.gain.setValueAtTime(gain, time);

            if (gain <= 0) return;
            playSample(sample, rhythm.gainNode, time, stopTime);
        });
    }

    const scheduleTick = (cursorTick: number, time: number) => {
        const { timelines, slotCount } = getPlaybackState(playbackModeRef.current, timelineRowsRef.current, soloPatternIdRef.current, patternsRef.current)
        const slotIndex = Math.floor(cursorTick / positionsPerMeasure) % slotCount;

        timelines.forEach((timeline) => {
            const pattern = getPatternById(patternsRef.current, timeline.slots[slotIndex]);
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

    const startPlayback = async (mode: PlaybackMode, patternId?: PatternId) => {
        if (schedulerTimerRef.current !== undefined) {
            window.clearInterval(schedulerTimerRef.current);
            schedulerTimerRef.current = undefined;
        }

        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        playbackModeRef.current = mode;
        soloPatternIdRef.current = patternId;
        nextCursorTickRef.current = 0;
        nextTickTimeRef.current = audioContext.currentTime + startDelaySeconds;
        setPlaybackMode(mode);
        setSoloPatternId(patternId);
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
        soloPatternIdRef.current = undefined;
        setPlaybackMode(undefined);
        setSoloPatternId(undefined);
        setCursorTick(0);
        setIsPlaying(false);
    }

    const { timelines, slotCount } = getPlaybackState(playbackMode, props.timelineRows, soloPatternId, props.patterns)
    const playingPosition64 = isPlaying ? cursorTick % positionsPerMeasure : undefined;
    const playingSlotIndex = isPlaying && slotCount > 0
        ? Math.floor(cursorTick / positionsPerMeasure) % slotCount
        : undefined;

    const getPlayingMeasureIndex = (pattern: PatternData) => {
        if (!isPlaying) return undefined;
        if (slotCount <= 0) return undefined;

        const slotIndex = Math.floor(cursorTick / positionsPerMeasure) % slotCount;
        const isPatternPlaying = timelines.some((timeline) => (
            timeline.slots[slotIndex] === pattern.id
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
                <Brand />
                <LoadDialog onStoreLoaded={handleOnStoreLoaded}/>
                <SaveDialog patterns={props.patterns} timelineRows={props.timelineRows} bpm={bpm} />
                <SamplesDialog onPlaySample={playSample} />
                <McpSocket
                    patterns={props.patterns}
                    timelineRows={props.timelineRows}
                    onPatternChange={props.onPatternChange}
                    onPatternAdded={props.onPatternAdded}
                    onPatternDelete={props.onPatternDelete}
                    onTimelineRowsChange={props.onTimelineRowsChange} />
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
                    void startPlayback("pattern", pattern.id);
                },
                playTimeline: () => void startPlayback("timelines"),
                stopPlayback: stopPlayback
            })}
        </div>
    )
}

export default Playback;
