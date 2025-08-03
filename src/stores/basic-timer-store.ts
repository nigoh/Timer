import { create } from 'zustand';
import { BasicTimerHistory } from '../types/timer';

interface BasicTimerState {
  // タイマー設定
  duration: number;           // 設定時間（秒）
  remainingTime: number;      // 残り時間（秒）
  isRunning: boolean;
  isPaused: boolean;
  
  // セッション管理
  sessionId: string | null;
  sessionStartTime: Date | null;
  sessionLabel: string;
  
  // 履歴
  history: BasicTimerHistory[];
  
  // UI状態
  showHistory: boolean;
  showSettings: boolean;
}

interface BasicTimerActions {
  // タイマー制御
  setDuration: (duration: number) => void;
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  
  // セッション管理
  setSessionLabel: (label: string) => void;
  completeSession: () => void;
  
  // 履歴管理
  addToHistory: (entry: Omit<BasicTimerHistory, 'id'>) => void;
  clearHistory: () => void;
  deleteHistoryEntry: (id: string) => void;
  
  // UI制御
  toggleHistory: () => void;
  toggleSettings: () => void;
  
  // 時間更新
  tick: () => void;
}

type BasicTimerStore = BasicTimerState & BasicTimerActions;

export const useBasicTimerStore = create<BasicTimerStore>((set, get) => ({
  // 初期状態
  duration: 25 * 60,          // 25分
  remainingTime: 25 * 60,
  isRunning: false,
  isPaused: false,
  sessionId: null,
  sessionStartTime: null,
  sessionLabel: '',
  history: [],
  showHistory: false,
  showSettings: false,

  // アクション
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
      
      // 履歴に追加
      get().addToHistory({
        duration: state.duration,
        actualDuration,
        startTime: state.sessionStartTime,
        endTime: now,
        completed: false, // 手動停止なので未完了
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
      
      // 履歴に追加
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
      history: [newEntry, ...state.history], // 新しいものを先頭に
    }));
  },

  clearHistory: () => {
    set({ history: [] });
  },

  deleteHistoryEntry: (id) => {
    set((state) => ({
      history: state.history.filter(entry => entry.id !== id),
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
    
    // タイマー完了
    if (newRemainingTime === 0) {
      get().completeSession();
    }
  },
}));
