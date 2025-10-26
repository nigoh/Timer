import { create } from 'zustand';
import { Timer, TimerSession, NotificationSettings, PomodoroSettings, PomodoroTimer } from '../../../types/timer';
import { timerPersistence } from '../services/persistence';

interface TimerState {
  // 繝・・繧ｿ
  timers: Timer[];
  activeTimer: Timer | null;
  sessions: TimerSession[];
  
  // UI迥ｶ諷・
  loading: boolean;
  error: string | null;
  
  // 險ｭ螳・
  notificationSettings: NotificationSettings;
  pomodoroSettings: PomodoroSettings;
}

interface TimerActions {
  // 繧ｿ繧､繝槭・邂｡逅・
  createTimer: (timer: Omit<Timer, 'id' | 'createdAt'>) => Promise<void>;
  updateTimer: (id: string, updates: Partial<Timer>) => Promise<void>;
  deleteTimer: (id: string) => Promise<void>;
  setActiveTimer: (timer: Timer | null) => void;
  
  // 繝昴Δ繝峨・繝ｭ繧ｿ繧､繝槭・蟆ら畑
  createPomodoroTimer: (name: string, category?: string) => Promise<void>;
  updatePomodoroPhase: (id: string, phase: 'work' | 'short-break' | 'long-break', cycle: number) => void;
  
  // 繧ｻ繝・す繝ｧ繝ｳ邂｡逅・
  startSession: (timerId: string) => Promise<void>;
  endSession: (sessionId: string, data: Partial<TimerSession>) => Promise<void>;
  
  // 險ｭ螳夂ｮ｡逅・
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => Promise<void>;
  
  // 繝・・繧ｿ邂｡逅・
  loadAllData: () => Promise<void>;
  saveTimer: (timer: Timer) => Promise<void>;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
  
