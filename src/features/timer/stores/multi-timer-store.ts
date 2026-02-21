import { create } from 'zustand';
import { MultiTimerState, MultiTimer } from '@/types/multi-timer';
import { notificationManager } from '@/utils/notification-manager';
import { generateId } from '@/utils/id';

export interface MultiTimerStore extends MultiTimerState {
  addTimer: (
    timer: Omit<
      MultiTimer,
      'id' | 'remainingTime' | 'isRunning' | 'isPaused' | 'isCompleted' | 'createdAt'
    >,
  ) => void;
  updateTimer: (id: string, updates: Partial<MultiTimer>) => void;
  deleteTimer: (id: string) => void;
  duplicateTimer: (id: string) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  stopTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  startAllTimers: () => void;
  pauseAllTimers: () => void;
  stopAllTimers: () => void;
  resetAllTimers: () => void;
  tick: () => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  updateGlobalSettings: (settings: Partial<MultiTimerState['globalSettings']>) => void;
  getTimerById: (id: string) => MultiTimer | undefined;
  getRunningTimers: () => MultiTimer[];
  getCompletedTimers: () => MultiTimer[];
}

const DEFAULT_CATEGORIES = ['仕事', '勉強', '運動', '休憩', 'その他'];

export const useMultiTimerStore = create<MultiTimerStore>((set, get) => ({
  timers: [],
  categories: DEFAULT_CATEGORIES,
  isAnyRunning: false,
  globalSettings: {
    autoStartNext: false,
    showNotifications: true,
    soundEnabled: true,
  },
  currentView: 'all',
  sessions: [],

  addTimer: (timerData) => {
    const newTimer: MultiTimer = {
      ...timerData,
      id: generateId(),
      remainingTime: timerData.duration,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      createdAt: new Date(),
    };

    set((state) => ({
      timers: [...state.timers, newTimer],
    }));
  },

  updateTimer: (id, updates) => {
    set((state) => ({
      timers: state.timers.map((timer) => (timer.id === id ? { ...timer, ...updates } : timer)),
    }));
  },

  deleteTimer: (id) => {
    set((state) => ({
      timers: state.timers.filter((timer) => timer.id !== id),
    }));
  },

  duplicateTimer: (id) => {
    const state = get();
    const timer = state.timers.find((item) => item.id === id);
    if (!timer) return;

    const duplicate: MultiTimer = {
      ...timer,
      id: generateId(),
      name: `${timer.name} (コピー)`,
      createdAt: new Date(),
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      remainingTime: timer.duration,
    };

    set({ timers: [...state.timers, duplicate] });
  },

  startTimer: (id) => {
    const state = get();
    const timer = state.timers.find((item) => item.id === id);
    if (!timer || timer.isRunning || timer.isCompleted) return;

    notificationManager.ensureInitialized().catch(console.warn);

    const now = Date.now();
    set({
      timers: state.timers.map((item) =>
        item.id === id
          ? { ...item, isRunning: true, isPaused: false, startedAt: new Date(now) }
          : item,
      ),
      isAnyRunning: true,
    });
  },

  pauseTimer: (id) => {
    set((state) => ({
      timers: state.timers.map((timer) =>
        timer.id === id ? { ...timer, isRunning: false, isPaused: true, pausedAt: new Date() } : timer,
      ),
      isAnyRunning: state.timers.some((timer) => timer.id !== id && timer.isRunning),
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
              isCompleted: false,
              remainingTime: timer.duration,
              startedAt: undefined,
              pausedAt: undefined,
              completedAt: undefined,
            }
          : timer,
      ),
      isAnyRunning: state.timers.some((timer) => timer.id !== id && timer.isRunning),
    }));
  },

  resetTimer: (id) => {
    set((state) => ({
      timers: state.timers.map((timer) =>
        timer.id === id
          ? {
              ...timer,
              remainingTime: timer.duration,
              isRunning: false,
              isPaused: false,
              isCompleted: false,
              startedAt: undefined,
              pausedAt: undefined,
              completedAt: undefined,
            }
          : timer,
      ),
      isAnyRunning: state.timers.some((timer) => timer.id !== id && timer.isRunning),
    }));
  },

  startAllTimers: () => {
    const state = get();
    
    notificationManager.ensureInitialized().catch(console.warn);

    const now = new Date();
    set({
      timers: state.timers.map((timer) =>
        timer.isCompleted
          ? timer
          : { ...timer, isRunning: true, isPaused: false, startedAt: now },
      ),
      isAnyRunning: state.timers.some((timer) => !timer.isCompleted),
    });
  },

  pauseAllTimers: () => {
    set((state) => ({
      timers: state.timers.map((timer) =>
        timer.isRunning ? { ...timer, isRunning: false, isPaused: true, pausedAt: new Date() } : timer,
      ),
      isAnyRunning: false,
    }));
  },

  stopAllTimers: () => {
    set((state) => ({
      timers: state.timers.map((timer) => ({
        ...timer,
        isRunning: false,
        isPaused: false,
        isCompleted: false,
        remainingTime: timer.duration,
        startedAt: undefined,
        pausedAt: undefined,
        completedAt: undefined,
      })),
      isAnyRunning: false,
    }));
  },

  resetAllTimers: () => {
    set((state) => ({
      timers: state.timers.map((timer) => ({
        ...timer,
        remainingTime: timer.duration,
        isRunning: false,
        isPaused: false,
        isCompleted: false,
        startedAt: undefined,
        pausedAt: undefined,
        completedAt: undefined,
      })),
      isAnyRunning: false,
    }));
  },

  tick: () => {
    const state = get();
    if (!state.isAnyRunning) return;

    const hasRunningTimers = state.timers.some((timer) => timer.isRunning);
    if (!hasRunningTimers) {
      set({ isAnyRunning: false });
      return;
    }
    
    const updatedTimers = state.timers.map((timer) => {
      if (!timer.isRunning || timer.isCompleted) return timer;

      const newRemainingTime = Math.max(0, timer.remainingTime - 1);

      if (newRemainingTime === 0) {
        if (state.globalSettings.soundEnabled) {
          notificationManager.notify('タイマー終了', {
            body: `「${timer.name}」が終了しました`,
            sound: 'complete'
          });
        } else if (state.globalSettings.showNotifications) {
            notificationManager.notify('タイマー終了', {
                body: `「${timer.name}」が終了しました`,
                silent: true
            });
        }

        return {
          ...timer,
          remainingTime: 0,
          isRunning: false,
          isCompleted: true,
          completedAt: new Date(),
        };
      }

      return {
        ...timer,
        remainingTime: newRemainingTime,
      };
    });

    const nextIsAnyRunning = updatedTimers.some((timer) => timer.isRunning);

    set({
      timers: updatedTimers,
      isAnyRunning: nextIsAnyRunning,
    });
  },

  addCategory: (category: string) => {
    set((state) => ({
      categories: state.categories.includes(category)
        ? state.categories
        : [...state.categories, category],
    }));
  },

  removeCategory: (category: string) => {
    set((state) => ({
      categories: state.categories.filter((item) => item !== category),
    }));
  },

  updateGlobalSettings: (settings) => {
    set((state) => ({
      globalSettings: { ...state.globalSettings, ...settings },
    }));
  },

  getTimerById: (id: string) => get().timers.find((timer) => timer.id === id),

  getRunningTimers: () => get().timers.filter((timer) => timer.isRunning),

  getCompletedTimers: () => get().timers.filter((timer) => timer.isCompleted),
}));
