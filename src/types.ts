export type TimelineRowData = {
    index: number;
    slots: PatternIndex[];
}

export type PatternIndex = number | undefined;

export type PatternData = {
    index: number;
    numberOfMeasures: number;
    rhythms: RhythmData[];
    name: string;
}

export type RhythmData = {
    index: number;
    gainNode: GainNode;
    notesPerMeasure: number;
    measures: MeasureData[];
    sample?: AudioBuffer;
    sampleFileName: string;
}

export type MeasureData = {
    index: number;
    notes: NoteData[];
}

export type NoteData = {
    index: number;
    position64: number;
    value: string;
}

export type SavedPatternData = {
    rhythms: SavedRhythmData[];
    name: string;
}

export type SavedRhythmData = {
    sampleFileName: string;
    notesPerMeasure: number;
    noteSequences: string[];
}

export type SavedTimelineData = {
    slots: PatternIndex[];
}

export type SavedData = {
    name: string;
    timelines: SavedTimelineData[],
    patterns: SavedPatternData[]
}

export type StoredSample = {
    sampleFileName: string;
    arrayBuffer: ArrayBuffer;
}