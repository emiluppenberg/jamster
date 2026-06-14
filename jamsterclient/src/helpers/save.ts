import type { MeasureData, PatternData, RhythmData, StoredBeat, StoredMeasureData, StoredPatternData, StoredRhythmData, TimelineRowData } from "../types"
import { saveBeat } from "./db"

const storeMeasure = (measure: MeasureData): StoredMeasureData => ({
    noteSequence: measure.notes.map((note) => note.value || "-").join("")
})

const storeRhythm = (rhythm: RhythmData): StoredRhythmData => ({
    name: rhythm.name,
    sampleFileName: rhythm.sampleFilename,
    notesPerMeasure: rhythm.notesPerMeasure,
    measures: rhythm.measures.map((measure) => storeMeasure(measure))
})

const storePattern = (pattern: PatternData): StoredPatternData => ({
    name: pattern.name,
    rhythms: pattern.rhythms.map((rhythm) => storeRhythm(rhythm))
})

export const storeBeat = async (patterns: PatternData[], timelineRows: TimelineRowData[], saveName: string, bpm: number) => {
    const storedPatternData = patterns.map((pattern) => storePattern(pattern));
    const storedTimelineRowsData = timelineRows.map((row) => ({
        slots: row.slots
    }));

    const storedData: StoredBeat = {
        name: saveName,
        bpm: bpm,
        patterns: storedPatternData,
        timelineRows: storedTimelineRowsData
    }

    await saveBeat(storedData);
} 
