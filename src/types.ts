export type FigureData = {
    index: number;
    numberOfMeasures: number;
    patterns: PatternData[];
}

export type PatternData = {
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
