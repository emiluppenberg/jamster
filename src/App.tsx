import { useState } from 'react';
import './App.css'
import Pattern from './components/Pattern'
import Playback from './components/Playback';
import { JamsterProvider } from './Context'
import type { PatternData, TimelineData } from './types';
import Timeline from './components/Timeline';

const defaultNumberOfMeasures = 4;

const AppContainer = () => {
  return (
    <JamsterProvider>
      <AppContent />
    </JamsterProvider>
  )
}

const AppContent = () => {
  const [patterns, setPatterns] = useState<PatternData[]>([])
  const [timelines, setTimelines] = useState<TimelineData[]>([])
  
  const addPattern = () => setPatterns((currentPatterns) => [
    ...currentPatterns,
    {
      index: currentPatterns.length,
      numberOfMeasures: defaultNumberOfMeasures,
      rhythms: [],
      name: `Pattern ${currentPatterns.length}`
    },
  ])

  const handlePatternChange = (nextPattern: PatternData) => {
    setPatterns((currentPatterns) => currentPatterns.map((pattern) => {
      if (pattern.index !== nextPattern.index) return pattern;
      return nextPattern;
    }));
  }

  const handleStoreLoaded = (patterns: PatternData[]) => {
    setPatterns(patterns);
  }

  return (
    <div className='app'>
      <Playback patterns={patterns} timelines={timelines} onStoreLoaded={handleStoreLoaded}>
        {({ isPlaying, playingPosition64, getPlayingMeasureIndex, playPattern }) => (
          <>
            <Timeline
              patterns={patterns}
              timelines={timelines}
              onTimelinesChange={setTimelines}
            />
            <div className="controls">
              <h1>Patterns</h1>
              <div className="options">
                <button className="btn" onClick={addPattern}>Add</button>
              </div>
            </div>
            <div className="container patterns">
              {patterns.map((pattern) => (
                <Pattern
                  key={pattern.index}
                  pattern={pattern}
                  playingMeasureIndex={isPlaying ? getPlayingMeasureIndex(pattern) : undefined}
                  playingPosition64={playingPosition64}
                  onPatternChange={handlePatternChange}
                  onPlayPattern={playPattern}
                />
              ))}
            </div>
          </>
        )}
      </Playback>
    </div>
  )
}

export default AppContainer;
