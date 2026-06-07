import { createContext, useContext } from "react"
import type { PatternData, SampleData, StoredData, StoredSample, TimelineRowData } from "./types";

export type JamsterState = {
    appSessionId: string;
    audioContext: AudioContext;
    analyserNode: AnalyserNode;
    storedData: StoredData[];
    storedSamples: StoredSample[];
    samples: SampleData[];
    refreshStoredData: () => Promise<void>;
    refreshStoredSamples: () => Promise<void>;
    refreshSamples: () => Promise<void>;
    saveStoredData: (patterns: PatternData[], timelineRows: TimelineRowData[], saveName: string) => Promise<void>;
    saveStoredSample: (sample: StoredSample) => Promise<void>;
    deleteStoredData: (dataName: string) => Promise<void>;
    deleteStoredSample: (sampleFilename: string) => Promise<void>;
}

export const JamsterContext = createContext<JamsterState | undefined>(undefined);

export const useJamsterContext = () => {
    const context = useContext(JamsterContext);

    if (!context) {
        throw new Error("useJamsterContext must be used within JamsterProvider");
    }

    return context;
}
