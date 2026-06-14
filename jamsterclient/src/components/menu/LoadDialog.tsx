import { useRef } from "react";
import { useJamsterContext } from "../../Context";
import type { PatternData, StoredBeat, TimelineRowData } from "../../types";
import { loadPatterns } from "../../helpers/load";

interface LoadDialogProps {
    patterns: PatternData[];
    timelineRows: TimelineRowData[];
    onStoreLoaded: (patterns: PatternData[], timelineRows: TimelineRowData[], bpm: number) => void;
}

const LoadDialog = (props: LoadDialogProps) => {
    const { audioContext, analyserNode, storedSamples, storedBeats, deleteStoredBeat, setBeatName } = useJamsterContext();
    const loadDialogRef = useRef<HTMLDialogElement>(null);

    const handleLoad = async (storedBeat: StoredBeat): Promise<void> => {
        const patterns = await loadPatterns(audioContext, analyserNode, storedBeat.patterns, storedSamples);
        const timelines = storedBeat.timelineRows.map((timeline, index) => ({
            index: index,
            slots: timeline.slots
        }));

        props.onStoreLoaded(patterns, timelines, storedBeat.bpm);
        setBeatName(storedBeat.name)
        
        loadDialogRef.current?.close();
    }

    const handleLoadDialogClose = () => {
        loadDialogRef.current?.close();
    }

    const handleDeleteStoredBeat = async (beatName: string) => {
        await deleteStoredBeat(beatName);
    }

    return (
        <>
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
                    {storedBeats.length > 0 ? storedBeats.map((beat, index) => (
                        <div key={`load-stored-beat-${index}`} className="dialog-row">
                            <button className="btn delete" type="button" onClick={() => handleDeleteStoredBeat(beat.name)}>-</button>
                            <button
                                className="dialog-field"
                                type="button"
                                onClick={() => void handleLoad(beat)}
                            >
                                {beat.name}
                            </button>
                        </div>
                    )) : (
                        <p className="dialog-hint">No saved beats yet.</p>
                    )}
                </div>
            </dialog>
        </>
    )
}

export default LoadDialog;