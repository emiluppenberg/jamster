import { useCallback, useState, type PropsWithChildren } from "react"
import { eq_fftSize } from "./utils";
import {
    deletePreset,
    deleteSampleArrayBuffer,
    deleteSampleMcpDescription,
    getAllSamplesArrayBuffers,
    getAllSamplesMcpDescriptions,
    getPreset,
    saveSampleArrayBuffer,
    saveSampleMcpDescription
} from "./helpers/db";
import type { PatternData, StoredPreset, StoredSample, StoredSampleArrayBuffer, StoredSampleMcpDescription, TimelineRowData } from "./types";
import { storeData } from "./helpers/save";
import { JamsterContext } from "./Context";

const constructStoredSamples = async (): Promise<StoredSample[]> => {
    const [withMcpDescriptions, withArrayBuffers] = await Promise.all([
        getAllSamplesMcpDescriptions(),
        getAllSamplesArrayBuffers()
    ]);
    const descriptionsByFilename = new Map(
        withMcpDescriptions.map((sample) => [sample.sampleFilename, sample.mcpDescription])
    );

    return await Promise.all(withArrayBuffers.map(async (sample) => ({
        ...sample,
        mcpDescription: descriptionsByFilename.get(sample.sampleFilename) ?? "",
        audioBuffer: await audioContext.decodeAudioData(sample.arrayBuffer.slice(0))
    })));
}

const appSessionId = crypto.randomUUID();
const audioContext = new AudioContext();
const analyserNode = audioContext.createAnalyser();
const initialStoredData = await getPreset();
const initialStoredSamples = await constructStoredSamples();

analyserNode.fftSize = eq_fftSize;
analyserNode.connect(audioContext.destination);

export const JamsterProvider = ({ children }: PropsWithChildren) => {
    const [storedData, setStoredData] = useState<StoredPreset[]>(initialStoredData);
    const [storedSamples, setStoredSamples] = useState<StoredSample[]>(initialStoredSamples);

    const refreshStoredData = useCallback(async () => {
        setStoredData(await getPreset());
    }, []);

    const refreshStoredSamples = useCallback(async () => {
        setStoredSamples(await constructStoredSamples());
    }, [])

    const saveStoredData = useCallback(async (patterns: PatternData[], timelineRows: TimelineRowData[], saveName: string) => {
        await storeData(patterns, timelineRows, saveName)
        await refreshStoredData();
    }, []);

    const saveStoredSampleArrayBuffer = useCallback(async (sample: StoredSampleArrayBuffer) => {
        await saveSampleArrayBuffer(sample)
        await refreshStoredSamples();
    }, [])

    const saveStoredSampleMcpDescription = useCallback(async (sample: StoredSampleMcpDescription) => {
        await saveSampleMcpDescription(sample)
        await refreshStoredSamples();
    }, [])

    const deleteStoredData = useCallback(async (dataName: string) => {
        await deletePreset(dataName)
        await refreshStoredData();
    }, [])

    const deleteStoredSample = useCallback(async (sampleFilename: string) => {
        await Promise.all([
            deleteSampleArrayBuffer(sampleFilename),
            deleteSampleMcpDescription(sampleFilename)
        ])
        await refreshStoredSamples();
    }, [])

    return (
        <JamsterContext value={{
            appSessionId,
            audioContext,
            analyserNode,
            storedData,
            storedSamples,
            saveStoredData,
            saveStoredSampleArrayBuffer,
            saveStoredSampleMcpDescription,
            deleteStoredData,
            deleteStoredSample
        }}>
            {children}
        </JamsterContext>
    )
}
