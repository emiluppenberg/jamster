import type { ChangeEvent } from "react";
import { useJamsterContext } from "../Context";

export interface SampleInputProps {
    setSample: (sample: AudioBuffer) => void;
}

const SampleInput = (props: SampleInputProps) => {
    const context = useJamsterContext();

    const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await context.audioContext.decodeAudioData(arrayBuffer); 
        props.setSample(audioBuffer);
    }
    return (
        <input
            className="sample-input"
            type="file"
            accept="audio/*"
            onChange={(e) => handleChange(e)}
        />
    )
}

export default SampleInput;
