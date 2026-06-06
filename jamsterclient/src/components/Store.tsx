import { useJamsterContext } from "../Context";
import { getData } from "../helpers/db";
import { loadPatterns } from "../helpers/load";
import { storeData } from "../helpers/save";
import type { PatternData, StoredData, TimelineRowData } from "../types";
import { useEffect, useRef, useState, type SetStateAction } from "react";

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
    const [saveName, setSaveName] = useState("");
    const loadDialogRef = useRef<HTMLDialogElement>(null);
    const saveDialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (initialized) return;

        void getStoredData(setStoredData);

        setInitialized(true);
    }, [initialized])

    const handleLoad = async (storedData: StoredData): Promise<void> => {
        const patterns = await loadPatterns(audioContext, analyserNode, storedData.patterns);
        const timelines = storedData.timelineRows.map((timeline, index) => ({
            index: index,
            slots: timeline.slots
        }));

        props.onStoreLoaded(patterns, timelines);

        loadDialogRef.current?.close();
    }

    const handleSave = async (): Promise<void> => {
        if (saveName.length === 0) return;

        await storeData(props.patterns, props.timelineRows, saveName);
        await getStoredData(setStoredData);

        saveDialogRef.current?.close();
    }

    const handleLoadDialogClose = () => {
        loadDialogRef.current?.close();
    }

    const handleSaveDialogClose = () => {
        saveDialogRef.current?.close();
    }

    return (
        <div className="store">
            <button className="btn" type="button" onClick={() => loadDialogRef.current?.showModal()}>Load</button>
            <dialog className="app-dialog store-dialog load-dialog" ref={loadDialogRef} aria-labelledby="load-dialog-title">
                <div className="app-dialog-header">
                    <div>
                        <h2 id="load-dialog-title" className="app-dialog-eyebrow">Load</h2>
                    </div>
                    <button className="btn app-dialog-close" type="button" onClick={handleLoadDialogClose} aria-label="Close load dialog">
                        X
                    </button>
                </div>
                <div className="store-dialog-list">
                    {storedData.length > 0 ? storedData.map((data, index) => (
                        <button
                            key={index}
                            className="store-dialog-field store-load-option"
                            type="button"
                            onClick={() => void handleLoad(data)}
                        >
                            {data.name}
                        </button>
                    )) : (
                        <p className="app-dialog-hint">No saved data yet.</p>
                    )}
                </div>
            </dialog>
            <button className="btn" type="button" onClick={() => saveDialogRef.current?.showModal()}>Save</button>
            <dialog className="app-dialog store-dialog save-dialog" ref={saveDialogRef} aria-labelledby="save-dialog-title">
                <div className="app-dialog-header">
                    <div>
                        <h2 id="save-dialog-title" className="app-dialog-eyebrow">Save</h2>
                    </div>
                    <button className="btn app-dialog-close" type="button" onClick={handleSaveDialogClose} aria-label="Close save dialog">
                        X
                    </button>
                </div>
                <div className="store-dialog-form">
                    <label htmlFor="store-save-name">Name</label>
                    <input
                        id="store-save-name"
                        type="text"
                        className="store-dialog-field"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                    />
                    <button className="btn" type="button" onClick={() => void handleSave()} disabled={saveName.length === 0}>Save</button>
                </div>
            </dialog>
        </div>
    )
}

export default Store;
