import { create } from 'zustand';
import {
  PomodoroPhase,
  PomodoroSettings,
  PomodoroSession,
  PomodoroStats,
} from '@/types/pomodoro';
import { notificationManager } from '@/utils/notification-manager';

/** 1 タスクあたりのポモドーロインスタンス状態 */
export interface PomodoroInstanceState {
  currentPhase: PomodoroPhase;
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  cycle: number;
  totalCycles: number;
  taskName: string;
  settings: PomodoroSettings;
  todayStats: PomodoroStats;
  sessions: PomodoroSession[];
}

interface PomodoroStoreState {
  instances: Record<string, PomodoroInstanceState>;
}

interface PomodoroStoreActions {
  getOrCreateInstance: (taskId: string) => PomodoroInstanceState;
  start: (taskId: string) => void;
  pause: (taskId: string) => void;
  stop: (taskId: string) => void;
  skip: (taskId: string) => void;
  reset: (taskId: string) => void;
  tick: (taskId: string) => void;
  setTaskName: (taskId: string, name: string) => void;
  updateSettings: (taskId: string, settings: PomodoroSettings) => void;
  completeSession: (taskId: string) => void;
  nextPhase: (taskId: string) => void;
  removeInstance: (taskId: string) => void;
}

export type PomodoroStore = PomodoroStoreState & PomodoroStoreActions;

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartWork: false,
};

