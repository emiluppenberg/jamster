import type { MeasureData, PatternData, RhythmData, StoredMeasureData, StoredPatternData } from "../types";
import { getNotePosition64 } from "../utils";
import { getSample } from "./db";

export const decodeStoredSample = async (audioContext: AudioContext, sampleFileName: string) => {
    const storedSample = await getSample(sampleFileName);
    if (!storedSample) throw new Error(`Error loading sample: ${sampleFileName}`)
    return audioContext.decodeAudioData(storedSample.arrayBuffer.slice(0));
}

export const loadMeasures = (
    notesPerMeasure: number,
    measures: StoredMeasureData[],
): MeasureData[] => {
    return measures.map((measure) => ({
        index: measure.index,
        notes: Array.from({ length: notesPerMeasure }, (_, noteIndex) => {
            const value = measure.noteSequence[noteIndex] ?? "-";

            return {
                index: noteIndex,
                position64: getNotePosition64(noteIndex, notesPerMeasure),
                value: value === "-" ? "" : value
            }
        })
    }))
}

export const loadRhythm = async (
    audioContext: AudioContext,
    analyserNode: AnalyserNode,
    index: number,
    sampleFileName: string,
    notesPerMeasure: number,
    measures: StoredMeasureData[],
): Promise<RhythmData> => {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    gainNode.connect(analyserNode);

    return {
        index,
        gainNode,
        notesPerMeasure,
        measures: loadMeasures(notesPerMeasure, measures),
        sample: await decodeStoredSample(audioContext, sampleFileName),
        sampleFileName: sampleFileName
    };
}

export const loadPatterns = async (audioContext: AudioContext, analyserNode: AnalyserNode, patternData: StoredPatternData[]): Promise<PatternData[]> => {
    return await Promise.all(patternData!.map(async (pattern) => ({
        index: pattern.index,
        numberOfMeasures: Math.max(1, ...pattern.rhythms.map(r => r.measures.length)),
        rhythms: await Promise.all(pattern.rhythms.map((rhythm) =>
            loadRhythm(
                audioContext,
                analyserNode,
                rhythm.index,
                rhythm.sampleFileName,
                rhythm.notesPerMeasure,
                rhythm.measures,
            )
        )),
        name: pattern.name
    })));
}