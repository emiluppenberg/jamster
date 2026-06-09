import { useCallback, useState, type PropsWithChildren } from "react"
import { eq_fftSize } from "./utils";
import { deleteData, deleteSample, getAllSamples, getData, saveSample } from "./helpers/db";
import type { PatternData, StoredData, StoredSample, TimelineRowData } from "./types";
import { storeData } from "./helpers/save";
import { JamsterContext } from "./Context";

const decodeStoredSamples = async () => {
    return await getAllSamples().then(async (samples) =>
        await Promise.all(samples.map(async (sample) =>
            ({ ...sample, audioBuffer: await audioContext.decodeAudioData(sample.arrayBuffer.slice(0)) }))));
}
const appSessionId = crypto.randomUUID();
const audioContext = new AudioContext();
const analyserNode = audioContext.createAnalyser();
const initialStoredData = await getData();
const initialStoredSamples = await decodeStoredSamples();

analyserNode.fftSize = eq_fftSize;
analyserNode.connect(audioContext.destination);

export const JamsterProvider = ({ children }: PropsWithChildren) => {
    const [storedData, setStoredData] = useState<StoredData[]>(initialStoredData);
    const [storedSamples, setStoredSamples] = useState<StoredSample[]>(initialStoredSamples);

    const refreshStoredData = useCallback(async () => {
        setStoredData(await getData());
    }, []);

    const refreshStoredSamples = useCallback(async () => {
        setStoredSamples(await decodeStoredSamples());
    }, [])

    const saveStoredData = useCallback(async (patterns: PatternData[], timelineRows: TimelineRowData[], saveName: string) => {
        const saved = await storeData(patterns, timelineRows, saveName);

        setStoredData((current) => [
            saved,
            ...current.filter((item) => item.name !== saved.name),
        ]);
    }, []);

    const saveStoredSample = useCallback(async (sample: StoredSample) => {
        await saveSample(sample)
        setStoredSamples((current) => [
            sample,
            ...current.filter((storedSample) => storedSample.sampleFilename !== sample.sampleFilename)
        ])
    }, [])

    const deleteStoredData = useCallback(async (dataName: string) => {
        await deleteData(dataName)

        setStoredData((current) => current.filter((data) => data.name !== dataName))
    }, [])

    const deleteStoredSample = useCallback(async (sampleFilename: string) => {
        await deleteSample(sampleFilename)

        setStoredSamples((current) => current.filter((sample) => sample.sampleFilename !== sampleFilename))
    }, [])

    return (
        <JamsterContext value={{
            appSessionId,
            audioContext,
            analyserNode,
            storedData,
            storedSamples,
            refreshStoredData,
            refreshStoredSamples,
            saveStoredData,
            saveStoredSample,
            deleteStoredData,
            deleteStoredSample
        }}>
            {children}
        </JamsterContext>
    )
}
