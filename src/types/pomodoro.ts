export interface PomodoroSettings {
  workDuration: number; // 分
  shortBreakDuration: number; // 分
  longBreakDuration: number; // 分
  longBreakInterval: number; // 何ポモドーロ毎に長い休憩
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

export interface PomodoroSession {
  id: string;
  taskName: string;
  startTime: Date;
  endTime: Date;
  duration: number; // 秒
  phase: 'work' | 'short-break' | 'long-break';
  completed: boolean;
}

export interface PomodoroStats {
  completedPomodoros: number;
  totalFocusTime: number; // 分
  totalBreakTime: number; // 分
  efficiency: number; // 0-100
}

export type PomodoroPhase = 'work' | 'short-break' | 'long-break';

export interface PomodoroState {
  // タイマー状態
  currentPhase: PomodoroPhase;
  timeRemaining: number; // 秒
  isRunning: boolean;
  isPaused: boolean;
  cycle: number; // 現在のサイクル（1-longBreakInterval）
  totalCycles: number; // 今日の総サイクル数
  taskName: string;
  
  // 設定
  settings: PomodoroSettings;
  
  // 統計
  todayStats: PomodoroStats;
  sessions: PomodoroSession[];
}
