import { useState, useEffect, useRef, useCallback } from 'react';
import { PomodoroTimer, PomodoroPhase, PomodoroSettings, UseTimerOptions } from '../../../types/timer';

interface UsePomodoroTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  progress: number;
  currentPhase: PomodoroPhase;
  currentCycle: number;
  totalCycles: number;
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  skipPhase: () => void;
  resetCycles: () => void;
}

export const usePomodoroTimer = (
  initialTimer: PomodoroTimer,
  options: UseTimerOptions = {}
): UsePomodoroTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState(initialTimer.remainingTime);
  const [isRunning, setIsRunning] = useState(initialTimer.status === 'running');
  const [isPaused, setIsPaused] = useState(initialTimer.status === 'paused');
  const [currentPhase, setCurrentPhase] = useState<PomodoroPhase>(initialTimer.pomodoroData.phase);
  const [currentCycle, setCurrentCycle] = useState(initialTimer.pomodoroData.cycle);
  const [totalCycles, setTotalCycles] = useState(initialTimer.pomodoroData.totalCycles);
  
  const intervalRef = useRef<number>();
  const settings = initialTimer.pomodoroData.settings;
  const precision = options.precision || 1000;

  // 現在のフェーズの持続時間を取得
  const getCurrentPhaseDuration = useCallback((phase: PomodoroPhase): number => {
    switch (phase) {
      case 'work':
        return settings.workDuration * 60; // 分を秒に変換
      case 'short-break':
        return settings.shortBreakDuration * 60;
      case 'long-break':
        return settings.longBreakDuration * 60;
      default:
        return settings.workDuration * 60;
    }
  }, [settings]);

  // 次のフェーズを決定
  const getNextPhase = useCallback((phase: PomodoroPhase, cycle: number): PomodoroPhase => {
    if (phase === 'work') {
      // 作業フェーズの後は休憩
      return cycle % settings.longBreakInterval === 0 ? 'long-break' : 'short-break';
    } else {
      // 休憩フェーズの後は作業
      return 'work';
    }
  }, [settings.longBreakInterval]);

  // 進捗率を計算
  const currentPhaseDuration = getCurrentPhaseDuration(currentPhase);
  const progress = ((currentPhaseDuration - timeRemaining) / currentPhaseDuration) * 100;

  // タイマーの停止
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  // 次のフェーズに移行
  const moveToNextPhase = useCallback(() => {
    const nextPhase = getNextPhase(currentPhase, currentCycle);
    const nextCycle = currentPhase === 'work' ? currentCycle + 1 : currentCycle;
    const nextTotalCycles = currentPhase === 'work' ? totalCycles + 1 : totalCycles;
    
    setCurrentPhase(nextPhase);
    setCurrentCycle(nextCycle);
    setTotalCycles(nextTotalCycles);
    setTimeRemaining(getCurrentPhaseDuration(nextPhase));
    setIsRunning(false);
    setIsPaused(false);

    // 自動開始の設定に応じて次のフェーズを開始
    const shouldAutoStart = 
      (nextPhase === 'work' && settings.autoStartWork) ||
      (nextPhase !== 'work' && settings.autoStartBreaks);

    if (shouldAutoStart) {
      setTimeout(() => setIsRunning(true), 1000);
    }

    options.onComplete?.();
  }, [currentPhase, currentCycle, totalCycles, getNextPhase, getCurrentPhaseDuration, settings, options]);

  // タイマー開始
  const start = useCallback(() => {
    if (timeRemaining <= 0) return;
    
    setIsRunning(true);
    setIsPaused(false);
    
    intervalRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - 1);
        options.onTick?.(newTime);
        
        if (newTime === 0) {
          // フェーズ完了 - 次のフェーズに移行
          setTimeout(moveToNextPhase, 100);
        }
        
        return newTime;
      });
    }, precision);
    
    options.onStart?.();
  }, [timeRemaining, options, precision, moveToNextPhase]);

  // タイマー一時停止
  const pause = useCallback(() => {
    stopTimer();
    setIsRunning(false);
    setIsPaused(true);
    options.onPause?.();
  }, [stopTimer, options]);

  // タイマー停止
  const stop = useCallback(() => {
    stopTimer();
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(getCurrentPhaseDuration(currentPhase));
  }, [stopTimer, getCurrentPhaseDuration, currentPhase]);

  // タイマーリセット（現在のフェーズのみ）
  const reset = useCallback(() => {
    stopTimer();
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(getCurrentPhaseDuration(currentPhase));
  }, [stopTimer, getCurrentPhaseDuration, currentPhase]);

  // フェーズスキップ
  const skipPhase = useCallback(() => {
    stopTimer();
    moveToNextPhase();
  }, [stopTimer, moveToNextPhase]);

  // サイクルリセット
  const resetCycles = useCallback(() => {
    stopTimer();
    setIsRunning(false);
    setIsPaused(false);
    setCurrentPhase('work');
    setCurrentCycle(1);
    setTotalCycles(0);
    setTimeRemaining(getCurrentPhaseDuration('work'));
  }, [stopTimer, getCurrentPhaseDuration]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  // フェーズ変更時の時間更新
  useEffect(() => {
    if (!isRunning && !isPaused) {
      setTimeRemaining(getCurrentPhaseDuration(currentPhase));
    }
  }, [currentPhase, getCurrentPhaseDuration, isRunning, isPaused]);

  return {
    timeRemaining,
    isRunning,
    isPaused,
    progress: Math.max(0, Math.min(100, progress)),
    currentPhase,
    currentCycle,
    totalCycles,
    start,
    pause,
    stop,
    reset,
    skipPhase,
    resetCycles,
  };
};
