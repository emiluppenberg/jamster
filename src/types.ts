export type TimelineData = {
    index: number;
    slots: Slot[];
}

export type Slot = number | undefined;

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
    sampleUrl: string;
    notesPerMeasure: number;
    noteSequences: string[];
}