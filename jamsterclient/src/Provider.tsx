import { useCallback, useState, type PropsWithChildren } from "react"
import { eq_fftSize } from "./utils";
import {
    deletePreset,
    deleteSampleArrayBuffer,
    deleteSampleMcpDescription,
    getAllSamplesArrayBuffers,
    getAllSamplesMcpDescriptions,
    getPresets,
    saveSampleArrayBuffer,
    saveSampleMcpDescription
} from "./helpers/db";
import type { PatternData, StoredPreset, StoredSample, StoredSampleArrayBuffer, StoredSampleMcpDescription, TimelineRowData } from "./types";
import { storePreset } from "./helpers/save";
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
const initialStoredPresets = await getPresets();
const initialStoredSamples = await constructStoredSamples();

analyserNode.fftSize = eq_fftSize;
analyserNode.connect(audioContext.destination);

export const JamsterProvider = ({ children }: PropsWithChildren) => {
    const [storedPresets, setStoredPresets] = useState<StoredPreset[]>(initialStoredPresets);
    const [storedSamples, setStoredSamples] = useState<StoredSample[]>(initialStoredSamples);

    const refreshStoredPresets = useCallback(async () => {
        setStoredPresets(await getPresets());
    }, []);

    const refreshStoredSamples = useCallback(async () => {
        setStoredSamples(await constructStoredSamples());
    }, [])

    const saveStoredPreset = useCallback(async (patterns: PatternData[], timelineRows: TimelineRowData[], saveName: string, bpm: number) => {
        await storePreset(patterns, timelineRows, saveName, bpm)
        await refreshStoredPresets();
    }, []);

    const saveStoredSampleArrayBuffer = useCallback(async (sample: StoredSampleArrayBuffer) => {
        await saveSampleArrayBuffer(sample)
        await refreshStoredSamples();
    }, [])

    const saveStoredSampleMcpDescription = useCallback(async (sample: StoredSampleMcpDescription) => {
        await saveSampleMcpDescription(sample)
        await refreshStoredSamples();
    }, [])

    const deleteStoredPreset = useCallback(async (dataName: string) => {
        await deletePreset(dataName)
        await refreshStoredPresets();
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
            storedPresets: storedPresets,
            storedSamples,
            saveStoredPreset,
            saveStoredSampleArrayBuffer,
            saveStoredSampleMcpDescription,
            deleteStoredPreset,
            deleteStoredSample
        }}>
            {children}
        </JamsterContext>
    )
}
