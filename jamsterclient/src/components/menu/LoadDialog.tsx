import { useCallback, useEffect, useRef } from "react";
import { useJamsterContext } from "../../Context";
import type { PatternData, StoredBeat, TimelineRowData } from "../../types";
import { loadPatterns, loadTimelineRows } from "../../helpers/load";

interface LoadDialogProps {
    onStoreLoaded: (patterns: PatternData[], timelineRows: TimelineRowData[], bpm: number) => void;
}

const LoadDialog = (props: LoadDialogProps) => {
    const { onStoreLoaded } = props;
    const { audioContext, analyserNode, storedSamples, storedBeats, deleteStoredBeat, setBeatName } = useJamsterContext();
    const loadDialogRef = useRef<HTMLDialogElement>(null);
    const initializedRef = useRef(false)

    const handleLoad = useCallback(async (storedBeat: StoredBeat): Promise<void> => {
        const patterns = await loadPatterns(audioContext, analyserNode, storedBeat.patterns, storedSamples);
        const timelines = loadTimelineRows(storedBeat.timelineRows, patterns);

        onStoreLoaded(patterns, timelines, storedBeat.bpm);
        setBeatName(storedBeat.name)

        loadDialogRef.current?.close();
    }, [audioContext, analyserNode, storedSamples, onStoreLoaded, setBeatName])

    const handleLoadDialogClose = () => {
        loadDialogRef.current?.close();
    }

    const handleDeleteStoredBeat = async (beatName: string) => {
        await deleteStoredBeat(beatName);
    }

    useEffect(() => {
        if (initializedRef.current) return
        
        initializedRef.current = true
        
        const initialBeat = storedBeats[0]
        if (!initialBeat) return

        void handleLoad(initialBeat)
    }, [storedBeats, handleLoad])

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
