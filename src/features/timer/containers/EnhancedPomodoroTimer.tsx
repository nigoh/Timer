import { useCallback, useEffect, useState } from 'react';
import { EnhancedPomodoroTimerView } from '../components/pomodoro/EnhancedPomodoroTimerView';
import { usePomodoroStore } from '../stores/pomodoro-store';
import { PomodoroSettings } from '@/types/pomodoro';

export const EnhancedPomodoroTimer = () => {
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
    tick,
  } = usePomodoroStore();

  const [localTaskName, setLocalTaskName] = useState(taskName);

  useEffect(() => {
    setLocalTaskName(taskName);
  }, [taskName]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

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
