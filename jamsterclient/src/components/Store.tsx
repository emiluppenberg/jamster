import { useJamsterContext } from "../Context";
import { getData } from "../helpers/db";
import { loadPatterns } from "../helpers/load";
import { storeData } from "../helpers/save";
import type { PatternData, StoredData, TimelineRowData } from "../types";
import { useEffect, useState, type SetStateAction } from "react";

export interface StoreProps {
    patterns: PatternData[];
    timelineRows: TimelineRowData[];
    onStoreLoaded: (patterns: PatternData[], timeline: TimelineRowData[]) => void;
}

const getStoredData = async (
    setStoredData: React.Dispatch<SetStateAction<StoredData[]>>,
) => {
    const storedData = await getData();
    setStoredData(storedData);
}

const Store = (props: StoreProps) => {
    const { audioContext, analyserNode } = useJamsterContext();
    const [initialized, setInitialized] = useState(false);
    const [storedData, setStoredData] = useState<StoredData[]>([]);
    const [getIndex, setGetIndex] = useState<number | undefined>(0);
    const [saveName, setSaveName] = useState("");

    useEffect(() => {
        if (initialized) return;

        void getStoredData(setStoredData);

        setInitialized(true);
    }, [initialized])

    const handleLoad = async (): Promise<void> => {
        if (getIndex === undefined) return;

        const patterns = await loadPatterns(audioContext, analyserNode, storedData[getIndex].patterns);
        const timelines = storedData[getIndex].timelineRows.map((timeline, index) => ({
            index: index,
            slots: timeline.slots
        }));

        props.onStoreLoaded(patterns, timelines);
    }

    const handleSave = async (): Promise<void> => {
        if (saveName.length === 0) return;

        await storeData(props.patterns, props.timelineRows, saveName);
        await getStoredData(setStoredData);
    }
    
    return (
        <div className="store">
            <button className="btn" onClick={handleLoad}>Load</button>
            <select
                className="default"
                onChange={(e) => setGetIndex(Number(e.target.value))}
            >
                {storedData.map((data, index) => (
                    <option key={index} value={index}>
                        {data.name}
                    </option>
                ))}
            </select>
            <input
                type="text"
                className="default"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)} />
            <button className="btn" onClick={handleSave} disabled={saveName.length === 0}>Save</button>
        </div>
    )
}

export default Store;
