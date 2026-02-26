import { create } from 'zustand';
import { MultiTimer, MultiTimerSession } from '@/types/multi-timer';
import { notificationManager } from '@/utils/notification-manager';
import { generateId } from '@/utils/id';

/** 1 タスクあたりのマルチタイマーインスタンス状態 */
export interface MultiTimerInstanceState {
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

interface MultiTimerStoreState {
  instances: Record<string, MultiTimerInstanceState>;
}

interface MultiTimerStoreActions {
  getOrCreateInstance: (taskId: string) => MultiTimerInstanceState;
  addTimer: (
    taskId: string,
    timer: Omit<
      MultiTimer,
      'id' | 'remainingTime' | 'isRunning' | 'isPaused' | 'isCompleted' | 'createdAt'
    >,
  ) => void;
  updateTimer: (taskId: string, id: string, updates: Partial<MultiTimer>) => void;
  deleteTimer: (taskId: string, id: string) => void;
  duplicateTimer: (taskId: string, id: string) => void;
  startTimer: (taskId: string, id: string) => void;
  pauseTimer: (taskId: string, id: string) => void;
  stopTimer: (taskId: string, id: string) => void;
  resetTimer: (taskId: string, id: string) => void;
  startAllTimers: (taskId: string) => void;
  pauseAllTimers: (taskId: string) => void;
  stopAllTimers: (taskId: string) => void;
  resetAllTimers: (taskId: string) => void;
  tick: (taskId: string) => void;
  addCategory: (taskId: string, category: string) => void;
  removeCategory: (taskId: string, category: string) => void;
  updateGlobalSettings: (taskId: string, settings: Partial<MultiTimerInstanceState['globalSettings']>) => void;
  getTimerById: (taskId: string, id: string) => MultiTimer | undefined;
  getRunningTimers: (taskId: string) => MultiTimer[];
  getCompletedTimers: (taskId: string) => MultiTimer[];
  removeInstance: (taskId: string) => void;
}

export type MultiTimerStore = MultiTimerStoreState & MultiTimerStoreActions;

const DEFAULT_CATEGORIES = ['仕事', '勉強', '運動', '休憩', 'その他'];

const createDefaultInstance = (): MultiTimerInstanceState => ({
  timers: [],
  categories: [...DEFAULT_CATEGORIES],
  isAnyRunning: false,
  globalSettings: {
    autoStartNext: false,
    showNotifications: true,
    soundEnabled: true,
  },
  sessions: [],
});

const ensureInstance = (
  instances: Record<string, MultiTimerInstanceState>,
  taskId: string,
): Record<string, MultiTimerInstanceState> => {
  if (instances[taskId]) return instances;
  return { ...instances, [taskId]: createDefaultInstance() };
};

const updateInstance = (
  instances: Record<string, MultiTimerInstanceState>,
  taskId: string,
  updater: (inst: MultiTimerInstanceState) => Partial<MultiTimerInstanceState>,
): Record<string, MultiTimerInstanceState> => {
  const current = instances[taskId];
  if (!current) return instances;
  return { ...instances, [taskId]: { ...current, ...updater(current) } };
};

export const useMultiTimerStore = create<MultiTimerStore>((set, get) => ({
  instances: {},

  getOrCreateInstance: (taskId) => {
    const state = get();
    if (!state.instances[taskId]) {
      set({ instances: ensureInstance(state.instances, taskId) });
    }
    return get().instances[taskId] ?? createDefaultInstance();
  },

  addTimer: (taskId, timerData) => {
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
      instances: updateInstance(
        ensureInstance(state.instances, taskId),
        taskId,
        (inst) => ({ timers: [...inst.timers, newTimer] }),
      ),
    }));
  },

