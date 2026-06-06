import { useRef, type ChangeEvent } from "react";
import { useJamsterContext } from "../Context";
import type { StoredSample } from "../types";

export interface SampleInputProps {
    setSample: (sample: AudioBuffer, fileName: string) => void;
    sampleFileName: string;
}

const SampleInput = (props: SampleInputProps) => {
    const { audioContext, storedSamples, saveStoredSample, deleteStoredSample, refreshStoredSamples } = useJamsterContext();
    const sampleDialogRef = useRef<HTMLDialogElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleStoredSampleLoad = async (storedSample: StoredSample): Promise<void> => {
        const audioBuffer = await audioContext.decodeAudioData(storedSample.arrayBuffer.slice(0));

        props.setSample(audioBuffer, storedSample.sampleFilename);
        sampleDialogRef.current?.close();
    }

    const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        let audioBuffer: AudioBuffer;
        const storedSample = storedSamples.find((stored) => stored.sampleFilename === file.name)

        if (storedSample) {
            audioBuffer = await audioContext.decodeAudioData(storedSample.arrayBuffer.slice(0));
        } else {
            const arrayBuffer = await file.arrayBuffer();
            await saveStoredSample({ sampleFilename: file.name, arrayBuffer: arrayBuffer, })
            await refreshStoredSamples();
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        }

        props.setSample(audioBuffer, file.name);
        sampleDialogRef.current?.close();
        e.target.value = "";
    }

    const handleDialogClose = () => {
        sampleDialogRef.current?.close();
    }

    const handleFileSampleClick = () => {
        fileInputRef.current?.click();
    }

    const handleDeleteStoredSample = async (sampleFilename: string) => {
        await deleteStoredSample(sampleFilename);
        await refreshStoredSamples();
    }

    return (
        <>
            <button className="btn load-sample" type="button" onClick={() => sampleDialogRef.current?.showModal()}>
                {props.sampleFileName.length > 0 ? props.sampleFileName : "No sample"}
            </button>
            <dialog className="load-dialog" ref={sampleDialogRef} >
                <div className="dialog-header">
                    <div>
                        <h2 className="dialog-eyebrow">Load sample</h2>
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
                        onChange={(e) => void handleChange(e)}
                    />
                    {storedSamples.length > 0 ? storedSamples.map((sample) => (
                        <div key={sample.sampleFilename} className="dialog-row">
                            <button className="btn delete" type="button" onClick={() => handleDeleteStoredSample(sample.sampleFilename)}>-</button>
                            <button
                                className="dialog-field"
                                type="button"
                                onClick={() => void handleStoredSampleLoad(sample)}
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

export default SampleInput;
