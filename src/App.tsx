import { useEffect, useRef, useState } from 'react';
import './App.css'
import Figure from './components/Figure'
import { JamsterProvider, useJamsterContext } from './Context'
import type { FigureData, MeasureData, PatternData } from './types';
import hihat1Url from './assets/hihat1.wav';
import kick1Url from './assets/kick1.wav';
import snare1Url from './assets/snare1.wav';

const defaultNumberOfMeasures = 4;
const exampleNumberOfMeasures = 2;
const defaultBpm = 120;
const beatsPerMeasure = 4;
const positionsPerMeasure = 64;
const schedulerIntervalMs = 25;
const scheduleAheadSeconds = 0.1;
const startDelaySeconds = 0.05;

const getPositionDurationSeconds = (bpm: number) => (
  60 / bpm / (positionsPerMeasure / beatsPerMeasure)
)

const getPlayingMeasureIndex = (cursorTick: number, figure: FigureData) => {
  if (figure.numberOfMeasures <= 0) return undefined;
  return Math.floor(cursorTick / positionsPerMeasure) % figure.numberOfMeasures;
}

const getNotePosition64 = (noteIndex: number, notesPerMeasure: number) => (
  noteIndex * (positionsPerMeasure / notesPerMeasure)
)

const getNoteGain = (value: string) => {
  const gain = Number(value) / 9;
  if (!Number.isFinite(gain)) return 0;
  return Math.max(0, Math.min(1, gain));
}

const examplePatterns = [
  {
    sampleUrl: hihat1Url,
    notesPerMeasure: 16,
    valuePattern: "555-5-5-55-55-5-",
  },
  {
    sampleUrl: kick1Url,
    notesPerMeasure: 8,
    valuePattern: "5--2-5-2",
  },
  {
    sampleUrl: snare1Url,
    notesPerMeasure: 4,
    valuePattern: "-5-5",
  },
];

const AppContainer = () => {
  return (
    <JamsterProvider>
      <AppContent />
    </JamsterProvider>
  )
}

