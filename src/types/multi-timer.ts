export interface MultiTimer {
  id: string;
  name: string;
  duration: number; // 秒
  remainingTime: number; // 秒
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  category?: string;
  color?: string;
  description?: string;
}

export interface MultiTimerSession {
  id: string;
  timerId: string;
  timerName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  completed: boolean;
  category?: string;
}

export interface MultiTimerState {
  timers: MultiTimer[];
  sessions: MultiTimerSession[];
  isAnyRunning: boolean;
  categories: string[];
  globalSettings: {
    autoStartNext: boolean;
    showNotifications: boolean;
    soundEnabled: boolean;
  };
}
