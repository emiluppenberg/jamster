import type { MeasureData, PatternData, RhythmData, SavedPatternData } from "../types";
import { loadSample } from "./db";

export const getNotePosition64 = (noteIndex: number, notesPerMeasure: number) => (
    noteIndex * (64 / notesPerMeasure)
)

export const decodeStoredSample = async (audioContext: AudioContext, sampleFileName: string) => {
    const storedSample = await loadSample(sampleFileName);
    return audioContext.decodeAudioData(storedSample.arrayBuffer.slice(0));
}

export const loadMeasures = (
    notesPerMeasure: number,
    noteSequences: string[],
): MeasureData[] => (
    Array.from({ length: noteSequences.length }, (_, measureIndex) => ({
        index: measureIndex,
        notes: Array.from({ length: notesPerMeasure }, (_, noteIndex) => {
            const value = noteSequences[measureIndex][noteIndex] ?? "-";

            return {
                index: noteIndex,
                position64: getNotePosition64(noteIndex, notesPerMeasure),
                value: value === "-" ? "" : value,
            };
        }),
    }))
)

export const loadRhythm = async (
    audioContext: AudioContext,
    analyserNode: AnalyserNode,
    index: number,
    sampleFileName: string,
    notesPerMeasure: number,
    noteSequences: string[],
): Promise<RhythmData> => {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    gainNode.connect(analyserNode);

    return {
        index,
        gainNode,
        notesPerMeasure,
        measures: loadMeasures(notesPerMeasure, noteSequences),
        sample: await decodeStoredSample(audioContext, sampleFileName),
        sampleFileName: sampleFileName
    };
}

export const loadPatterns = async (audioContext: AudioContext, analyserNode: AnalyserNode, patternData: SavedPatternData[]): Promise<PatternData[]> => {
    return await Promise.all(patternData!.map(async (pattern, index) => ({
        index: index,
        numberOfMeasures: Math.max(1, ...pattern.rhythms.map(r => r.noteSequences.length)),
        rhythms: await Promise.all(pattern.rhythms.map((rhythm, index) =>
            loadRhythm(
                audioContext,
                analyserNode,
                index,
                rhythm.sampleFileName,
                rhythm.notesPerMeasure,
                rhythm.noteSequences,
            )
        )),
        name: pattern.name
    })));
}