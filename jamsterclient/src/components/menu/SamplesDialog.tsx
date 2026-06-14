import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useJamsterContext } from "../../Context";
import type { StoredSample, StoredSampleMcpDescription } from "../../types";

interface SamplesDialogProps {
    onPlaySample: (sample: AudioBuffer, destination: AudioNode, time: number) => void;
}

const SamplesDialog = (props: SamplesDialogProps) => {
    const { audioContext, analyserNode, storedSamples, saveStoredSampleArrayBuffer, saveStoredSampleMcpDescription, deleteStoredSample } = useJamsterContext();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [gainNode] = useState(audioContext.createGain())
    const [initialized, setInitialized] = useState(false);
    const [saveMcpDescriptions, setSaveMcpDescriptions] = useState<StoredSampleMcpDescription[]>([])

    useEffect(() => {
        if (initialized) return;

        gainNode.connect(analyserNode);
        setInitialized(true);
    })

    const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isStored = storedSamples.some((stored) => stored.sampleFilename === file.name)

        if (!isStored) {
            const arrayBuffer = await file.arrayBuffer();
            await saveStoredSampleArrayBuffer({ sampleFilename: file.name, arrayBuffer: arrayBuffer })
            e.target.value = "";
        }
    }

    const handleDialogClose = async () => {
        await executeSaveMcpDescriptions();
        dialogRef.current?.close();
    }

    const handleFileSampleClick = () => {
        fileInputRef.current?.click();
    }

    const handleDeleteStoredSample = async (sampleFilename: string) => {
        await deleteStoredSample(sampleFilename);
    }

    const handleChangeMcpDescription = (e: ChangeEvent<HTMLInputElement>, sample: StoredSample) => {
        setSaveMcpDescriptions(current => [
            ...current.filter(currentSample => currentSample.sampleFilename !== sample.sampleFilename),
            { sampleFilename: sample.sampleFilename, mcpDescription: e.target.value },
        ]);
    }

    const executeSaveMcpDescriptions = async () => {
        saveMcpDescriptions.forEach(async (sample) => await saveStoredSampleMcpDescription(sample))
        setSaveMcpDescriptions([]);
    }

    return (
        <>
            <button className="btn" type="button" onClick={() => dialogRef.current?.showModal()}>Samples</button>
            <dialog className="load-dialog" ref={dialogRef} onClose={executeSaveMcpDescriptions}>
                <div className="dialog-header">
                    <div>
                        <h2 className="dialog-eyebrow">Manage samples</h2>
                    </div>
                    {saveMcpDescriptions.length > 0 && (
                        <p className="dialog-hint">Changes will be saved when closing dialog</p>
                    )}
                    <button className="btn dialog-close" type="button" onClick={handleDialogClose}>
                        X
                    </button>
                </div>
                <div className="dialog-list">
                    <button className="dialog-field file-sample" type="button" onClick={handleFileSampleClick}>
                        Upload file
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={(e) => void handleUpload(e)}
                    />
                    <div className="dialog-row dialog-column-labels">
                        <label>Filename</label>
                        <label>Describe to MCP</label>
                    </div>
                    {storedSamples.length > 0 ? storedSamples.map((sample) => (
                        <div key={sample.sampleFilename} className="dialog-row">
                            <button className="btn delete" type="button" onClick={() => handleDeleteStoredSample(sample.sampleFilename)}>-</button>
                            <button
                                className="dialog-field filename"
                                type="button"
                                onClick={() => sample.audioBuffer && props.onPlaySample(sample.audioBuffer, gainNode, audioContext.currentTime)}
                            >
                                {sample.sampleFilename}
                            </button>
                            <input
                                type="text"
                                className="dialog-field mcp-description"
                                defaultValue={sample.mcpDescription}
                                placeholder="MCP Description"
                                onChange={(e) => handleChangeMcpDescription(e, sample)}
                            />
                        </div>
                    )) : (
                        <p className="dialog-hint">No saved samples yet.</p>
                    )}
                </div>
            </dialog>
        </>
    )
}

export default SamplesDialog;
