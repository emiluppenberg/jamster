import type { MeasureData, PatternData, RhythmData, StoredData, StoredMeasureData, StoredPatternData, StoredRhythmData, TimelineRowData } from "../types"
import { saveData } from "./db"

const storeMeasure = (measure: MeasureData): StoredMeasureData => ({
    index: measure.index,
    noteSequence: measure.notes.map((note) => note.value || "-").join("")
})

const storeRhythm = (rhythm: RhythmData): StoredRhythmData => ({
    index: rhythm.index,
    name: rhythm.name,
    sampleFileName: rhythm.sampleFilename,
    notesPerMeasure: rhythm.notesPerMeasure,
    measures: rhythm.measures.map((measure) => storeMeasure(measure))
})

const storePattern = (pattern: PatternData): StoredPatternData => ({
    index: pattern.index,
    name: pattern.name,
    rhythms: pattern.rhythms.map((rhythm) => storeRhythm(rhythm))
})

export const storeData = async (patterns: PatternData[], timelineRows: TimelineRowData[], saveName: string): Promise<StoredData> => {
    const storedPatternData = patterns.map((pattern) => storePattern(pattern));
    const storedTimelineRowsData = timelineRows.map((row) => ({
        slots: row.slots
    }));

    const storedData: StoredData = {
        name: saveName,
        patterns: storedPatternData,
        timelineRows: storedTimelineRowsData
    }

    await saveData(storedData);
    return storedData;
} 
