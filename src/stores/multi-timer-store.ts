import { create } from 'zustand';
import { MultiTimerState, MultiTimer, MultiTimerSession } from '../types/multi-timer';

interface MultiTimerStore extends MultiTimerState {
  // タイマー管理
  addTimer: (timer: Omit<MultiTimer, 'id' | 'remainingTime' | 'isRunning' | 'isPaused' | 'isCompleted' | 'createdAt'>) => void;
  updateTimer: (id: string, updates: Partial<MultiTimer>) => void;
  deleteTimer: (id: string) => void;
  duplicateTimer: (id: string) => void;
  
  // タイマー制御
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  stopTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  startAllTimers: () => void;
  pauseAllTimers: () => void;
  stopAllTimers: () => void;
  resetAllTimers: () => void;
  
  // タイマー tick
  tick: () => void;
  
  // カテゴリ管理
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  
  // 設定
  updateGlobalSettings: (settings: Partial<MultiTimerState['globalSettings']>) => void;
  
  // ユーティリティ
  getTimerById: (id: string) => MultiTimer | undefined;
  getRunningTimers: () => MultiTimer[];
  getCompletedTimers: () => MultiTimer[];
}

const DEFAULT_CATEGORIES = ['仕事', '勉強', '運動', '休憩', 'その他'];

const TIMER_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-teal-500',
];

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const playCompletionSound = () => {
  try {
    const audio = new Audio('/timer-complete.mp3');
    audio.play().catch(() => {
      // 音声再生に失敗した場合は無視
    });
  } catch {
    // 音声ファイルがない場合は無視
  }
};

const showNotification = (timer: MultiTimer) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`タイマー完了: ${timer.name}`, {
      body: `${timer.name}のタイマーが終了しました！`,
      icon: '/timer-icon.png',
      tag: `timer-${timer.id}`,
    });
  }
};

