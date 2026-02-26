import React, { useCallback, useEffect, useState } from "react";
import { BasicTimerView } from "../components/basic-timer/BasicTimerView";
import { useBasicTimerInstance } from "../hooks/useTimerInstances";
import { useTaskId } from "../contexts/TaskIdContext";

export const BasicTimer: React.FC = () => {
  const taskId = useTaskId();
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
    deleteHistoryEntry,
    clearHistory,
  } = useBasicTimerInstance(taskId);

  const [localLabel, setLocalLabel] = useState(sessionLabel);

  useEffect(() => {
    setLocalLabel(sessionLabel);
  }, [sessionLabel]);

  // tick is handled by tick-manager-store

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
