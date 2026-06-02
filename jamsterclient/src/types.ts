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

export type StoredPatternData = {
    index: number;
    rhythms: StoredRhythmData[];
    name: string;
}

export type StoredRhythmData = {
    index: number;
    sampleFileName: string;
    notesPerMeasure: number;
    measures: StoredMeasureData[];
}

export type StoredMeasureData = {
    index: number;
    noteSequence: string;
}

export type StoredTimelineRowData = {
    slots: PatternIndex[];
}

export type StoredData = {
    name: string;
    timelineRows: StoredTimelineRowData[],
    patterns: StoredPatternData[]
}

export type StoredSample = {
    sampleFileName: string;
    arrayBuffer: ArrayBuffer;
}