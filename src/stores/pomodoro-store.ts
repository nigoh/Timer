import { create } from 'zustand';
import { PomodoroState, PomodoroPhase, PomodoroSettings, PomodoroSession } from '../types/pomodoro';

interface PomodoroStore extends PomodoroState {
  // アクション
  start: () => void;
  pause: () => void;
  stop: () => void;
  skip: () => void;
  reset: () => void;
  tick: () => void;
  setTaskName: (name: string) => void;
  updateSettings: (settings: PomodoroSettings) => void;
  completeSession: () => void;
  nextPhase: () => void;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartWork: false,
};

const getInitialTimeRemaining = (phase: PomodoroPhase, settings: PomodoroSettings): number => {
  switch (phase) {
    case 'work':
      return settings.workDuration * 60;
    case 'short-break':
      return settings.shortBreakDuration * 60;
    case 'long-break':
      return settings.longBreakDuration * 60;
    default:
      return settings.workDuration * 60;
  }
};

const playNotificationSound = () => {
  // ブラウザの通知音
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('ポモドーロタイマー', {
      body: 'タイマーが終了しました！',
      icon: '/timer-icon.png', // アイコンがあれば
    });
  }
  
  // 音声通知（オプション）
  try {
    const audio = new Audio('/notification.mp3'); // 音声ファイルがあれば
    audio.play().catch(() => {
      // 音声再生に失敗した場合は無視
    });
  } catch {
    // 音声ファイルがない場合は無視
  }
};

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  // 初期状態
  currentPhase: 'work',
  timeRemaining: DEFAULT_SETTINGS.workDuration * 60,
  isRunning: false,
  isPaused: false,
  cycle: 1,
  totalCycles: 0,
  taskName: '',
  settings: DEFAULT_SETTINGS,
  todayStats: {
    completedPomodoros: 0,
    totalFocusTime: 0,
    totalBreakTime: 0,
    efficiency: 0,
  },
  sessions: [],

  // アクション
  start: () => {
    set({
      isRunning: true,
      isPaused: false,
    });
    
    // 通知権限をリクエスト
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },

  pause: () => {
    set({
      isRunning: false,
      isPaused: true,
    });
  },

  stop: () => {
    const state = get();
    set({
      isRunning: false,
      isPaused: false,
      timeRemaining: getInitialTimeRemaining(state.currentPhase, state.settings),
    });
  },

  skip: () => {
    get().nextPhase();
  },

  reset: () => {
    const state = get();
    set({
      isRunning: false,
      isPaused: false,
      currentPhase: 'work',
      timeRemaining: state.settings.workDuration * 60,
      cycle: 1,
      taskName: '',
    });
  },

  tick: () => {
    const state = get();
    if (!state.isRunning) return;
    
    if (state.timeRemaining <= 0) {
      // タイマー終了
      get().completeSession();
      playNotificationSound();
      
      // 自動で次のフェーズに進むかチェック
      const shouldAutoStart = 
        (state.currentPhase === 'work' && state.settings.autoStartBreaks) ||
        (state.currentPhase !== 'work' && state.settings.autoStartWork);
      
      if (shouldAutoStart) {
        setTimeout(() => {
          get().nextPhase();
          get().start();
        }, 1000); // 1秒待ってから自動開始
      } else {
        get().nextPhase();
        set({ isRunning: false });
      }
    } else {
      set({ timeRemaining: state.timeRemaining - 1 });
    }
  },

  setTaskName: (name: string) => {
    set({ taskName: name });
  },

  updateSettings: (newSettings: PomodoroSettings) => {
    const state = get();
    set({
      settings: newSettings,
      // 現在の時間をリセット（実行中でない場合のみ）
      timeRemaining: !state.isRunning ? getInitialTimeRemaining(state.currentPhase, newSettings) : state.timeRemaining,
    });
  },

  completeSession: () => {
    const state = get();
    const now = new Date();
    const sessionDuration = getInitialTimeRemaining(state.currentPhase, state.settings);
    
    // セッション記録を作成
    const session: PomodoroSession = {
      id: `${now.getTime()}`,
      taskName: state.taskName || `${state.currentPhase === 'work' ? '作業' : '休憩'}セッション`,
      startTime: new Date(now.getTime() - sessionDuration * 1000),
      endTime: now,
      duration: sessionDuration,
      phase: state.currentPhase,
      completed: true,
    };

    // 統計を更新
    const newStats = { ...state.todayStats };
    if (state.currentPhase === 'work') {
      newStats.completedPomodoros += 1;
      newStats.totalFocusTime += Math.round(sessionDuration / 60);
    } else {
      newStats.totalBreakTime += Math.round(sessionDuration / 60);
    }
    
    // 効率計算（完了したポモドーロ数 / 開始したポモドーロ数）
    newStats.efficiency = newStats.completedPomodoros > 0 
      ? Math.round((newStats.completedPomodoros / (newStats.completedPomodoros + state.sessions.filter(s => !s.completed).length)) * 100)
      : 0;

    set({
      sessions: [...state.sessions, session],
      todayStats: newStats,
    });
  },

  nextPhase: () => {
    const state = get();
    let nextPhase: PomodoroPhase;
    let nextCycle = state.cycle;

    if (state.currentPhase === 'work') {
      // 作業終了 → 休憩開始
      if (state.cycle >= state.settings.longBreakInterval) {
        // 長い休憩
        nextPhase = 'long-break';
        nextCycle = 1; // サイクルリセット
      } else {
        // 短い休憩
        nextPhase = 'short-break';
      }
    } else {
      // 休憩終了 → 作業開始
      nextPhase = 'work';
      if (state.currentPhase === 'short-break') {
        nextCycle = state.cycle + 1;
      }
    }

    set({
      currentPhase: nextPhase,
      cycle: nextCycle,
      timeRemaining: getInitialTimeRemaining(nextPhase, state.settings),
      taskName: nextPhase === 'work' ? state.taskName : '', // 休憩時はタスク名クリア
      totalCycles: nextPhase === 'work' ? state.totalCycles + 1 : state.totalCycles,
    });
  },
}));
