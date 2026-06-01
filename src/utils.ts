import hihat1Url from './assets/hihat1.wav';
import kick1Url from './assets/kick1.wav';
import snare1Url from './assets/snare1.wav';
import hihat2Url from './assets/hihat2.wav';
import kick2Url from './assets/kick2.wav';
import snare2Url from './assets/snare2.wav';
import type { SavedPatternData, SavedTimelineData } from './types';

export const examplePatterns: SavedPatternData[] = [
    {
        rhythms:
            [{
                sampleFileName: hihat1Url,
                notesPerMeasure: 16,
                noteSequences: ["555-5-5-55-55-5-"],
            },
            {
                sampleFileName: kick1Url,
                notesPerMeasure: 8,
                noteSequences: ["5--2-5-2"],
            },
            {
                sampleFileName: snare1Url,
                notesPerMeasure: 4,
                noteSequences: ["-5-5"],
            }],
        name: "Skip-beat"
    },
    {
        rhythms:
            [{
                sampleFileName: hihat2Url,
                notesPerMeasure: 32,
                noteSequences: ["555-555-----5---5-----5-5-----5-"],
            },
            {
                sampleFileName: kick2Url,
                notesPerMeasure: 8,
                noteSequences: ["5----2-2"],
            },
            {
                sampleFileName: snare2Url,
                notesPerMeasure: 16,
                noteSequences: ["----5----2--5---"],
            }],
        name: "Trap-beat"
    }
];

export const exampleTimelines: SavedTimelineData[] = [
    { slots: [0, 0, 1, 1] },
    { slots: [1, 0, 1, 0] }
]

export const eq_fftSize = 512;

export const getViewportWidthRem = () => {
    if (typeof window === "undefined") return 75;

    const rootFontSize = Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
    );

    if (!Number.isFinite(rootFontSize) || rootFontSize <= 0) return 75;
    return window.innerWidth / rootFontSize;
}