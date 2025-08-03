import { create } from 'zustand';
import { Timer, TimerSession, NotificationSettings, PomodoroSettings, PomodoroTimer } from '../../../types/timer';
import { timerDB } from '../../../lib/database';

interface TimerState {
  // データ
  timers: Timer[];
  activeTimer: Timer | null;
  sessions: TimerSession[];
  
  // UI状態
  loading: boolean;
  error: string | null;
  
  // 設定
  notificationSettings: NotificationSettings;
  pomodoroSettings: PomodoroSettings;
}

interface TimerActions {
  // タイマー管理
  createTimer: (timer: Omit<Timer, 'id' | 'createdAt'>) => Promise<void>;
  updateTimer: (id: string, updates: Partial<Timer>) => Promise<void>;
  deleteTimer: (id: string) => Promise<void>;
  setActiveTimer: (timer: Timer | null) => void;
  
  // ポモドーロタイマー専用
  createPomodoroTimer: (name: string, category?: string) => Promise<void>;
  updatePomodoroPhase: (id: string, phase: 'work' | 'short-break' | 'long-break', cycle: number) => void;
  
  // セッション管理
  startSession: (timerId: string) => Promise<void>;
  endSession: (sessionId: string, data: Partial<TimerSession>) => Promise<void>;
  
  // 設定管理
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => Promise<void>;
  
  // データ管理
  loadAllData: () => Promise<void>;
  saveTimer: (timer: Timer) => Promise<void>;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
  
  // エラー管理
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

type TimerStore = TimerState & TimerActions;

export const useTimerStore = create<TimerStore>((set, get) => ({
  // 初期状態
  timers: [],
  activeTimer: null,
  sessions: [],
  loading: false,
  error: null,
  notificationSettings: {
    enabled: true,
    sound: true,
    browser: true,
    soundVolume: 50,
    customSounds: {},
    vibration: false,
  },
  pomodoroSettings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    theme: {
      work: 'hsl(220, 98%, 61%)',
      shortBreak: 'hsl(142, 71%, 45%)',
      longBreak: 'hsl(262, 83%, 58%)',
    },
  },

  // アクション
  createTimer: async (timerData) => {
    try {
      set({ loading: true, error: null });
      
      const newTimer: Timer = {
        ...timerData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        remainingTime: timerData.duration,
        status: 'idle',
      };
      
      await timerDB.saveTimer(newTimer);
      
      set((state) => ({
        timers: [...state.timers, newTimer],
        loading: false,
      }));
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'タイマーの作成に失敗しました' 
      });
    }
  },

