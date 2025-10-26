import React, { useCallback, useEffect, useState } from 'react';
import { BasicTimerView } from '../components/basic-timer/BasicTimerView';
import { useBasicTimerStore } from '../stores/basic-timer-store';

export const BasicTimer: React.FC = () => {
  const {
    duration,
    remainingTime,
    isRunning,
    isPaused,
    sessionLabel,
    history,
    setDuration,
    start,
    pause,
    stop,
    reset,
    setSessionLabel,
    tick,
    deleteHistoryEntry,
    clearHistory,
  } = useBasicTimerStore();

  const [localLabel, setLocalLabel] = useState(sessionLabel);

  useEffect(() => {
    setLocalLabel(sessionLabel);
  }, [sessionLabel]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  useEffect(() => {
    setSessionLabel(localLabel);
  }, [localLabel, setSessionLabel]);

  const handleLabelChange = useCallback((value: string) => {
    setLocalLabel(value);
  }, []);

  return (
    <BasicTimerView
      duration={duration}
      remainingTime={remainingTime}
      isRunning={isRunning}
      isPaused={isPaused}
      sessionLabel={localLabel}
      history={history}
      onSessionLabelChange={handleLabelChange}
      onDurationChange={setDuration}
      onStart={start}
      onPause={pause}
      onStop={stop}
      onReset={reset}
      onDeleteHistoryEntry={deleteHistoryEntry}
      onClearHistory={clearHistory}
    />
  );
};

