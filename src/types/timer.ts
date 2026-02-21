// PomodoroPhaseとPomodoroSettingsの正本はsrc/types/pomodoro.tsを参照
export type { PomodoroPhase, PomodoroSettings } from './pomodoro';

export interface Timer {
  id: string;
  name: string;
  duration: number;            // 秒単位
  remainingTime: number;       // 残り時間
  status: TimerStatus;
  createdAt: Date;
  startedAt?: Date;
  pausedAt?: Date;
  completedAt?: Date;
  category?: string;
  theme: TimerTheme;
  notificationEnabled: boolean;
  soundEnabled: boolean;
  soundFile?: string;
  type: TimerType;            // タイマーの種類
}

export type TimerType = 'basic' | 'pomodoro' | 'break';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerTheme {
  color: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  variant: 'default' | 'outline' | 'ghost';
  size: 'default' | 'sm' | 'lg' | 'icon';
}

export interface TimerSession {
  id: string;
  timerId: string;
  timerName: string;         // タイマー名
  plannedDuration: number;   // 設定時間（秒）
  actualDuration: number;    // 実際の時間（秒）
  startTime: Date;
  endTime?: Date;
  status: 'completed' | 'interrupted';
  interruptions: number;
  notes?: string;
  rating?: number;           // 1-5段階評価
  tags: string[];
}

// 基本タイマー用の履歴エントリ
export interface BasicTimerHistory {
  id: string;
  duration: number;          // 設定時間（秒）
  actualDuration: number;    // 実際の時間（秒）
  startTime: Date;
  endTime: Date;
  completed: boolean;        // 完了したかどうか
  label?: string;           // ユーザーが設定したラベル
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  browser: boolean;
  soundVolume: number;
  customSounds: { [key: string]: string };
  vibration: boolean;            // モバイル用
}

export interface UseTimerOptions {
  onTick?: (remaining: number) => void;
  onComplete?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  precision?: number;        // ミリ秒単位の精度
}

export interface UseTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  progress: number;
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  setDuration: (duration: number) => void;
}
