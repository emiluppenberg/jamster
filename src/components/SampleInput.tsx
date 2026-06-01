import type { ChangeEvent } from "react";
import { useJamsterContext } from "../Context";
import { getSample, saveSample } from "../helpers/db";

export interface SampleInputProps {
    setSample: (sample: AudioBuffer, fileName: string) => void;
}

const SampleInput = (props: SampleInputProps) => {
    const { audioContext } = useJamsterContext();

    const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        let audioBuffer: AudioBuffer;
        const storedSample = await getSample(file.name);

        if (storedSample) {
            audioBuffer = await audioContext.decodeAudioData(storedSample.arrayBuffer);
        } else {
            const arrayBuffer = await file.arrayBuffer();
            await saveSample({ sampleFileName: file.name, arrayBuffer: arrayBuffer, })
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        }

        props.setSample(audioBuffer, file.name);
    }
    return (
        <label className="sample-input">
            Load sample
            <input
                type="file"
                accept="audio/*"
                onChange={(e) => handleChange(e)}
            />
        </label>
    )
}

export default SampleInput;
