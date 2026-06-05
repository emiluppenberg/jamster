import hihat1Url from './assets/hihat1.wav';
import kick1Url from './assets/kick1.wav';
import snare1Url from './assets/snare1.wav';
import hihat2Url from './assets/hihat2.wav';
import kick2Url from './assets/kick2.wav';
import snare2Url from './assets/snare2.wav';
import type { StoredData, StoredPatternData, StoredTimelineRowData } from './types';

export const examplePatterns: StoredPatternData[] = [
    {
        index: 0,
        rhythms:
            [{
                index: 0,
                sampleFileName: hihat1Url,
                notesPerMeasure: 16,
                measures: [
                    {
                        index: 0,
                        noteSequence: "555-5-5-55-55-5-"
                    }
                ],
            },
            {
                index: 1,
                sampleFileName: kick1Url,
                notesPerMeasure: 8,
                measures: [
                    {
                        index: 0,
                        noteSequence: "5--2-5-2"
                    }
                ],
            },
            {
                index: 2,
                sampleFileName: snare1Url,
                notesPerMeasure: 4,
                measures: [
                    {
                        index: 0,
                        noteSequence: "-5-5"
                    }
                ],
            }],
        name: "Skip-beat"
    },
    {
        index: 1,
        rhythms:
            [{
                index: 0,
                sampleFileName: hihat2Url,
                notesPerMeasure: 32,
                measures: [
                    {
                        index: 0,
                        noteSequence: "555-555-----5---5-----5-5-----5-"
                    }
                ],
            },
            {
                index: 1,
                sampleFileName: kick2Url,
                notesPerMeasure: 8,
                measures: [
                    {
                        index: 0,
                        noteSequence: "5----2-2"
                    }
                ],
            },
            {
                index: 2,
                sampleFileName: snare2Url,
                notesPerMeasure: 16,
                measures: [
                    {
                        index: 0,
                        noteSequence: "----5----2--5---"
                    }
                ],
            }],
        name: "Trap-beat"
    }
];

export const exampleTimelines: StoredTimelineRowData[] = [
    { slots: [0, 0, 1, 1] },
    { slots: [1, 0, 1, 0] }
]

export const exampleData: StoredData = {
    name: "example",
    timelineRows: exampleTimelines,
    patterns: examplePatterns
}

export const eq_fftSize = 1024;
export const wssUrl = "ws://localhost:8000"

export const getViewportWidthRem = () => {
    if (typeof window === "undefined") return 75;

    const rootFontSize = Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
    );

    if (!Number.isFinite(rootFontSize) || rootFontSize <= 0) return 75;
    return window.innerWidth / rootFontSize;
}