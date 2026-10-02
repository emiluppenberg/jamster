import type { MeasureData, PatternData, RhythmData, StoredMeasureData, StoredPatternData, StoredSample, StoredTimelineRowData, TimelineRowData } from "../types";
import { createRuntimeId, getNotePosition64 } from "../utils";

export const decodeStoredSample = async (audioContext: AudioContext, sampleFileName: string, storedSamples: StoredSample[]) => {
    const storedSample = storedSamples.find(stored => stored.sampleFilename === sampleFileName)
    if (!storedSample) return undefined;
    return audioContext.decodeAudioData(storedSample.arrayBuffer.slice(0));
}

export const loadMeasures = (
    notesPerMeasure: number,
    measures: StoredMeasureData[],
): MeasureData[] => {
    return measures.map((measure) => ({
        notes: Array.from({ length: notesPerMeasure }, (_, noteIndex) => {
            const value = measure.noteSequence[noteIndex] ?? "-";

            return {
                position64: getNotePosition64(noteIndex, notesPerMeasure),
                value: value
            }
        })
    }))
}

export const loadRhythm = async (
    audioContext: AudioContext,
    analyserNode: AnalyserNode,
    storedSamples: StoredSample[],
    name: string,
    sampleFileName: string,
    notesPerMeasure: number,
    measures: StoredMeasureData[],
): Promise<RhythmData> => {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    gainNode.connect(analyserNode);

    const sample = await decodeStoredSample(audioContext, sampleFileName, storedSamples)

    return {
        id: createRuntimeId(),
        name: name,
        gainNode: gainNode,
        notesPerMeasure: notesPerMeasure,
        measures: loadMeasures(notesPerMeasure, measures),
        sample: sample,
        sampleFilename: sample ? sampleFileName : ""
    };
}

export const loadPatterns = async (audioContext: AudioContext, analyserNode: AnalyserNode, patternData: StoredPatternData[], storedSamples: StoredSample[]): Promise<PatternData[]> => {
    return await Promise.all(patternData.map(async (pattern) => ({
        id: createRuntimeId(),
        numberOfMeasures: Math.max(1, ...pattern.rhythms.map(r => r.measures.length)),
        rhythms: await Promise.all(pattern.rhythms.map((rhythm) =>
            loadRhythm(
                audioContext,
                analyserNode,
                storedSamples,
                rhythm.name,
                rhythm.sampleFileName,
                rhythm.notesPerMeasure,
                rhythm.measures,
            )
        )),
        name: pattern.name
    })));
}

export const loadTimelineRows = (
    storedRows: StoredTimelineRowData[],
    patterns: PatternData[],
): TimelineRowData[] => storedRows.map((row) => ({
    slots: row.slots.map((patternPosition) => {
        if (patternPosition === undefined || patternPosition < 0) return undefined;
        return patterns[patternPosition]?.id;
    }),
}));
