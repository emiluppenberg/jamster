import { useRef } from "react";
import { useJamsterContext } from "../../Context";
import type { PatternData, StoredPreset, TimelineRowData } from "../../types";
import { loadPatterns } from "../../helpers/load";

interface LoadPresetDialogProps {
    patterns: PatternData[];
    timelineRows: TimelineRowData[];
    onStoreLoaded: (patterns: PatternData[], timeline: TimelineRowData[]) => void;
}

const LoadPresetDialog = (props: LoadPresetDialogProps) => {
    const { audioContext, analyserNode, storedSamples, storedData, deleteStoredData } = useJamsterContext();
    const loadDialogRef = useRef<HTMLDialogElement>(null);

    const handleLoad = async (storedData: StoredPreset): Promise<void> => {
        const patterns = await loadPatterns(audioContext, analyserNode, storedData.patterns, storedSamples);
        const timelines = storedData.timelineRows.map((timeline, index) => ({
            index: index,
            slots: timeline.slots
        }));

        props.onStoreLoaded(patterns, timelines);

        loadDialogRef.current?.close();
    }

    const handleLoadDialogClose = () => {
        loadDialogRef.current?.close();
    }

    const handleDeleteStoredData = async (dataName: string) => {
        await deleteStoredData(dataName);
    }

    return (
        <>
            <button className="btn" type="button" onClick={() => loadDialogRef.current?.showModal()}>Load preset</button>
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
                        <div key={`load-stored-data-${index}`} className="dialog-row">
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
        </>
    )
}

export default LoadPresetDialog;