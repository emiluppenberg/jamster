import { useRef, useState, type ChangeEvent } from "react";
import { useJamsterContext } from "../Context";
import type { RhythmData, StoredSample, StoredSampleMcpDescription } from "../types";

export interface RhythmSampleDialogProps {
    setSample: (sample: AudioBuffer, fileName: string) => void;
    sampleFileName: string;
    rhythm: RhythmData;
}

const RhythmSampleDialog = (props: RhythmSampleDialogProps) => {
    const { audioContext, storedSamples, saveStoredSampleArrayBuffer, saveStoredSampleMcpDescription, deleteStoredSample } = useJamsterContext();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedSampleFilename, setSelectedSampleFilename] = useState(props.sampleFileName)
    const [saveMcpDescriptions, setSaveMcpDescriptions] = useState<StoredSampleMcpDescription[]>([])

    const handleStoredSampleLoad = async (storedSample: StoredSample): Promise<void> => {
        props.setSample(storedSample.audioBuffer, storedSample.sampleFilename);
        setSelectedSampleFilename(storedSample.sampleFilename);
    }

    const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const storedSample = storedSamples.find((stored) => stored.sampleFilename === file.name)

        if (!storedSample) {
            const arrayBuffer = await file.arrayBuffer();
            await saveStoredSampleArrayBuffer({ sampleFilename: file.name, arrayBuffer: arrayBuffer })
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
            props.setSample(audioBuffer, file.name);
            setSelectedSampleFilename(file.name)
            e.target.value = "";
            return;
        }

        props.setSample(storedSample.audioBuffer, file.name);
        setSelectedSampleFilename(file.name)
        e.target.value = "";
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
            <button className="btn load-sample" type="button" onClick={() => dialogRef.current?.showModal()}>
                {props.sampleFileName.length > 0 ? props.sampleFileName : "No sample"}
            </button>
            <dialog className="load-dialog" ref={dialogRef} onClose={executeSaveMcpDescriptions}>
                <div className="dialog-header">
                    <div>
                        <h2 className="dialog-eyebrow">{props.rhythm.name} sample</h2>
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
                        onChange={(e) => void handleChange(e)}
                    />
                    <div className="dialog-row dialog-column-labels">
                        <label>Filename</label>
                        <label>Describe to MCP</label>
                    </div>
                    {storedSamples.length > 0 ? storedSamples.map((sample) => (
                        <div key={sample.sampleFilename} className="dialog-row">
                            <button className="btn delete" type="button" onClick={() => handleDeleteStoredSample(sample.sampleFilename)}>-</button>
                            <button
                                className={`dialog-field filename ${selectedSampleFilename === sample.sampleFilename ? "selected-sample" : ""}`}
                                type="button"
                                onClick={() => void handleStoredSampleLoad(sample)}
                            >
                                {sample.sampleFilename}
                            </button>
                            <input
                                type="text"
                                className={`dialog-field ${selectedSampleFilename === sample.sampleFilename ? "selected-sample" : ""} mcp-description`}
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

export default RhythmSampleDialog;
