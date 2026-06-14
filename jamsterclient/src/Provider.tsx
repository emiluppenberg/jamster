import { useCallback, useState, type PropsWithChildren } from "react"
import { eq_fftSize } from "./utils";
import {
    deleteBeat,
    deleteSampleArrayBuffer,
    deleteSampleMcpDescription,
    getAllSamplesArrayBuffers,
    getAllSamplesMcpDescriptions,
    getAllBeats,
    saveSampleArrayBuffer,
    saveSampleMcpDescription
} from "./helpers/db";
import type { PatternData, StoredBeat, StoredSample, StoredSampleArrayBuffer, StoredSampleMcpDescription, TimelineRowData } from "./types";
import { storeBeat } from "./helpers/save";
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
const initialStoredBeats = await getAllBeats();
const initialStoredSamples = await constructStoredSamples();

analyserNode.fftSize = eq_fftSize;
analyserNode.connect(audioContext.destination);

export const JamsterProvider = ({ children }: PropsWithChildren) => {
    const [storedBeats, setStoredBeats] = useState<StoredBeat[]>(initialStoredBeats);
    const [storedSamples, setStoredSamples] = useState<StoredSample[]>(initialStoredSamples);
    const [beatName, setBeatName] = useState<string>("New beat")

    const refreshStoredBeats = useCallback(async () => {
        setStoredBeats(await getAllBeats());
    }, []);

    const refreshStoredSamples = useCallback(async () => {
        setStoredSamples(await constructStoredSamples());
    }, [])

    const saveStoredBeat = useCallback(async (patterns: PatternData[], timelineRows: TimelineRowData[], beatName: string, bpm: number) => {
        await storeBeat(patterns, timelineRows, beatName, bpm)
        await refreshStoredBeats();
    }, []);

    const saveStoredSampleArrayBuffer = useCallback(async (sample: StoredSampleArrayBuffer) => {
        await saveSampleArrayBuffer(sample)
        await refreshStoredSamples();
    }, [])

    const saveStoredSampleMcpDescription = useCallback(async (sample: StoredSampleMcpDescription) => {
        await saveSampleMcpDescription(sample)
        await refreshStoredSamples();
    }, [])

    const deleteStoredBeat = useCallback(async (beatName: string) => {
        await deleteBeat(beatName)
        await refreshStoredBeats();
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
            storedBeats,
            storedSamples,
            beatName,
            setBeatName,
            saveStoredBeat,
            saveStoredSampleArrayBuffer,
            saveStoredSampleMcpDescription,
            deleteStoredBeat,
            deleteStoredSample
        }}>
            {children}
        </JamsterContext>
    )
}
