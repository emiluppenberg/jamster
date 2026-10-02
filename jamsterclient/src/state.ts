import type { PatternData, PatternId, TimelineRowData } from "./types";

export type AppState = {
    patterns: PatternData[];
    timelineRows: TimelineRowData[];
}

export type TimelineRowsUpdate =
    | TimelineRowData[]
    | ((currentRows: TimelineRowData[]) => TimelineRowData[]);

export type AppAction =
    | { type: "newBeat" }
    | { type: "addPattern"; pattern: PatternData }
    | { type: "changePattern"; pattern: PatternData }
    | { type: "deletePattern"; patternId: PatternId }
    | { type: "loadStore"; patterns: PatternData[]; timelineRows: TimelineRowData[] }
    | { type: "setTimelineRows"; update: TimelineRowsUpdate };

export const initialAppState: AppState = {
    patterns: [],
    timelineRows: [],
};

export const appStateReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case "newBeat":
            return {
                patterns: [],
                timelineRows: [],
            };
        case "addPattern":
            return {
                ...state,
                patterns: [...state.patterns, action.pattern],
            };
        case "changePattern":
            return {
                ...state,
                patterns: state.patterns.map((pattern) => (
                    pattern.id === action.pattern.id ? action.pattern : pattern
                )),
            };
        case "deletePattern":
            return {
                patterns: state.patterns.filter((pattern) => pattern.id !== action.patternId),
                timelineRows: state.timelineRows.map((row) => ({
                    ...row,
                    slots: row.slots.map((patternId) => (
                        patternId === action.patternId ? undefined : patternId
                    )),
                })),
            };
        case "loadStore":
            return {
                patterns: action.patterns,
                timelineRows: action.timelineRows,
            };
        case "setTimelineRows":
            return {
                ...state,
                timelineRows: typeof action.update === "function"
                    ? action.update(state.timelineRows)
                    : action.update,
            };
    }
}
