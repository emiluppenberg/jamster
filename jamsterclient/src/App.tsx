import { useMemo, useReducer, type Dispatch, type SetStateAction } from 'react';
import './App.css'
import Pattern from './components/Pattern'
import Playback from './components/Playback';
import { JamsterProvider } from './Provider'
import type { PatternData, TimelineRowData } from './types';
import TimelineRows from './components/TimelineRows';
import { appStateReducer, initialAppState } from './state';
import { createRuntimeId, getUniqueNumberedName } from './utils';

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

export const AppContent = () => {
  const [{ patterns, timelineRows }, dispatch] = useReducer(appStateReducer, initialAppState)
  const timelineLength = useMemo(() => getTimelineLength(timelineRows), [timelineRows]);

  const addPattern = () => {
    dispatch({
      type: "addPattern",
      pattern: {
        id: createRuntimeId(),
        numberOfMeasures: defaultNumberOfMeasures,
        rhythms: [],
        name: getUniqueNumberedName("Pattern", patterns.map((pattern) => pattern.name)),
      },
    });
  }

  const handlePatternAdded = (newPattern: PatternData) => {
    dispatch({ type: "addPattern", pattern: newPattern });
  }

  const handlePatternChange = (newPattern: PatternData) => {
    dispatch({ type: "changePattern", pattern: newPattern });
  }

  const handlePatternDelete = (deletePattern: PatternData) => {
    dispatch({ type: "deletePattern", patternId: deletePattern.id });
  }

  const handleStoreLoaded = (patterns: PatternData[], timelineRows: TimelineRowData[]) => {
    dispatch({ type: "loadStore", patterns, timelineRows });
  }

  const setTimelineRows: Dispatch<SetStateAction<TimelineRowData[]>> = (update) => {
    dispatch({ type: "setTimelineRows", update });
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
              onTimelineRowsChange={setTimelineRows}
              playingSlotIndex={playingSlotIndex}
              onPlayTimeline={playTimeline}
              onStopPlayback={stopPlayback}
            />
            <div className="container patterns">
              {patterns.map((pattern) => (
                <Pattern
                  key={pattern.id}
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
