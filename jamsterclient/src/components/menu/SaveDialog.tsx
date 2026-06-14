import { useState, useRef, useMemo } from "react";
import { useJamsterContext } from "../../Context";
import type { PatternData, TimelineRowData } from "../../types";

interface SaveDialogProps {
    patterns: PatternData[];
    timelineRows: TimelineRowData[];
    bpm: number;
}

const SaveDialog = (props: SaveDialogProps) => {
    const { storedPresets, saveStoredPreset } = useJamsterContext();
    const [saveName, setSaveName] = useState("");

    const saveDialogRef = useRef<HTMLDialogElement>(null);
    const isExistingName = useMemo(() => storedPresets.some(data => data.name === saveName), [saveName, storedPresets])

    const handleSave = async (): Promise<void> => {
        if (saveName.length === 0) return;

        await saveStoredPreset(props.patterns, props.timelineRows, saveName, props.bpm);

        saveDialogRef.current?.close();
    }

    const handleSaveDialogClose = () => {
        saveDialogRef.current?.close();
    }

    return (
        <>
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
        </>
    )
}

export default SaveDialog;