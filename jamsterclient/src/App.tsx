import { useState } from 'react';
import './App.css'
import Pattern from './components/Pattern'
import Playback from './components/Playback';
import { JamsterProvider } from './Provider'
import type { PatternData, TimelineRowData } from './types';
import TimelineRows from './components/TimelineRows';

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
  const [patterns, setPatterns] = useState<PatternData[]>([{ index: 0, name: "Pattern 0", numberOfMeasures: 4, rhythms: [] }])
  const [timelineRows, setTimelineRows] = useState<TimelineRowData[]>([{ index: 0, slots: [] }])
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

  const handlePatternAdded = (newPattern: PatternData) => {
    setPatterns(currentPatterns => [
      ...currentPatterns, newPattern
    ])
  }

  const handlePatternChange = (newPattern: PatternData) => {
    setPatterns((currentPatterns) => currentPatterns.map((pattern) => {
      if (pattern.index !== newPattern.index) return pattern;
      return newPattern;
    }));
  }

  const handlePatternDelete = (deletePattern: PatternData) => {
    setPatterns((currentPatterns) => currentPatterns.filter((pattern) => pattern.index !== deletePattern.index));
  }

  const handleStoreLoaded = (patterns: PatternData[], timelineRows: TimelineRowData[]) => {
    setPatterns(patterns);
    setTimelineLength(getTimelineLength(timelineRows));
    setTimelineRows(timelineRows);
  }

  return (
    <div className='app'>
      <Playback patterns={patterns} timelineRows={timelineRows} onStoreLoaded={handleStoreLoaded} onPatternChange={handlePatternChange} onPatternAdded={handlePatternAdded}>
        {({ isPlaying, playingPosition64, playingSlotIndex, getPlayingMeasureIndex, playPattern }) => (
          <>
            <TimelineRows
              patterns={patterns}
              timelineRows={timelineRows}
              timelineLength={timelineLength}
              setTimelineLength={setTimelineLength}
              onTimelineRowsChange={setTimelineRows}
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
                  onPatternDelete={handlePatternDelete}
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
