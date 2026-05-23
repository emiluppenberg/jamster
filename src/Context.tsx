import { createContext, useContext, type PropsWithChildren } from "react"

export type JamsterState = {
    audioContext: AudioContext;
}

export const audioContext = new AudioContext();

export const JamsterContext = createContext<JamsterState>({ audioContext: audioContext });

export const JamsterProvider = ({ children }: PropsWithChildren) => {
    return <JamsterContext value={{ audioContext: audioContext }}>{children}</JamsterContext>
}

export const useJamsterContext = () => useContext(JamsterContext);