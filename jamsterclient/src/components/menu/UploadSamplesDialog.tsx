import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useJamsterContext } from "../../Context";

interface UploadSamplesDialogProps {
    onPlaySample: (sample: AudioBuffer, time: number, destination: AudioNode) => void;
}

const UploadSamplesDialog = (props: UploadSamplesDialogProps) => {
    const { audioContext, analyserNode, samples, saveStoredSample, deleteStoredSample, refreshStoredSamples, refreshSamples } = useJamsterContext();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [gainNode] = useState(audioContext.createGain())
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (initialized) return;

        gainNode.connect(analyserNode);
        setInitialized(true);
    })

    const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isStored = samples.some((stored) => stored.sampleFilename === file.name)

        if (isStored) {
            return;
        } else {
            const arrayBuffer = await file.arrayBuffer();
            await saveStoredSample({ sampleFilename: file.name, arrayBuffer: arrayBuffer, })
            await refreshStoredSamples();
            await refreshSamples();
        }

        e.target.value = "";
    }

    const handleDialogClose = () => {
        dialogRef.current?.close();
    }

    const handleFileSampleClick = () => {
        fileInputRef.current?.click();
    }

    const handleDeleteStoredSample = async (sampleFilename: string) => {
        await deleteStoredSample(sampleFilename);
        await refreshStoredSamples();
        await refreshSamples();
    }

    return (
        <>
            <button className="btn" type="button" onClick={() => dialogRef.current?.showModal()}>Upload samples</button>
            <dialog className="load-dialog" ref={dialogRef} >
                <div className="dialog-header">
                    <div>
                        <h2 className="dialog-eyebrow">Upload samples</h2>
                    </div>
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
                    {samples.length > 0 ? samples.map((sample) => (
                        <div key={sample.sampleFilename} className="dialog-row">
                            <button className="btn delete" type="button" onClick={() => handleDeleteStoredSample(sample.sampleFilename)}>-</button>
                            <button
                                className="dialog-field"
                                type="button"
                                onClick={() => props.onPlaySample(sample.audioBuffer, audioContext.currentTime, gainNode)}
                            >
                                {sample.sampleFilename}
                            </button>
                        </div>
                    )) : (
                        <p className="dialog-hint">No saved samples yet.</p>
                    )}
                </div>
            </dialog>
        </>
    )
}

export default UploadSamplesDialog;