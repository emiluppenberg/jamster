import { useCallback, useState, type PropsWithChildren } from "react"
import { eq_fftSize } from "./utils";
import { deleteData, deleteSample, getAllSamples, getData, saveSample } from "./helpers/db";
import type { PatternData, SampleData, StoredData, StoredSample, TimelineRowData } from "./types";
import { storeData } from "./helpers/save";
import { JamsterContext } from "./Context";

const appSessionId = crypto.randomUUID();
const audioContext = new AudioContext();
const analyserNode = audioContext.createAnalyser();
const initialStoredData = await getData();
const initialStoredSamples = await getAllSamples();;
const initialSamples = await Promise.all(initialStoredSamples.map(async (sample) => ({
    audioBuffer: await audioContext.decodeAudioData(sample.arrayBuffer.slice(0)),
    sampleFilename: sample.sampleFilename
})));

analyserNode.fftSize = eq_fftSize;
analyserNode.connect(audioContext.destination);

export const JamsterProvider = ({ children }: PropsWithChildren) => {
    const [storedData, setStoredData] = useState<StoredData[]>(initialStoredData);
    const [storedSamples, setStoredSamples] = useState<StoredSample[]>(initialStoredSamples);
    const [samples, setSamples] = useState<SampleData[]>(initialSamples);

    const refreshStoredData = useCallback(async () => {
        setStoredData(await getData());
    }, []);

    const refreshStoredSamples = useCallback(async () => {
        setStoredSamples(await getAllSamples());
    }, [])

    const refreshSamples = useCallback(async () => {
        const latestStoredSamples = await getAllSamples();
        const sampleData: SampleData[] = await Promise.all(latestStoredSamples.map(async (sample) => ({
            audioBuffer: await audioContext.decodeAudioData(sample.arrayBuffer.slice(0)),
            sampleFilename: sample.sampleFilename
        })));

        setSamples(sampleData)
    }, [])

    const saveStoredData = useCallback(async (patterns: PatternData[], timelineRows: TimelineRowData[], saveName: string) => {
        const saved = await storeData(patterns, timelineRows, saveName);

        setStoredData((current) => [
            saved,
            ...current.filter((item) => item.name !== saved.name),
        ]);
    }, []);

    const deleteStoredData = useCallback(async (dataName: string) => {
        await deleteData(dataName)

        setStoredData((current) => current.filter((data) => data.name !== dataName))
    }, [])

    const saveStoredSample = useCallback(async (sample: StoredSample) => {
        await saveSample(sample)
        setStoredSamples((current) => [
            sample,
            ...current.filter((storedSample) => storedSample.sampleFilename !== sample.sampleFilename)
        ])
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
            samples,
            refreshStoredData,
            refreshStoredSamples,
            refreshSamples,
            saveStoredData,
            saveStoredSample,
            deleteStoredData,
            deleteStoredSample
        }}>
            {children}
        </JamsterContext>
    )
}