const DEFAULT_STATS: PomodoroStats = {
  completedPomodoros: 0,
  totalFocusTime: 0,
  totalBreakTime: 0,
  efficiency: 0,
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

const createDefaultInstance = (): PomodoroInstanceState => ({
  currentPhase: 'work',
  timeRemaining: DEFAULT_SETTINGS.workDuration * 60,
  isRunning: false,
  isPaused: false,
  cycle: 1,
  totalCycles: 0,
  taskName: '',
  settings: { ...DEFAULT_SETTINGS },
  todayStats: { ...DEFAULT_STATS },
  sessions: [],
});

const ensureInstance = (
  instances: Record<string, PomodoroInstanceState>,
  taskId: string,
): Record<string, PomodoroInstanceState> => {
  if (instances[taskId]) return instances;
  return { ...instances, [taskId]: createDefaultInstance() };
};

const updateInstance = (
  instances: Record<string, PomodoroInstanceState>,
  taskId: string,
  updater: (inst: PomodoroInstanceState) => Partial<PomodoroInstanceState>,
): Record<string, PomodoroInstanceState> => {
  const current = instances[taskId];
  if (!current) return instances;
  return { ...instances, [taskId]: { ...current, ...updater(current) } };
};

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  instances: {},

  getOrCreateInstance: (taskId) => {
    const state = get();
    if (!state.instances[taskId]) {
      set({ instances: ensureInstance(state.instances, taskId) });
    }
    return get().instances[taskId] ?? createDefaultInstance();
  },

  start: (taskId) => {
    set((state) => ({
      instances: updateInstance(
        ensureInstance(state.instances, taskId),
        taskId,
        () => ({ isRunning: true, isPaused: false }),
      ),
    }));
    notificationManager.ensureInitialized().catch(console.warn);
  },

  pause: (taskId) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, () => ({
        isRunning: false,
        isPaused: true,
      })),
    }));
  },

  stop: (taskId) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        isRunning: false,
        isPaused: false,
        timeRemaining: getInitialTimeRemaining(inst.currentPhase, inst.settings),
      })),
    }));
  },

  skip: (taskId) => {
    get().nextPhase(taskId);
  },

  reset: (taskId) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        isRunning: false,
        isPaused: false,
        currentPhase: 'work' as PomodoroPhase,
        timeRemaining: inst.settings.workDuration * 60,
        cycle: 1,
        taskName: '',
      })),
    }));
  },

  tick: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst?.isRunning) return;

    const nextRemaining = inst.timeRemaining - 1;

    if (nextRemaining <= 0) {
      set((state) => ({
        instances: updateInstance(state.instances, taskId, () => ({
          isRunning: false,
          isPaused: false,
          timeRemaining: 0,
        })),
      }));

      get().completeSession(taskId);

      notificationManager.notify('ポモドーロタイマー', {
        body: `${inst.currentPhase === 'work' ? '作業' : '休憩'}が終了しました`,
        sound: 'complete',
      });

      const shouldAutoStart =
        (inst.currentPhase === 'work' && inst.settings.autoStartBreaks) ||
        (inst.currentPhase !== 'work' && inst.settings.autoStartWork);

      if (shouldAutoStart) {
        setTimeout(() => {
          get().nextPhase(taskId);
          get().start(taskId);
        }, 1000);
      } else {
        get().nextPhase(taskId);
      }
    } else {
      set((state) => ({
        instances: updateInstance(state.instances, taskId, () => ({
          timeRemaining: nextRemaining,
        })),
      }));
    }
  },

  setTaskName: (taskId, name) => {
    set((state) => ({
      instances: updateInstance(
        ensureInstance(state.instances, taskId),
        taskId,
        () => ({ taskName: name }),
      ),
    }));
  },

  updateSettings: (taskId, newSettings) => {
    set((state) => ({
      instances: updateInstance(
        ensureInstance(state.instances, taskId),
        taskId,
        (inst) => ({
          settings: newSettings,
          timeRemaining: !inst.isRunning
            ? getInitialTimeRemaining(inst.currentPhase, newSettings)
            : inst.timeRemaining,
        }),
      ),
    }));
  },

  completeSession: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst) return;

    const now = new Date();
    const sessionDuration = getInitialTimeRemaining(inst.currentPhase, inst.settings);

    const session: PomodoroSession = {
      id: `${now.getTime()}`,
      taskName:
        inst.taskName ||
        `${inst.currentPhase === 'work' ? '作業' : '休憩'}セッション`,
      startTime: new Date(now.getTime() - sessionDuration * 1000),
      endTime: now,
      duration: sessionDuration,
      phase: inst.currentPhase,
      completed: true,
    };

    const newStats = { ...inst.todayStats };
    if (inst.currentPhase === 'work') {
      newStats.completedPomodoros += 1;
      newStats.totalFocusTime += Math.round(sessionDuration / 60);
    } else {
      newStats.totalBreakTime += Math.round(sessionDuration / 60);
    }

    newStats.efficiency =
      newStats.completedPomodoros > 0
        ? Math.round(
            (newStats.completedPomodoros /
              (newStats.completedPomodoros +
                inst.sessions.filter((s) => !s.completed).length)) *
              100,
          )
        : 0;

    set((state) => ({
      instances: updateInstance(state.instances, taskId, () => ({
        sessions: [...inst.sessions, session],
        todayStats: newStats,
      })),
    }));
  },

  nextPhase: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst) return;

    let nextPhase: PomodoroPhase;
    let nextCycle = inst.cycle;

    if (inst.currentPhase === 'work') {
      if (inst.cycle >= inst.settings.longBreakInterval) {
        nextPhase = 'long-break';
        nextCycle = 1;
      } else {
        nextPhase = 'short-break';
      }
    } else {
      nextPhase = 'work';
      if (inst.currentPhase === 'short-break') {
        nextCycle = inst.cycle + 1;
      }
    }

    set((state) => ({
      instances: updateInstance(state.instances, taskId, () => ({
        currentPhase: nextPhase,
        cycle: nextCycle,
        timeRemaining: getInitialTimeRemaining(nextPhase, inst.settings),
        taskName: nextPhase === 'work' ? inst.taskName : '',
        totalCycles: nextPhase === 'work' ? inst.totalCycles + 1 : inst.totalCycles,
      })),
    }));
  },

  removeInstance: (taskId) => {
    set((state) => {
      const { [taskId]: _, ...rest } = state.instances;
      return { instances: rest };
    });
  },
}));