const AppContent = () => {
  const { audioContext } = useJamsterContext();
  const [figures, setFigures] = useState<FigureData[]>([])
  const [bpm, setBpm] = useState(defaultBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cursorTick, setCursorTick] = useState(0);
  const figuresRef = useRef(figures);
  const bpmRef = useRef(bpm);
  const schedulerTimerRef = useRef<number | undefined>(undefined);
  const nextCursorTickRef = useRef(0);
  const nextTickTimeRef = useRef(0);

  useEffect(() => {
    figuresRef.current = figures;
  }, [figures]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    return () => {
      if (schedulerTimerRef.current !== undefined) {
        window.clearInterval(schedulerTimerRef.current);
      }
    }
  }, []);

  const addFigure = () => setFigures((currentFigures) => [
    ...currentFigures,
    {
      index: currentFigures.length,
      numberOfMeasures: defaultNumberOfMeasures,
      patterns: [],
    },
  ])

  const decodeSample = async (sampleUrl: string) => {
    const response = await fetch(sampleUrl);
    const arrayBuffer = await response.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
  }

  const createExampleMeasures = (
    numberOfMeasures: number,
    notesPerMeasure: number,
    valuePattern: string,
  ): MeasureData[] => (
    Array.from({ length: numberOfMeasures }, (_, measureIndex) => ({
      index: measureIndex,
      notes: Array.from({ length: notesPerMeasure }, (_, noteIndex) => {
        const value = valuePattern[measureIndex * notesPerMeasure + noteIndex] ?? "-";

        return {
          index: noteIndex,
          position64: getNotePosition64(noteIndex, notesPerMeasure),
          value: value === "-" ? "" : value,
        };
      }),
    }))
  )

  const createExamplePattern = async (
    index: number,
    sampleUrl: string,
    notesPerMeasure: number,
    valuePattern: string,
  ): Promise<PatternData> => {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    gainNode.connect(audioContext.destination);

    return {
      index,
      gainNode,
      notesPerMeasure,
      measures: createExampleMeasures(exampleNumberOfMeasures, notesPerMeasure, valuePattern),
      sample: await decodeSample(sampleUrl),
    };
  }

  const loadExample = async () => {
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const patterns = await Promise.all(examplePatterns.map((pattern, index) => (
      createExamplePattern(
        index,
        pattern.sampleUrl,
        pattern.notesPerMeasure,
        pattern.valuePattern,
      )
    )));

    setFigures((currentFigures) => [
      ...currentFigures,
      {
        index: currentFigures.length,
        numberOfMeasures: exampleNumberOfMeasures,
        patterns,
      },
    ]);
  }

  const handleFigureChange = (nextFigure: FigureData) => {
    setFigures((currentFigures) => currentFigures.map((figure) => {
      if (figure.index !== nextFigure.index) return figure;
      return nextFigure;
    }));
  }

  const playSample = (sample: AudioBuffer, time: number, destination: AudioNode) => {
    const source = audioContext.createBufferSource();

    source.buffer = sample;
    source.connect(destination);
    source.start(time);
  }

  const scheduleTick = (cursorTick: number, time: number) => {
    const position64 = cursorTick % positionsPerMeasure;

    figuresRef.current.forEach((figure) => {
      const measureIndex = getPlayingMeasureIndex(cursorTick, figure);
      if (measureIndex === undefined) return;

      figure.patterns.forEach((pattern) => {
        const measure = pattern.measures[measureIndex];
        const sample = pattern.sample;
        if (!measure || !sample) return;

        const note = measure.notes.find((note) => note.position64 === position64);
        if (!note) return;

        const gain = getNoteGain(note.value);
        pattern.gainNode.gain.setValueAtTime(gain, time);

        if (gain <= 0) return;
        playSample(sample, time, pattern.gainNode);
      });
    });
  }

  const runScheduler = () => {
    while (nextTickTimeRef.current < audioContext.currentTime + scheduleAheadSeconds) {
      scheduleTick(nextCursorTickRef.current, nextTickTimeRef.current);
      nextCursorTickRef.current += 1;
      nextTickTimeRef.current += getPositionDurationSeconds(bpmRef.current);
    }

    setCursorTick(nextCursorTickRef.current);
  }

  const startPlayback = async () => {
    if (schedulerTimerRef.current !== undefined) return;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    nextCursorTickRef.current = 0;
    nextTickTimeRef.current = audioContext.currentTime + startDelaySeconds;
    setCursorTick(0);
    setIsPlaying(true);
    runScheduler();
    schedulerTimerRef.current = window.setInterval(runScheduler, schedulerIntervalMs);
  }

  const stopPlayback = () => {
    if (schedulerTimerRef.current !== undefined) {
      window.clearInterval(schedulerTimerRef.current);
      schedulerTimerRef.current = undefined;
    }

    nextCursorTickRef.current = 0;
    nextTickTimeRef.current = 0;
    setCursorTick(0);
    setIsPlaying(false);
  }

  const cursorPosition64 = isPlaying ? cursorTick % positionsPerMeasure : undefined;

  return (
    <div className='app'>
      <div className="app-controls">
        <button
          className="btn-default"
          onClick={() => {
            if (isPlaying) {
              stopPlayback();
              return;
            }

            void startPlayback();
          }}
        >
          {isPlaying ? "Stop" : "Play"}
        </button>
        <input
          className="bpm-input"
          type="number"
          min={1}
          value={bpm}
          onChange={(e) => {
            const nextBpm = Number(e.target.value);
            if (!Number.isFinite(nextBpm)) return;
            setBpm(Math.max(1, nextBpm));
          }}
        />
        <button className="btn-default" onClick={addFigure}>Add figure</button>
        <button className="btn-default" onClick={() => void loadExample()}>Load example</button>
      </div>
      {figures.map((figure) => (
        <Figure
          key={figure.index}
          figure={figure}
          playingMeasureIndex={isPlaying ? getPlayingMeasureIndex(cursorTick, figure) : undefined}
          playingPosition64={cursorPosition64}
          onFigureChange={handleFigureChange}
        />
      ))}
    </div>
  )
}

export default AppContainer;
