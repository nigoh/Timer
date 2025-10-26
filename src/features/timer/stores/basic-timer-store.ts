import { create } from 'zustand';
import { BasicTimerHistory } from '@/types/timer';

interface BasicTimerState {
  duration: number;
  remainingTime: number;
  isRunning: boolean;
  isPaused: boolean;
  sessionId: string | null;
  sessionStartTime: Date | null;
  sessionLabel: string;
  history: BasicTimerHistory[];
  showHistory: boolean;
  showSettings: boolean;
}

interface BasicTimerActions {
  setDuration: (duration: number) => void;
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  setSessionLabel: (label: string) => void;
  completeSession: () => void;
  addToHistory: (entry: Omit<BasicTimerHistory, 'id'>) => void;
  clearHistory: () => void;
  deleteHistoryEntry: (id: string) => void;
  toggleHistory: () => void;
  toggleSettings: () => void;
  tick: () => void;
}

type BasicTimerStore = BasicTimerState & BasicTimerActions;

export const useBasicTimerStore = create<BasicTimerStore>((set, get) => ({
  duration: 25 * 60,
  remainingTime: 25 * 60,
  isRunning: false,
  isPaused: false,
  sessionId: null,
  sessionStartTime: null,
  sessionLabel: '',
  history: [],
  showHistory: false,
  showSettings: false,

  setDuration: (duration) => {
    set((state) => ({
      duration,
      remainingTime: state.isRunning ? state.remainingTime : duration,
    }));
  },

  start: () => {
    const state = get();
    const now = new Date();

    set({
      isRunning: true,
      isPaused: false,
      sessionId: state.sessionId || crypto.randomUUID(),
      sessionStartTime: state.sessionStartTime || now,
    });
  },

  pause: () => {
    set({
      isRunning: false,
      isPaused: true,
    });
  },

  stop: () => {
    const state = get();

    if (state.sessionStartTime) {
      const now = new Date();
      const actualDuration = Math.floor((now.getTime() - state.sessionStartTime.getTime()) / 1000);

      get().addToHistory({
        duration: state.duration,
        actualDuration,
        startTime: state.sessionStartTime,
        endTime: now,
        completed: false,
        label: state.sessionLabel || `${Math.ceil(state.duration / 60)}分タイマー`,
      });
    }

    set({
      isRunning: false,
      isPaused: false,
      remainingTime: state.duration,
      sessionId: null,
      sessionStartTime: null,
      sessionLabel: '',
    });
  },

  reset: () => {
    const state = get();
    set({
      isRunning: false,
      isPaused: false,
      remainingTime: state.duration,
      sessionId: null,
      sessionStartTime: null,
      sessionLabel: '',
    });
  },

  setSessionLabel: (label) => {
    set({ sessionLabel: label });
  },

  completeSession: () => {
    const state = get();

    if (state.sessionStartTime) {
      const now = new Date();
      const actualDuration = Math.floor((now.getTime() - state.sessionStartTime.getTime()) / 1000);

      get().addToHistory({
        duration: state.duration,
        actualDuration,
        startTime: state.sessionStartTime,
        endTime: now,
        completed: true,
        label: state.sessionLabel || `${Math.ceil(state.duration / 60)}分タイマー`,
      });
    }

    set({
      isRunning: false,
      isPaused: false,
      remainingTime: state.duration,
      sessionId: null,
      sessionStartTime: null,
      sessionLabel: '',
    });
  },

  addToHistory: (entry) => {
    const newEntry: BasicTimerHistory = {
      ...entry,
      id: crypto.randomUUID(),
    };

    set((state) => ({
      history: [newEntry, ...state.history],
    }));
  },

  clearHistory: () => {
    set({ history: [] });
  },

  deleteHistoryEntry: (id) => {
    set((state) => ({
      history: state.history.filter((entry) => entry.id !== id),
    }));
  },

  toggleHistory: () => {
    set((state) => ({ showHistory: !state.showHistory }));
  },

  toggleSettings: () => {
    set((state) => ({ showSettings: !state.showSettings }));
  },

  tick: () => {
    const state = get();
    if (!state.isRunning) return;

    const newRemainingTime = Math.max(0, state.remainingTime - 1);

    set({ remainingTime: newRemainingTime });

    if (newRemainingTime === 0) {
      get().completeSession();
    }
  },
}));

