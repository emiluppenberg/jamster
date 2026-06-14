import { createContext, useContext, type SetStateAction } from "react"
import type { PatternData, StoredBeat, StoredSample, StoredSampleArrayBuffer, StoredSampleMcpDescription, TimelineRowData } from "./types";

export type JamsterState = {
    appSessionId: string;
    audioContext: AudioContext;
    analyserNode: AnalyserNode;
    storedBeats: StoredBeat[];
    storedSamples: StoredSample[];
    beatName: string;
    setBeatName: React.Dispatch<SetStateAction<string>>;
    saveStoredBeat: (patterns: PatternData[], timelineRows: TimelineRowData[], beatName: string, bpm: number) => Promise<void>;
    saveStoredSampleArrayBuffer: (sample: StoredSampleArrayBuffer) => Promise<void>;
    saveStoredSampleMcpDescription: (sample: StoredSampleMcpDescription) => Promise<void>;
    deleteStoredBeat: (beatName: string) => Promise<void>;
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
