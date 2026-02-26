import { create } from 'zustand';
import { useBasicTimerStore } from './basic-timer-store';
import { usePomodoroStore } from './pomodoro-store';
import { useMultiTimerStore } from './multi-timer-store';
import { useAgendaTimerStore } from './agenda-timer-store';

interface TickManagerState {
  isGlobalTickActive: boolean;
  intervalId: number | null;
}

interface TickManagerActions {
  startGlobalTick: () => void;
  stopGlobalTick: () => void;
}

type TickManagerStore = TickManagerState & TickManagerActions;

const performTick = () => {
  // Basic timer: tick running instances
  const basicState = useBasicTimerStore.getState();
  for (const taskId of Object.keys(basicState.instances)) {
    const inst = basicState.instances[taskId];
    if (inst?.isRunning) {
      basicState.tick(taskId);
    }
  }

  // Pomodoro: tick running instances
  const pomodoroState = usePomodoroStore.getState();
  for (const taskId of Object.keys(pomodoroState.instances)) {
    const inst = pomodoroState.instances[taskId];
    if (inst?.isRunning) {
      pomodoroState.tick(taskId);
    }
  }

  // Multi-timer: tick instances with any running timer
  const multiState = useMultiTimerStore.getState();
  for (const taskId of Object.keys(multiState.instances)) {
    const inst = multiState.instances[taskId];
    if (inst?.isAnyRunning) {
      multiState.tick(taskId);
    }
  }

  // Agenda timer: tick running instances (delta-based)
  const agendaState = useAgendaTimerStore.getState();
  for (const taskId of Object.keys(agendaState.instances)) {
    const inst = agendaState.instances[taskId];
    if (inst?.isRunning) {
      agendaState.tick(taskId);
    }
  }
};

export const useTickManagerStore = create<TickManagerStore>((set, get) => ({
  isGlobalTickActive: false,
  intervalId: null,

  startGlobalTick: () => {
    const state = get();
    if (state.isGlobalTickActive) return;

    const id = window.setInterval(performTick, 1000);
    set({ isGlobalTickActive: true, intervalId: id });
  },

  stopGlobalTick: () => {
    const state = get();
    if (state.intervalId !== null) {
      window.clearInterval(state.intervalId);
    }
    set({ isGlobalTickActive: false, intervalId: null });
  },
}));