  updateTimer: (taskId, id, updates) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        timers: inst.timers.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),
    }));
  },

  deleteTimer: (taskId, id) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        timers: inst.timers.filter((t) => t.id !== id),
      })),
    }));
  },

  duplicateTimer: (taskId, id) => {
    const inst = get().instances[taskId];
    if (!inst) return;
    const timer = inst.timers.find((t) => t.id === id);
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

    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        timers: [...inst.timers, duplicate],
      })),
    }));
  },

  startTimer: (taskId, id) => {
    const inst = get().instances[taskId];
    if (!inst) return;
    const timer = inst.timers.find((t) => t.id === id);
    if (!timer || timer.isRunning || timer.isCompleted) return;

    notificationManager.ensureInitialized().catch(console.warn);

    const now = Date.now();
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        timers: inst.timers.map((t) =>
          t.id === id
            ? { ...t, isRunning: true, isPaused: false, startedAt: new Date(now) }
            : t,
        ),
        isAnyRunning: true,
      })),
    }));
  },

  pauseTimer: (taskId, id) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        timers: inst.timers.map((t) =>
          t.id === id ? { ...t, isRunning: false, isPaused: true, pausedAt: new Date() } : t,
        ),
        isAnyRunning: inst.timers.some((t) => t.id !== id && t.isRunning),
      })),
    }));
  },

  stopTimer: (taskId, id) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        timers: inst.timers.map((t) =>
          t.id === id
            ? {
                ...t,
                isRunning: false,
                isPaused: false,
                isCompleted: false,
                remainingTime: t.duration,
                startedAt: undefined,
                pausedAt: undefined,
                completedAt: undefined,
              }
            : t,
        ),
        isAnyRunning: inst.timers.some((t) => t.id !== id && t.isRunning),
      })),
    }));
  },

  resetTimer: (taskId, id) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        timers: inst.timers.map((t) =>
          t.id === id
            ? {
                ...t,
                remainingTime: t.duration,
                isRunning: false,
                isPaused: false,
                isCompleted: false,
                startedAt: undefined,
                pausedAt: undefined,
                completedAt: undefined,
              }
            : t,
        ),
        isAnyRunning: inst.timers.some((t) => t.id !== id && t.isRunning),
      })),
    }));
  },

  startAllTimers: (taskId) => {
    notificationManager.ensureInitialized().catch(console.warn);
    const now = new Date();
    set((state) => ({
      instances: updateInstance(
        ensureInstance(state.instances, taskId),
        taskId,
        (inst) => ({
          timers: inst.timers.map((t) =>
            t.isCompleted
              ? t
              : { ...t, isRunning: true, isPaused: false, startedAt: now },
          ),
          isAnyRunning: inst.timers.some((t) => !t.isCompleted),
        }),
      ),
    }));
  },

  pauseAllTimers: (taskId) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        timers: inst.timers.map((t) =>
          t.isRunning ? { ...t, isRunning: false, isPaused: true, pausedAt: new Date() } : t,
        ),
        isAnyRunning: false,
      })),
    }));
  },

  stopAllTimers: (taskId) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        timers: inst.timers.map((t) => ({
          ...t,
          isRunning: false,
          isPaused: false,
          isCompleted: false,
          remainingTime: t.duration,
          startedAt: undefined,
          pausedAt: undefined,
          completedAt: undefined,
        })),
        isAnyRunning: false,
      })),
    }));
  },

  resetAllTimers: (taskId) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        timers: inst.timers.map((t) => ({
          ...t,
          remainingTime: t.duration,
          isRunning: false,
          isPaused: false,
          isCompleted: false,
          startedAt: undefined,
          pausedAt: undefined,
          completedAt: undefined,
        })),
        isAnyRunning: false,
      })),
    }));
  },

  tick: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst?.isAnyRunning) return;

    const hasRunningTimers = inst.timers.some((t) => t.isRunning);
    if (!hasRunningTimers) {
      set((state) => ({
        instances: updateInstance(state.instances, taskId, () => ({
          isAnyRunning: false,
        })),
      }));
      return;
    }

    const updatedTimers = inst.timers.map((timer) => {
      if (!timer.isRunning || timer.isCompleted) return timer;

      const newRemainingTime = Math.max(0, timer.remainingTime - 1);

      if (newRemainingTime === 0) {
        if (inst.globalSettings.soundEnabled) {
          notificationManager.notify('タイマー終了', {
            body: `「${timer.name}」が終了しました`,
            sound: 'complete',
          });
        } else if (inst.globalSettings.showNotifications) {
          notificationManager.notify('タイマー終了', {
            body: `「${timer.name}」が終了しました`,
            silent: true,
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

    const nextIsAnyRunning = updatedTimers.some((t) => t.isRunning);

    set((state) => ({
      instances: updateInstance(state.instances, taskId, () => ({
        timers: updatedTimers,
        isAnyRunning: nextIsAnyRunning,
      })),
    }));
  },

  addCategory: (taskId, category) => {
    set((state) => ({
      instances: updateInstance(
        ensureInstance(state.instances, taskId),
        taskId,
        (inst) => ({
          categories: inst.categories.includes(category)
            ? inst.categories
            : [...inst.categories, category],
        }),
      ),
    }));
  },

  removeCategory: (taskId, category) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        categories: inst.categories.filter((c) => c !== category),
      })),
    }));
  },

  updateGlobalSettings: (taskId, settings) => {
    set((state) => ({
      instances: updateInstance(
        ensureInstance(state.instances, taskId),
        taskId,
        (inst) => ({
          globalSettings: { ...inst.globalSettings, ...settings },
        }),
      ),
    }));
  },

  getTimerById: (taskId, id) => {
    const inst = get().instances[taskId];
    return inst?.timers.find((t) => t.id === id);
  },

  getRunningTimers: (taskId) => {
    const inst = get().instances[taskId];
    return inst?.timers.filter((t) => t.isRunning) ?? [];
  },

  getCompletedTimers: (taskId) => {
    const inst = get().instances[taskId];
    return inst?.timers.filter((t) => t.isCompleted) ?? [];
  },

  removeInstance: (taskId) => {
    set((state) => {
      const { [taskId]: _, ...rest } = state.instances;
      return { instances: rest };
    });
  },
}));
