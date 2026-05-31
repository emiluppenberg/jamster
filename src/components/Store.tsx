import { useJamsterContext } from "../Context";
import type { MeasureData, PatternData, RhythmData, SavedPatternData } from "../types";
import hihat1Url from '../assets/hihat1.wav';
import kick1Url from '../assets/kick1.wav';
import snare1Url from '../assets/snare1.wav';
import hihat2Url from '../assets/hihat2.wav';
import kick2Url from '../assets/kick2.wav';
import snare2Url from '../assets/snare2.wav';
import { useState } from "react";

const examplePatterns: SavedPatternData[] = [
    {
        rhythms:
            [{
                sampleUrl: hihat1Url,
                notesPerMeasure: 16,
                noteSequences: ["555-5-5-55-55-5-"],
            },
            {
                sampleUrl: kick1Url,
                notesPerMeasure: 8,
                noteSequences: ["5--2-5-2"],
            },
            {
                sampleUrl: snare1Url,
                notesPerMeasure: 4,
                noteSequences: ["-5-5"],
            }],
        name: "Skip-beat"
    },
    {
        rhythms:
            [{
                sampleUrl: hihat2Url,
                notesPerMeasure: 32,
                noteSequences: ["555-555-----5---5-----5-5-----5-"],
            },
            {
                sampleUrl: kick2Url,
                notesPerMeasure: 8,
                noteSequences: ["5----2-2"],
            },
            {
                sampleUrl: snare2Url,
                notesPerMeasure: 16,
                noteSequences: ["----5----2--5---"],
            }],
        name: "Trap-beat"
    }
];

export interface StoreProps {
    onStoreLoaded: (patterns: PatternData[]) => void;
}

const Store = (props: StoreProps) => {
    const { audioContext } = useJamsterContext();
    const [patternData, setPatternData] = useState(examplePatterns);
    const getNotePosition64 = (noteIndex: number, notesPerMeasure: number) => (
        noteIndex * (64 / notesPerMeasure)
    )

    const decodeSample = async (sampleUrl: string) => {
        const response = await fetch(sampleUrl);
        const arrayBuffer = await response.arrayBuffer();
        return audioContext.decodeAudioData(arrayBuffer);
    }

    const loadMeasures = (
        notesPerMeasure: number,
        noteSequences: string[],
    ): MeasureData[] => (
        Array.from({ length: noteSequences.length }, (_, measureIndex) => ({
            index: measureIndex,
            notes: Array.from({ length: notesPerMeasure }, (_, noteIndex) => {
                const value = noteSequences[measureIndex][noteIndex] ?? "-";

                return {
                    index: noteIndex,
                    position64: getNotePosition64(noteIndex, notesPerMeasure),
                    value: value === "-" ? "" : value,
                };
            }),
        }))
    )

    const loadRhythm = async (
        index: number,
        sampleUrl: string,
        notesPerMeasure: number,
        noteSequences: string[],
    ): Promise<RhythmData> => {
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(audioContext.destination);

        return {
            index,
            gainNode,
            notesPerMeasure,
            measures: loadMeasures(notesPerMeasure, noteSequences),
            sample: await decodeSample(sampleUrl),
        };
    }

    const handleLoadPatterns = async (): Promise<void> => {
        props.onStoreLoaded(await Promise.all(patternData.map(async (pattern, index) => ({
            index: index,
            numberOfMeasures: Math.max(1, ...pattern.rhythms.map(r => r.noteSequences.length)),
            rhythms: await Promise.all(pattern.rhythms.map((rhythm, index) =>
                loadRhythm(
                    index,
                    rhythm.sampleUrl,
                    rhythm.notesPerMeasure,
                    rhythm.noteSequences,
                )
            )),
            name: pattern.name
        }))));
    }

    return (
        <div className="store">
            <button className="btn" onClick={handleLoadPatterns}>
                Load
            </button>
        </div>
    )
}

export default Store;