export const useMultiTimerStore = create<MultiTimerStore>((set, get) => ({
  // 初期状態
  timers: [],
  sessions: [],
  isAnyRunning: false,
  categories: DEFAULT_CATEGORIES,
  globalSettings: {
    autoStartNext: false,
    showNotifications: true,
    soundEnabled: true,
  },

  // タイマー管理
  addTimer: (timerData) => {
    const newTimer: MultiTimer = {
      ...timerData,
      id: generateId(),
      remainingTime: timerData.duration,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      createdAt: new Date(),
      color: timerData.color || TIMER_COLORS[get().timers.length % TIMER_COLORS.length],
    };

    set((state) => ({
      timers: [...state.timers, newTimer],
    }));
  },

  updateTimer: (id, updates) => {
    set((state) => ({
      timers: state.timers.map((timer) =>
        timer.id === id ? { ...timer, ...updates } : timer
      ),
    }));
  },

  deleteTimer: (id) => {
    set((state) => ({
      timers: state.timers.filter((timer) => timer.id !== id),
    }));
  },

  duplicateTimer: (id) => {
    const timer = get().getTimerById(id);
    if (timer) {
      get().addTimer({
        name: `${timer.name} (コピー)`,
        duration: timer.duration,
        category: timer.category,
        description: timer.description,
        color: timer.color,
      });
    }
  },

  // タイマー制御
  startTimer: (id) => {
    const state = get();
    const timer = state.timers.find((t) => t.id === id);
    
    if (timer && !timer.isRunning && !timer.isCompleted) {
      set((state) => ({
        timers: state.timers.map((t) =>
          t.id === id
            ? {
                ...t,
                isRunning: true,
                isPaused: false,
                startedAt: t.startedAt || new Date(),
              }
            : t
        ),
        isAnyRunning: true,
      }));
    }
  },

  pauseTimer: (id) => {
    set((state) => ({
      timers: state.timers.map((timer) =>
        timer.id === id
          ? { ...timer, isRunning: false, isPaused: true }
          : timer
      ),
      isAnyRunning: state.timers.some((t) => t.id !== id && t.isRunning),
    }));
  },

  stopTimer: (id) => {
    set((state) => ({
      timers: state.timers.map((timer) =>
        timer.id === id
          ? {
              ...timer,
              isRunning: false,
              isPaused: false,
              remainingTime: timer.duration,
              startedAt: undefined,
            }
          : timer
      ),
      isAnyRunning: state.timers.some((t) => t.id !== id && t.isRunning),
    }));
  },

  resetTimer: (id) => {
    set((state) => ({
      timers: state.timers.map((timer) =>
        timer.id === id
          ? {
              ...timer,
              isRunning: false,
              isPaused: false,
              isCompleted: false,
              remainingTime: timer.duration,
              startedAt: undefined,
              completedAt: undefined,
            }
          : timer
      ),
      isAnyRunning: state.timers.some((t) => t.id !== id && t.isRunning),
    }));
  },

  startAllTimers: () => {
    set((state) => ({
      timers: state.timers.map((timer) =>
        !timer.isCompleted
          ? {
              ...timer,
              isRunning: true,
              isPaused: false,
              startedAt: timer.startedAt || new Date(),
            }
          : timer
      ),
      isAnyRunning: true,
    }));
  },

  pauseAllTimers: () => {
    set((state) => ({
      timers: state.timers.map((timer) => ({
        ...timer,
        isRunning: false,
        isPaused: timer.isRunning || timer.isPaused,
      })),
      isAnyRunning: false,
    }));
  },

  stopAllTimers: () => {
    set((state) => ({
      timers: state.timers.map((timer) => ({
        ...timer,
        isRunning: false,
        isPaused: false,
        remainingTime: timer.duration,
        startedAt: undefined,
      })),
      isAnyRunning: false,
    }));
  },

  resetAllTimers: () => {
    set((state) => ({
      timers: state.timers.map((timer) => ({
        ...timer,
        isRunning: false,
        isPaused: false,
        isCompleted: false,
        remainingTime: timer.duration,
        startedAt: undefined,
        completedAt: undefined,
      })),
      isAnyRunning: false,
    }));
  },

  // タイマー tick
  tick: () => {
    const state = get();
    const { globalSettings } = state;

    set((prevState) => ({
      timers: prevState.timers.map((timer) => {
        if (!timer.isRunning || timer.isCompleted) return timer;

        const newRemainingTime = timer.remainingTime - 1;

        if (newRemainingTime <= 0) {
          // タイマー完了
          const completedTimer = {
            ...timer,
            remainingTime: 0,
            isRunning: false,
            isCompleted: true,
            completedAt: new Date(),
          };

          // セッション記録
          if (timer.startedAt) {
            const session: MultiTimerSession = {
              id: generateId(),
              timerId: timer.id,
              timerName: timer.name,
              startTime: timer.startedAt,
              endTime: new Date(),
              duration: timer.duration,
              completed: true,
              category: timer.category,
            };

            setTimeout(() => {
              set((state) => ({
                sessions: [...state.sessions, session],
              }));
            }, 0);
          }

          // 通知とサウンド
          if (globalSettings.showNotifications) {
            showNotification(completedTimer);
          }
          if (globalSettings.soundEnabled) {
            playCompletionSound();
          }

          return completedTimer;
        }

        return {
          ...timer,
          remainingTime: newRemainingTime,
        };
      }),
    }));

    // isAnyRunningの更新
    const hasRunningTimers = get().timers.some((t) => t.isRunning);
    if (state.isAnyRunning !== hasRunningTimers) {
      set({ isAnyRunning: hasRunningTimers });
    }
  },

  // カテゴリ管理
  addCategory: (category) => {
    set((state) => ({
      categories: state.categories.includes(category)
        ? state.categories
        : [...state.categories, category],
    }));
  },

  removeCategory: (category) => {
    set((state) => ({
      categories: state.categories.filter((c) => c !== category),
    }));
  },

  // 設定
  updateGlobalSettings: (newSettings) => {
    set((state) => ({
      globalSettings: { ...state.globalSettings, ...newSettings },
    }));
  },

  // ユーティリティ
  getTimerById: (id) => {
    return get().timers.find((timer) => timer.id === id);
  },

  getRunningTimers: () => {
    return get().timers.filter((timer) => timer.isRunning);
  },

  getCompletedTimers: () => {
    return get().timers.filter((timer) => timer.isCompleted);
  },
}));
