import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, UseTimerOptions, UseTimerReturn } from '../../../types/timer';

export const useTimer = (
  initialTimer: Timer,
  options: UseTimerOptions = {}
): UseTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState(initialTimer.remainingTime);
  const [isRunning, setIsRunning] = useState(initialTimer.status === 'running');
  const [isPaused, setIsPaused] = useState(initialTimer.status === 'paused');
  const intervalRef = useRef<number>();
  const precision = options.precision || 1000;

  // 進捗率を計算
  const progress = ((initialTimer.duration - timeRemaining) / initialTimer.duration) * 100;

  // タイマーの停止
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

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
          setIsRunning(false);
          options.onComplete?.();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = undefined;
          }
        }
        
        return newTime;
      });
    }, precision);
    
    options.onStart?.();
  }, [timeRemaining, options, precision]);

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
    setTimeRemaining(initialTimer.duration);
  }, [stopTimer, initialTimer.duration]);

  // タイマーリセット
  const reset = useCallback(() => {
    stopTimer();
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(initialTimer.duration);
  }, [stopTimer, initialTimer.duration]);

  // 持続時間設定
  const setDuration = useCallback((duration: number) => {
    if (!isRunning) {
      setTimeRemaining(duration);
    }
  }, [isRunning]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  // 外部からのタイマー更新
  useEffect(() => {
    if (!isRunning && !isPaused) {
      setTimeRemaining(initialTimer.remainingTime);
    }
  }, [initialTimer.remainingTime, isRunning, isPaused]);

  return {
    timeRemaining,
    isRunning,
    isPaused,
    progress: Math.max(0, Math.min(100, progress)),
    start,
    pause,
    stop,
    reset,
    setDuration,
  };
};
