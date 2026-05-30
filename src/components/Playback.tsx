import { useEffect, useRef, useState, type ReactNode } from "react";
import { useJamsterContext } from "../Context";
import type { FigureData, Track } from "../types";

const defaultBpm = 120;
const beatsPerMeasure = 4;
const positionsPerMeasure = 64;
const schedulerIntervalMs = 25;
const scheduleAheadSeconds = 0.1;
const startDelaySeconds = 0.05;

const getPositionDurationSeconds = (bpm: number) => (
    60 / bpm / (positionsPerMeasure / beatsPerMeasure)
)

const getMeasureIndex = (cursorTick: number, figure: FigureData) => {
    if (figure.numberOfMeasures <= 0) return undefined;
    return Math.floor(cursorTick / positionsPerMeasure) % figure.numberOfMeasures;
}

const getNoteGain = (value: string) => {
    const gain = Number(value) / 9;
    if (!Number.isFinite(gain)) return 0;
    return Math.max(0, Math.min(1, gain));
}

type PlaybackMode = "tracks" | "figure";

const getTimelineLength = (tracks: Track[]) => (
    Math.max(0, ...tracks.map((track) => track.timeline.length))
)

const getFigureByIndex = (figures: FigureData[], figureIndex: number | undefined) => {
    if (figureIndex === undefined) return undefined;
    return figures.find((figure) => figure.index === figureIndex);
}

const getPlaybackTracks = (
    mode: PlaybackMode | undefined,
    tracks: Track[],
    figureIndex: number | undefined,
): Track[] => {
    if (mode === "figure" && figureIndex !== undefined) {
        return [{ index: 0, timeline: [figureIndex] }];
    }

    if (mode === "tracks") {
        return tracks;
    }

    return [];
}

export type PlaybackRenderProps = {
    isPlaying: boolean;
    playingPosition64?: number;
    getPlayingMeasureIndex: (figure: FigureData) => number | undefined;
    playFigure: (figure: FigureData) => void;
}

export interface PlaybackProps {
    figures: FigureData[];
    tracks: Track[];
    children: (props: PlaybackRenderProps) => ReactNode;
}

const Playback = (props: PlaybackProps) => {
    const { audioContext } = useJamsterContext();
    const [bpm, setBpm] = useState(defaultBpm);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackMode, setPlaybackMode] = useState<PlaybackMode | undefined>(undefined);
    const [soloFigureIndex, setSoloFigureIndex] = useState<number | undefined>(undefined);
    const [cursorTick, setCursorTick] = useState(0);
    const figuresRef = useRef(props.figures);
    const tracksRef = useRef(props.tracks);
    const playbackModeRef = useRef<PlaybackMode | undefined>(undefined);
    const soloFigureIndexRef = useRef<number | undefined>(undefined);
    const bpmRef = useRef(bpm);
    const schedulerTimerRef = useRef<number | undefined>(undefined);
    const nextCursorTickRef = useRef(0);
    const nextTickTimeRef = useRef(0);

    useEffect(() => {
        figuresRef.current = props.figures;
    }, [props.figures]);

    useEffect(() => {
        tracksRef.current = props.tracks;
    }, [props.tracks]);

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

    const scheduleFigure = (figure: FigureData, cursorTick: number, time: number) => {
        const position64 = cursorTick % positionsPerMeasure;
        const measureIndex = getMeasureIndex(cursorTick, figure);
        if (measureIndex === undefined) return;

        figure.patterns.forEach((pattern) => {
            const measure = pattern.measures[measureIndex];
            const sample = pattern.sample;
            if (!measure || !sample) return;

            const note = measure.notes.find((note) => note.position64 === position64);
            if (!note) return;

            const gain = getNoteGain(note.value);
            pattern.gainNode.gain.setValueAtTime(gain, time);

            if (gain <= 0) return;
            playSample(sample, time, pattern.gainNode);
        });
    }

    const scheduleTick = (cursorTick: number, time: number) => {
        const tracks = getPlaybackTracks(
            playbackModeRef.current,
            tracksRef.current,
            soloFigureIndexRef.current,
        );
        const timelineLength = getTimelineLength(tracks);
        if (timelineLength <= 0) return;

        const timelineIndex = Math.floor(cursorTick / positionsPerMeasure) % timelineLength;

        tracks.forEach((track) => {
            const figure = getFigureByIndex(figuresRef.current, track.timeline[timelineIndex]);
            if (!figure) return;
            scheduleFigure(figure, cursorTick, time);
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

    const startPlayback = async (mode: PlaybackMode, figureIndex?: number) => {
        const tracks = getPlaybackTracks(mode, props.tracks, figureIndex);
        if (getTimelineLength(tracks) <= 0) return;

        if (schedulerTimerRef.current !== undefined) {
            window.clearInterval(schedulerTimerRef.current);
            schedulerTimerRef.current = undefined;
        }

        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        playbackModeRef.current = mode;
        soloFigureIndexRef.current = figureIndex;
        nextCursorTickRef.current = 0;
        nextTickTimeRef.current = audioContext.currentTime + startDelaySeconds;
        setPlaybackMode(mode);
        setSoloFigureIndex(figureIndex);
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
        soloFigureIndexRef.current = undefined;
        setPlaybackMode(undefined);
        setSoloFigureIndex(undefined);
        setCursorTick(0);
        setIsPlaying(false);
    }

    const playingPosition64 = isPlaying ? cursorTick % positionsPerMeasure : undefined;

    const getPlayingMeasureIndex = (figure: FigureData) => {
        if (!isPlaying) return undefined;

        const tracks = getPlaybackTracks(playbackMode, props.tracks, soloFigureIndex);
        const timelineLength = getTimelineLength(tracks);
        if (timelineLength <= 0) return undefined;

        const timelineIndex = Math.floor(cursorTick / positionsPerMeasure) % timelineLength;
        const isFigurePlaying = tracks.some((track) => (
            track.timeline[timelineIndex] === figure.index
        ));

        if (!isFigurePlaying) return undefined;
        return getMeasureIndex(cursorTick, figure);
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

                        void startPlayback("tracks");
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
                playFigure: (figure) => {
                    void startPlayback("figure", figure.index);
                },
            })}
        </div>
    )
}

export default Playback;
