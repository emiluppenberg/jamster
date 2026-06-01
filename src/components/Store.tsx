import { useJamsterContext } from "../Context";
import { loadPatterns } from "../helpers/load";
import type { PatternData, SavedData, TimelineRowData } from "../types";
import { useState } from "react";
import { examplePatterns, exampleTimelines } from "../utils";

export interface StoreProps {
    onStoreLoaded: (patterns: PatternData[], timeline: TimelineRowData[]) => void;
}

const Store = (props: StoreProps) => {
    const { audioContext, analyserNode } = useJamsterContext();
    const [savedData] = useState<SavedData>({ name: "example", patterns: examplePatterns, timelines: exampleTimelines });

    const handleLoad = async (): Promise<void> => {
        const patterns = await loadPatterns(audioContext, analyserNode, savedData.patterns);
        const timelines = savedData.timelines.map((timeline, index) => ({
            index: index,
            slots: timeline.slots
        }));

        props.onStoreLoaded(patterns, timelines);
    }

    return (
        <div className="store">
            <button className="btn" onClick={handleLoad}>
                Load
            </button>
        </div>
    )
}

export default Store;
