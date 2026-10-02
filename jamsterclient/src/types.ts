export type TimelineRowData = {
    slots: PatternSlot[];
}

export type PatternId = string;
export type PatternSlot = PatternId | undefined;
export type RhythmId = string;
export type StoredPatternIndex = number | undefined;

export type PatternData = {
    id: PatternId;
    numberOfMeasures: number;
    rhythms: RhythmData[];
    name: string;
}

export type RhythmData = {
    id: RhythmId;
    name: string;
    gainNode: GainNode;
    notesPerMeasure: number;
    measures: MeasureData[];
    sample?: AudioBuffer;
    sampleFilename: string;
}

export type MeasureData = {
    notes: NoteData[];
}

export type NoteData = {
    position64: number;
    value: string;
}

export type StoredPatternData = {
    rhythms: StoredRhythmData[];
    name: string;
}

export type StoredRhythmData = {
    name: string;
    sampleFileName: string;
    notesPerMeasure: number;
    measures: StoredMeasureData[];
}

export type StoredMeasureData = {
    noteSequence: string;
}

export type StoredTimelineRowData = {
    slots: StoredPatternIndex[];
}

export type StoredBeat = {
    name: string;
    bpm: number;
    timelineRows: StoredTimelineRowData[],
    patterns: StoredPatternData[]
}

export type StoredSample = {
    sampleFilename: string;
    mcpDescription: string;
    arrayBuffer: ArrayBuffer;
    audioBuffer: AudioBuffer;
}

export type StoredSampleArrayBuffer = {
    sampleFilename: string;
    arrayBuffer: ArrayBuffer;
}

export type StoredSampleMcpDescription = {
    sampleFilename: string;
    mcpDescription: string;
}

export type FocusRhythm = {
    rhythmId: RhythmId;
    inputIndex: number;
}

export type Warning = {
    message: string;
    id: string;
}
