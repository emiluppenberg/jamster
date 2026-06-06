import { useJamsterContext } from "../Context";
import { loadPatterns } from "../helpers/load";
import type { PatternData, StoredData, TimelineRowData } from "../types";
import { useMemo, useRef, useState } from "react";

export interface StoreProps {
    patterns: PatternData[];
    timelineRows: TimelineRowData[];
    onStoreLoaded: (patterns: PatternData[], timeline: TimelineRowData[]) => void;
}

const Store = (props: StoreProps) => {
    const { audioContext, analyserNode, storedSamples, storedData, saveStoredData, deleteStoredData, refreshStoredData } = useJamsterContext();
    const [saveName, setSaveName] = useState("");
    const loadDialogRef = useRef<HTMLDialogElement>(null);
    const saveDialogRef = useRef<HTMLDialogElement>(null);
    const isExistingName = useMemo(() => storedData.some(data => data.name === saveName), [saveName, storedData])

    const handleLoad = async (storedData: StoredData): Promise<void> => {
        const patterns = await loadPatterns(audioContext, analyserNode, storedData.patterns, storedSamples);
        const timelines = storedData.timelineRows.map((timeline, index) => ({
            index: index,
            slots: timeline.slots
        }));

        props.onStoreLoaded(patterns, timelines);

        loadDialogRef.current?.close();
    }

    const handleSave = async (): Promise<void> => {
        if (saveName.length === 0) return;

        await saveStoredData(props.patterns, props.timelineRows, saveName);
        await refreshStoredData();

        saveDialogRef.current?.close();
    }

    const handleLoadDialogClose = () => {
        loadDialogRef.current?.close();
    }

    const handleSaveDialogClose = () => {
        saveDialogRef.current?.close();
    }

    const handleDeleteStoredData = async (dataName: string) => {
        await deleteStoredData(dataName);
        await refreshStoredData();
    }

    return (
        <div className="store">
            <button className="btn" type="button" onClick={() => loadDialogRef.current?.showModal()}>Load</button>
            <dialog className="load-dialog" ref={loadDialogRef} >
                <div className="dialog-header">
                    <div>
                        <h2 className="dialog-eyebrow">Load</h2>
                    </div>
                    <button className="btn dialog-close" type="button" onClick={handleLoadDialogClose}>
                        X
                    </button>
                </div>
                <div className="dialog-list">
                    {storedData.length > 0 ? storedData.map((data, index) => (
                        <div key={index} className="dialog-row">
                            <button className="btn delete" type="button" onClick={() => handleDeleteStoredData(data.name)}>-</button>
                            <button
                                className="dialog-field"
                                type="button"
                                onClick={() => void handleLoad(data)}
                            >
                                {data.name}
                            </button>
                        </div>
                    )) : (
                        <p className="dialog-hint">No saved data yet.</p>
                    )}
                </div>
            </dialog>
            <button className="btn" type="button" onClick={() => saveDialogRef.current?.showModal()}>Save</button>
            <dialog className="save-dialog" ref={saveDialogRef}>
                <div className="dialog-header">
                    <div>
                        <h2 className="dialog-eyebrow">Save</h2>
                    </div>
                    <button className="btn dialog-close" type="button" onClick={handleSaveDialogClose}>
                        X
                    </button>
                </div>
                <div className="dialog-form">
                    <label htmlFor="store-save-name">Name</label>
                    <input
                        id="store-save-name"
                        type="text"
                        className="dialog-field"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                    />
                    <button className="btn" type="button" onClick={() => void handleSave()} disabled={saveName.length === 0}>Save</button>
                </div>
                {isExistingName && (
                    <p className="dialog-hint">Saving will overwrite existing data</p>
                )}
            </dialog>
        </div>
    )
}

export default Store;