  // 繧ｨ繝ｩ繝ｼ邂｡逅・
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

type TimerStore = TimerState & TimerActions;

export const useTimerStore = create<TimerStore>((set, get) => ({
  // 蛻晄悄迥ｶ諷・
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

  // 繧｢繧ｯ繧ｷ繝ｧ繝ｳ
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
      
      await timerPersistence.saveTimer(newTimer);
      
      set((state) => ({
        timers: [...state.timers, newTimer],
        loading: false,
      }));
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : '繧ｿ繧､繝槭・縺ｮ菴懈・縺ｫ螟ｱ謨励＠縺ｾ縺励◆' 
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
      
      await timerPersistence.saveTimer(newPomodoroTimer);
      
      set((state) => ({
        timers: [...state.timers, newPomodoroTimer],
        loading: false,
      }));
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : '繝昴Δ繝峨・繝ｭ繧ｿ繧､繝槭・縺ｮ菴懈・縺ｫ螟ｱ謨励＠縺ｾ縺励◆' 
      });
    }
  },

  updateTimer: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      
      const state = get();
      const timer = state.timers.find(t => t.id === id);
      if (!timer) throw new Error('繧ｿ繧､繝槭・縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ');
      
      const updatedTimer = { ...timer, ...updates };
      await timerPersistence.saveTimer(updatedTimer);
      
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
        error: error instanceof Error ? error.message : '繧ｿ繧､繝槭・縺ｮ譖ｴ譁ｰ縺ｫ螟ｱ謨励＠縺ｾ縺励◆' 
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
      
      await timerPersistence.deleteTimer(id);
      
      set((state) => ({
        timers: state.timers.filter(timer => timer.id !== id),
        activeTimer: state.activeTimer?.id === id ? null : state.activeTimer,
        loading: false,
      }));
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : '繧ｿ繧､繝槭・縺ｮ蜑企勁縺ｫ螟ｱ謨励＠縺ｾ縺励◆' 
      });
    }
  },

  setActiveTimer: (timer) => {
    set({ activeTimer: timer });
  },

  startSession: async (timerId) => {
    try {
      const timer = get().timers.find((t) => t.id === timerId);
      if (!timer) {
        throw new Error('繧ｿ繧､繝槭・縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ');
      }

      const newSession: TimerSession = {
        id: crypto.randomUUID(),
        timerId,
        timerName: timer.name,
        plannedDuration: timer.duration,
        actualDuration: 0,
        startTime: new Date(),
        status: 'interrupted',
        interruptions: 0,
        tags: [],
      };
      
      await timerPersistence.saveSession(newSession);
      
      set((state) => ({
        sessions: [...state.sessions, newSession],
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '繧ｻ繝・す繝ｧ繝ｳ縺ｮ髢句ｧ九↓螟ｱ謨励＠縺ｾ縺励◆' 
      });
    }
  },

  endSession: async (sessionId, data) => {
    try {
      const state = get();
      const session = state.sessions.find(s => s.id === sessionId);
      if (!session) throw new Error('繧ｻ繝・す繝ｧ繝ｳ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ');
      
      const updatedSession: TimerSession = {
        ...session,
        ...data,
        actualDuration: data.actualDuration ?? session.actualDuration,
        status: data.status ?? 'completed',
        endTime: new Date(),
      };
      await timerPersistence.saveSession(updatedSession);
      
      set((state) => ({
        sessions: state.sessions.map(session =>
          session.id === sessionId ? updatedSession : session
        ),
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '繧ｻ繝・す繝ｧ繝ｳ縺ｮ邨ゆｺ・↓螟ｱ謨励＠縺ｾ縺励◆' 
      });
    }
  },

  updateNotificationSettings: async (settings) => {
    try {
      const newSettings = { ...get().notificationSettings, ...settings };
      await timerPersistence.saveNotificationSettings(newSettings);
      
      set({ notificationSettings: newSettings });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '騾夂衍險ｭ螳壹・譖ｴ譁ｰ縺ｫ螟ｱ謨励＠縺ｾ縺励◆' 
      });
    }
  },

  updatePomodoroSettings: async (settings) => {
    try {
      const newSettings = { ...get().pomodoroSettings, ...settings };
      await timerPersistence.savePomodoroSettings(newSettings);
      
      set({ pomodoroSettings: newSettings });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '繝昴Δ繝峨・繝ｭ險ｭ螳壹・譖ｴ譁ｰ縺ｫ螟ｱ謨励＠縺ｾ縺励◆' 
      });
    }
  },

  loadAllData: async () => {
    try {
      set({ loading: true, error: null });
      
      // 繝・・繧ｿ繝吶・繧ｹ蛻晄悄蛹・
      await timerPersistence.initializeDatabase();
      
      // 蜷・ｨｮ繝・・繧ｿ繧剃ｸｦ陦後〒隱ｭ縺ｿ霎ｼ縺ｿ
      const [timers, notificationSettings, pomodoroSettings] = await Promise.all([
        timerPersistence.getTimers(),
        timerPersistence.getNotificationSettings(),
        timerPersistence.getPomodoroSettings(),
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
        error: error instanceof Error ? error.message : '繝・・繧ｿ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ縺ｫ螟ｱ謨励＠縺ｾ縺励◆' 
      });
    }
  },

  saveTimer: async (timer) => {
    try {
      await timerPersistence.saveTimer(timer);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '繧ｿ繧､繝槭・縺ｮ菫晏ｭ倥↓螟ｱ謨励＠縺ｾ縺励◆' 
      });
    }
  },

  exportData: async () => {
    try {
      return await timerPersistence.exportData();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '繝・・繧ｿ縺ｮ繧ｨ繧ｯ繧ｹ繝昴・繝医↓螟ｱ謨励＠縺ｾ縺励◆' 
      });
      return '';
    }
  },

  importData: async (data) => {
    try {
      set({ loading: true, error: null });
      
      await timerPersistence.importData(data);
      await get().loadAllData(); // 繝・・繧ｿ繧貞・隱ｭ縺ｿ霎ｼ縺ｿ
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : '繝・・繧ｿ縺ｮ繧､繝ｳ繝昴・繝医↓螟ｱ謨励＠縺ｾ縺励◆' 
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


