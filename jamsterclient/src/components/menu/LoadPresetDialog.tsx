import { useRef } from "react";
import { useJamsterContext } from "../../Context";
import type { PatternData, StoredPreset, TimelineRowData } from "../../types";
import { loadPatterns } from "../../helpers/load";

interface LoadPresetDialogProps {
    patterns: PatternData[];
    timelineRows: TimelineRowData[];
    onStoreLoaded: (patterns: PatternData[], timelineRows: TimelineRowData[], bpm: number) => void;
}

const LoadPresetDialog = (props: LoadPresetDialogProps) => {
    const { audioContext, analyserNode, storedSamples, storedPresets, deleteStoredPreset } = useJamsterContext();
    const loadDialogRef = useRef<HTMLDialogElement>(null);

    const handleLoad = async (storedPreset: StoredPreset): Promise<void> => {
        const patterns = await loadPatterns(audioContext, analyserNode, storedPreset.patterns, storedSamples);
        const timelines = storedPreset.timelineRows.map((timeline, index) => ({
            index: index,
            slots: timeline.slots
        }));

        props.onStoreLoaded(patterns, timelines, storedPreset.bpm);

        loadDialogRef.current?.close();
    }

    const handleLoadDialogClose = () => {
        loadDialogRef.current?.close();
    }

    const handleDeleteStoredPreset = async (presetname: string) => {
        await deleteStoredPreset(presetname);
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
                    {storedPresets.length > 0 ? storedPresets.map((preset, index) => (
                        <div key={`load-stored-preset-${index}`} className="dialog-row">
                            <button className="btn delete" type="button" onClick={() => handleDeleteStoredPreset(preset.name)}>-</button>
                            <button
                                className="dialog-field"
                                type="button"
                                onClick={() => void handleLoad(preset)}
                            >
                                {preset.name}
                            </button>
                        </div>
                    )) : (
                        <p className="dialog-hint">No saved preset yet.</p>
                    )}
                </div>
            </dialog>
        </>
    )
}

export default LoadPresetDialog;