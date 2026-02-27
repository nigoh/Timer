import { create } from 'zustand';
import { BasicTimerHistory } from '@/types/timer';
import { notificationManager } from '@/utils/notification-manager';

/** 1 タスクあたりの基本タイマーインスタンス状態 */
export interface BasicTimerInstanceState {
  duration: number;
  remainingTime: number;
  isRunning: boolean;
  isPaused: boolean;
  sessionId: string | null;
  sessionStartTime: Date | null;
  sessionLabel: string;
  history: BasicTimerHistory[];
  lastTickTime: number | null;
}

interface BasicTimerStoreState {
  instances: Record<string, BasicTimerInstanceState>;
}

interface BasicTimerStoreActions {
  getOrCreateInstance: (taskId: string) => BasicTimerInstanceState;
  setDuration: (taskId: string, duration: number) => void;
  start: (taskId: string) => void;
  pause: (taskId: string) => void;
  stop: (taskId: string) => void;
  reset: (taskId: string) => void;
  setSessionLabel: (taskId: string, label: string) => void;
  completeSession: (taskId: string) => void;
  addToHistory: (taskId: string, entry: Omit<BasicTimerHistory, 'id'>) => void;
  clearHistory: (taskId: string) => void;
  deleteHistoryEntry: (taskId: string, id: string) => void;
  tick: (taskId: string) => void;
  removeInstance: (taskId: string) => void;
}

export type BasicTimerStore = BasicTimerStoreState & BasicTimerStoreActions;

const createDefaultInstance = (): BasicTimerInstanceState => ({
  duration: 25 * 60,
  remainingTime: 25 * 60,
  isRunning: false,
  isPaused: false,
  sessionId: null,
  sessionStartTime: null,
  sessionLabel: '',
  history: [],
  lastTickTime: null,
});

/** インスタンスを安全に取得（なければ作成） */
const ensureInstance = (
  instances: Record<string, BasicTimerInstanceState>,
  taskId: string,
): Record<string, BasicTimerInstanceState> => {
  if (instances[taskId]) return instances;
  return { ...instances, [taskId]: createDefaultInstance() };
};

/** インスタンスを更新するヘルパー */
const updateInstance = (
  instances: Record<string, BasicTimerInstanceState>,
  taskId: string,
  updater: (instance: BasicTimerInstanceState) => Partial<BasicTimerInstanceState>,
): Record<string, BasicTimerInstanceState> => {
  const current = instances[taskId];
  if (!current) return instances;
  return { ...instances, [taskId]: { ...current, ...updater(current) } };
};

export const useBasicTimerStore = create<BasicTimerStore>((set, get) => ({
  instances: {},

  getOrCreateInstance: (taskId) => {
    const state = get();
    if (!state.instances[taskId]) {
      set({ instances: ensureInstance(state.instances, taskId) });
    }
    return get().instances[taskId] ?? createDefaultInstance();
  },

  setDuration: (taskId, duration) => {
    set((state) => ({
      instances: updateInstance(
        ensureInstance(state.instances, taskId),
        taskId,
        (inst) => ({
          duration,
          remainingTime: inst.isRunning ? inst.remainingTime : duration,
        }),
      ),
    }));
  },

  start: (taskId) => {
    const instances = ensureInstance(get().instances, taskId);
    const inst = instances[taskId];
    const now = new Date();

    notificationManager.ensureInitialized().catch(console.warn);

    set({
      instances: {
        ...instances,
        [taskId]: {
          ...inst,
          isRunning: true,
          isPaused: false,
          sessionId: inst.sessionId || crypto.randomUUID(),
          sessionStartTime: inst.sessionStartTime || now,
          lastTickTime: Date.now(),
        },
      },
    });
  },

  pause: (taskId) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, () => ({
        isRunning: false,
        isPaused: true,
        lastTickTime: null,
      })),
    }));
  },

  stop: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst) return;

    if (inst.sessionStartTime) {
      const now = new Date();
      const actualDuration = Math.floor((now.getTime() - inst.sessionStartTime.getTime()) / 1000);
      const label = inst.sessionLabel || `${Math.ceil(inst.duration / 60)}分タイマー`;

      get().addToHistory(taskId, {
        duration: inst.duration,
        actualDuration,
        startTime: inst.sessionStartTime,
        endTime: now,
        completed: false,
        label,
      });
    }

    set((state) => ({
      instances: updateInstance(state.instances, taskId, (i) => ({
        isRunning: false,
        isPaused: false,
        remainingTime: i.duration,
        sessionId: null,
        sessionStartTime: null,
        sessionLabel: '',
        lastTickTime: null,
      })),
    }));
  },

  reset: (taskId) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        isRunning: false,
        isPaused: false,
        remainingTime: inst.duration,
        sessionId: null,
        sessionStartTime: null,
        sessionLabel: '',
        lastTickTime: null,
      })),
    }));
  },

  setSessionLabel: (taskId, label) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, () => ({
        sessionLabel: label,
      })),
    }));
  },

  completeSession: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst) return;

    if (inst.sessionStartTime) {
      const now = new Date();
      const actualDuration = Math.floor((now.getTime() - inst.sessionStartTime.getTime()) / 1000);
      const label = inst.sessionLabel || `${Math.ceil(inst.duration / 60)}分タイマー`;

      get().addToHistory(taskId, {
        duration: inst.duration,
        actualDuration,
        startTime: inst.sessionStartTime,
        endTime: now,
        completed: true,
        label,
      });

      notificationManager.notify('タイマー終了', {
        body: `${label}が終了しました`,
        sound: 'complete',
      });
    }

    set((state) => ({
      instances: updateInstance(state.instances, taskId, (i) => ({
        isRunning: false,
        isPaused: false,
        remainingTime: i.duration,
        sessionId: null,
        sessionStartTime: null,
        sessionLabel: '',
        lastTickTime: null,
      })),
    }));
  },

  addToHistory: (taskId, entry) => {
    const newEntry: BasicTimerHistory = {
      ...entry,
      id: crypto.randomUUID(),
    };

    set((state) => ({
      instances: updateInstance(
        ensureInstance(state.instances, taskId),
        taskId,
        (inst) => ({
          history: [newEntry, ...inst.history],
        }),
      ),
    }));
  },

  clearHistory: (taskId) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, () => ({
        history: [],
      })),
    }));
  },

  deleteHistoryEntry: (taskId, id) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        history: inst.history.filter((entry) => entry.id !== id),
      })),
    }));
  },

  tick: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst?.isRunning) return;

    const now = Date.now();
    const deltaTime = inst.lastTickTime
      ? Math.max(1, Math.round((now - inst.lastTickTime) / 1000))
      : 1;

    const newRemainingTime = Math.max(0, inst.remainingTime - deltaTime);

    set((state) => ({
      instances: updateInstance(state.instances, taskId, () => ({
        remainingTime: newRemainingTime,
        lastTickTime: now,
      })),
    }));

    if (newRemainingTime === 0) {
      get().completeSession(taskId);
    }
  },

  removeInstance: (taskId) => {
    set((state) => {
      const { [taskId]: _, ...rest } = state.instances;
      return { instances: rest };
    });
  },
}));