  createPomodoroTimer: async (name, category) => {
    try {
      set({ loading: true, error: null });
      
      const { pomodoroSettings } = get();
      const workDurationSeconds = pomodoroSettings.workDuration * 60;
      
      const newPomodoroTimer: PomodoroTimer = {
        id: crypto.randomUUID(),
        name,
        category: category || '',
        duration: workDurationSeconds,
        remainingTime: workDurationSeconds,
        status: 'idle',
        createdAt: new Date(),
        type: 'pomodoro',
        theme: {
          color: 'default',
          variant: 'default',
          size: 'default',
        },
        notificationEnabled: true,
        soundEnabled: true,
        pomodoroData: {
          phase: 'work',
          cycle: 1,
          totalCycles: 0,
          settings: pomodoroSettings,
        },
      };
      
      await timerDB.saveTimer(newPomodoroTimer);
      
      set((state) => ({
        timers: [...state.timers, newPomodoroTimer],
        loading: false,
      }));
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'ポモドーロタイマーの作成に失敗しました' 
      });
    }
  },

  updateTimer: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      
      const state = get();
      const timer = state.timers.find(t => t.id === id);
      if (!timer) throw new Error('タイマーが見つかりません');
      
      const updatedTimer = { ...timer, ...updates };
      await timerDB.saveTimer(updatedTimer);
      
      set((state) => ({
        timers: state.timers.map(timer => 
          timer.id === id ? updatedTimer : timer
        ),
        activeTimer: state.activeTimer?.id === id 
          ? updatedTimer 
          : state.activeTimer,
        loading: false,
      }));
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'タイマーの更新に失敗しました' 
      });
    }
  },

  updatePomodoroPhase: (id, phase, cycle) => {
    set((state) => ({
      timers: state.timers.map(timer => {
        if (timer.id === id && timer.type === 'pomodoro') {
          const pomodoroTimer = timer as PomodoroTimer;
          const phaseDuration = phase === 'work' 
            ? pomodoroTimer.pomodoroData.settings.workDuration * 60
            : phase === 'short-break'
            ? pomodoroTimer.pomodoroData.settings.shortBreakDuration * 60
            : pomodoroTimer.pomodoroData.settings.longBreakDuration * 60;
            
          return {
            ...pomodoroTimer,
            remainingTime: phaseDuration,
            duration: phaseDuration,
            pomodoroData: {
              ...pomodoroTimer.pomodoroData,
              phase,
              cycle,
            },
          };
        }
        return timer;
      }),
    }));
  },

  deleteTimer: async (id) => {
    try {
      set({ loading: true, error: null });
      
      await timerDB.deleteTimer(id);
      
      set((state) => ({
        timers: state.timers.filter(timer => timer.id !== id),
        activeTimer: state.activeTimer?.id === id ? null : state.activeTimer,
        loading: false,
      }));
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'タイマーの削除に失敗しました' 
      });
    }
  },

  setActiveTimer: (timer) => {
    set({ activeTimer: timer });
  },

  startSession: async (timerId) => {
    try {
      const newSession: TimerSession = {
        id: crypto.randomUUID(),
        timerId,
        startTime: new Date(),
        duration: 0,
        interruptions: 0,
        tags: [],
      };
      
      await timerDB.saveSession(newSession);
      
      set((state) => ({
        sessions: [...state.sessions, newSession],
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'セッションの開始に失敗しました' 
      });
    }
  },

  endSession: async (sessionId, data) => {
    try {
      const state = get();
      const session = state.sessions.find(s => s.id === sessionId);
      if (!session) throw new Error('セッションが見つかりません');
      
      const updatedSession = { ...session, ...data, endTime: new Date() };
      await timerDB.saveSession(updatedSession);
      
      set((state) => ({
        sessions: state.sessions.map(session =>
          session.id === sessionId ? updatedSession : session
        ),
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'セッションの終了に失敗しました' 
      });
    }
  },

  updateNotificationSettings: async (settings) => {
    try {
      const newSettings = { ...get().notificationSettings, ...settings };
      await timerDB.saveNotificationSettings(newSettings);
      
      set({ notificationSettings: newSettings });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '通知設定の更新に失敗しました' 
      });
    }
  },

  updatePomodoroSettings: async (settings) => {
    try {
      const newSettings = { ...get().pomodoroSettings, ...settings };
      await timerDB.savePomodoroSettings(newSettings);
      
      set({ pomodoroSettings: newSettings });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'ポモドーロ設定の更新に失敗しました' 
      });
    }
  },

  loadAllData: async () => {
    try {
      set({ loading: true, error: null });
      
      // データベース初期化
      await timerDB.initializeDatabase();
      
      // 各種データを並行で読み込み
      const [timers, notificationSettings, pomodoroSettings] = await Promise.all([
        timerDB.getTimers(),
        timerDB.getNotificationSettings(),
        timerDB.getPomodoroSettings(),
      ]);
      
      set({ 
        timers,
        notificationSettings,
        pomodoroSettings,
        loading: false,
      });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'データの読み込みに失敗しました' 
      });
    }
  },

  saveTimer: async (timer) => {
    try {
      await timerDB.saveTimer(timer);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'タイマーの保存に失敗しました' 
      });
    }
  },

  exportData: async () => {
    try {
      return await timerDB.exportData();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'データのエクスポートに失敗しました' 
      });
      return '';
    }
  },

  importData: async (data) => {
    try {
      set({ loading: true, error: null });
      
      await timerDB.importData(data);
      await get().loadAllData(); // データを再読み込み
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'データのインポートに失敗しました' 
      });
    }
  },

  setError: (error) => {
    set({ error });
  },

  setLoading: (loading) => {
    set({ loading });
  },
}));
