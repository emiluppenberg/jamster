import { useState } from 'react';
import './App.css'
import Figure from './components/Figure'
import Playback from './components/Playback';
import { JamsterProvider, useJamsterContext } from './Context'
import type { FigureData, MeasureData, PatternData, Track } from './types';
import hihat1Url from './assets/hihat1.wav';
import kick1Url from './assets/kick1.wav';
import snare1Url from './assets/snare1.wav';
import hihat2Url from './assets/hihat2.wav';
import kick2Url from './assets/kick2.wav';
import snare2Url from './assets/snare2.wav';
import Tracker from './components/Tracker';

const defaultNumberOfMeasures = 4;
const exampleNumberOfMeasures = 1;
const positionsPerMeasure = 64;

const getNotePosition64 = (noteIndex: number, notesPerMeasure: number) => (
  noteIndex * (positionsPerMeasure / notesPerMeasure)
)

const examplePatterns = [
  [{
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
  }],
  [{
    sampleUrl: hihat2Url,
    notesPerMeasure: 32,
    valuePattern: "555-555-----5---5-----5-5-----5-",
  },
  {
    sampleUrl: kick2Url,
    notesPerMeasure: 8,
    valuePattern: "5----2-2",
  },
  {
    sampleUrl: snare2Url,
    notesPerMeasure: 16,
    valuePattern: "----5----2--5---",
  }],
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
  const [tracks, setTracks] = useState<Track[]>([])

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

    const patterns = await Promise.all(examplePatterns.map(async (figure) => await Promise.all(
      figure.map((pattern, index) =>
        createExamplePattern(
          index,
          pattern.sampleUrl,
          pattern.notesPerMeasure,
          pattern.valuePattern,
        )
      ))));

    setFigures((currentFigures) => [
      ...currentFigures,
      {
        index: currentFigures.length,
        numberOfMeasures: exampleNumberOfMeasures,
        patterns: patterns[0],
      },
      {
        index: currentFigures.length + 1,
        numberOfMeasures: exampleNumberOfMeasures,
        patterns: patterns[1],
      }
    ]);
  }

  const handleFigureChange = (nextFigure: FigureData) => {
    setFigures((currentFigures) => currentFigures.map((figure) => {
      if (figure.index !== nextFigure.index) return figure;
      return nextFigure;
    }));
  }

  return (
    <div className='app'>
      <Playback figures={figures} tracks={tracks}>
        {({ isPlaying, playingPosition64, getPlayingMeasureIndex, playFigure }) => (
          <>
            <Tracker
              figures={figures}
              tracks={tracks}
              onTracksChange={setTracks}
            />
            <div className="figure-controls">
              <h1>Figures</h1>
              <button className="btn-default" onClick={addFigure}>Add</button>
              <button className="btn-default" onClick={() => void loadExample()}>Load examples</button>
            </div>
            {figures.map((figure) => (
              <Figure
                key={figure.index}
                figure={figure}
                playingMeasureIndex={isPlaying ? getPlayingMeasureIndex(figure) : undefined}
                playingPosition64={playingPosition64}
                onFigureChange={handleFigureChange}
                onPlayFigure={playFigure}
              />
            ))}
          </>
        )}
      </Playback>
    </div>
  )
}

export default AppContainer;
