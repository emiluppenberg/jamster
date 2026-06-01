import { useState } from 'react';
import './App.css'
import Pattern from './components/Pattern'
import Playback from './components/Playback';
import { JamsterProvider } from './Context'
import type { PatternData, TimelineRowData } from './types';
import Timeline from './components/Timeline';

const getTimelineLength = (timelineRows: TimelineRowData[]) => (
  Math.max(1, ...timelineRows.map((row) => row.slots.length))
)

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
  const [timelineRows, setTimelineRows] = useState<TimelineRowData[]>([])
  const [timelineLength, setTimelineLength] = useState(() => getTimelineLength(timelineRows));

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

  const handleStoreLoaded = (patterns: PatternData[], timelineRows: TimelineRowData[]) => {
    setPatterns(patterns);
    setTimelineLength(getTimelineLength(timelineRows));
    setTimelineRows(timelineRows);
  }

  return (
    <div className='app'>
      <Playback patterns={patterns} timelines={timelineRows} onStoreLoaded={handleStoreLoaded}>
        {({ isPlaying, playingPosition64, playingSlotIndex, getPlayingMeasureIndex, playPattern }) => (
          <>
            <Timeline
              patterns={patterns}
              timelineRows={timelineRows}
              timelineLength={timelineLength}
              setTimelineLength={setTimelineLength}
              onTimelinesChange={setTimelineRows}
              playingSlotIndex={playingSlotIndex}
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
