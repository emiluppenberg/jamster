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
  const [patterns, setPatterns] = useState<PatternData[]>([])
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
      <Playback
        patterns={patterns}
        timelineRows={timelineRows}
        onStoreLoaded={handleStoreLoaded}
        onPatternChange={handlePatternChange}
        onPatternAdded={handlePatternAdded}
        onPatternDelete={handlePatternDelete}
        onTimelineRowsChange={setTimelineRows}
      >
        {({ isPlaying, bpm, setBpm, playingPosition64, playingSlotIndex, getPlayingMeasureIndex, playPattern, playTimeline, stopPlayback }) => (
          <>
            <TimelineRows
              isPlaying={isPlaying}
              bpm={bpm}
              setBpm={setBpm}
              patterns={patterns}
              timelineRows={timelineRows}
              timelineLength={timelineLength}
              setTimelineLength={setTimelineLength}
              onTimelineRowsChange={setTimelineRows}
              playingSlotIndex={playingSlotIndex}
              onPlayTimeline={playTimeline}
              onStopPlayback={stopPlayback}
            />
            <h1>Patterns</h1>
            <div className="container patterns">
              {patterns.map((pattern) => (
                <Pattern
                  key={`pattern-${pattern.index}`}
                  isPlaying={isPlaying}
                  pattern={pattern}
                  patterns={patterns}
                  playingMeasureIndex={isPlaying ? getPlayingMeasureIndex(pattern) : undefined}
                  playingPosition64={playingPosition64}
                  onPatternChange={handlePatternChange}
                  onPatternDelete={handlePatternDelete}
                  onPlayPattern={playPattern}
                  onStopPlayback={stopPlayback}
                />
              ))}
              <div className="add">
                <button className="btn" onClick={addPattern}>Add pattern</button>
              </div>
            </div>
          </>
        )}
      </Playback>
    </div>
  )
}

export default AppContainer;
