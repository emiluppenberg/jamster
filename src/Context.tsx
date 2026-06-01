import { createContext, useContext, type PropsWithChildren } from "react"
import { eq_fftSize } from "./utils";

export type JamsterState = {
    audioContext: AudioContext;
    analyserNode: AnalyserNode;
}

const audioContext = new AudioContext();
const analyserNode = audioContext.createAnalyser();
analyserNode.fftSize = eq_fftSize;
analyserNode.connect(audioContext.destination);

export const JamsterContext = createContext<JamsterState>({ audioContext: audioContext, analyserNode: analyserNode });

export const JamsterProvider = ({ children }: PropsWithChildren) => {
    return <JamsterContext value={{ audioContext: audioContext, analyserNode: analyserNode }}>{children}</JamsterContext>
}

export const useJamsterContext = () => useContext(JamsterContext);