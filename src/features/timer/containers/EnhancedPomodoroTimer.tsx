import { useCallback, useEffect, useState } from "react";
import { EnhancedPomodoroTimerView } from "../components/pomodoro/EnhancedPomodoroTimerView";
import { usePomodoroInstance } from "../hooks/useTimerInstances";
import { useTaskId } from "../contexts/TaskIdContext";
import { PomodoroSettings } from "@/types/pomodoro";

export const EnhancedPomodoroTimer = () => {
  const taskId = useTaskId();
  const {
    currentPhase,
    timeRemaining,
    isRunning,
    isPaused,
    cycle,
    taskName,
    todayStats,
    settings,
    start,
    pause,
    stop,
    skip,
    reset,
    setTaskName,
    updateSettings,
  } = usePomodoroInstance(taskId);

  const [localTaskName, setLocalTaskName] = useState(taskName);

  useEffect(() => {
    setLocalTaskName(taskName);
  }, [taskName]);

  // tick is handled by tick-manager-store

  useEffect(() => {
    setTaskName(localTaskName);
  }, [localTaskName, setTaskName]);

  const handleTaskNameChange = useCallback((value: string) => {
    setLocalTaskName(value);
  }, []);

  const handleSettingsSave = useCallback(
    (newSettings: PomodoroSettings) => {
      updateSettings(newSettings);
    },
    [updateSettings],
  );

  return (
    <EnhancedPomodoroTimerView
      currentPhase={currentPhase}
      timeRemaining={timeRemaining}
      isRunning={isRunning}
      isPaused={isPaused}
      cycle={cycle}
      settings={settings}
      todayStats={todayStats}
      taskName={localTaskName}
      onTaskNameChange={handleTaskNameChange}
      onStart={start}
      onPause={pause}
      onStop={stop}
      onSkip={skip}
      onReset={reset}
      onSettingsSave={handleSettingsSave}
    />
  );
};
