import Dexie, { Table } from 'dexie';
import { Timer, TimerSession, PomodoroSettings, NotificationSettings } from '@/types/timer';

export interface DBTimer extends Omit<Timer, 'createdAt'> {
  id?: string;
  createdAt: string; // Date -> string for IndexedDB
}

export interface DBTimerSession extends Omit<TimerSession, 'startTime' | 'endTime'> {
  id?: string;
  startTime: string;
  endTime?: string;
}

export interface DBSettings {
  key: string;
  value: any;
}

class TimerDatabase extends Dexie {
  timers!: Table<DBTimer>;
  sessions!: Table<DBTimerSession>;
  settings!: Table<DBSettings>;

  constructor() {
    super('TimerAppDatabase');
    
    this.version(1).stores({
      timers: '++id, name, status, createdAt, category',
      sessions: '++id, timerId, startTime, endTime, duration, tags',
      settings: 'key'
    });
  }
}

export const db = new TimerDatabase();

// データ操作ヘルパー
export const timerDB = {
  // タイマー操作
  async saveTimer(timer: Timer): Promise<void> {
    const dbTimer: DBTimer = {
      ...timer,
      createdAt: timer.createdAt.toISOString(),
    };
    await db.timers.put(dbTimer);
  },

  async getTimers(): Promise<Timer[]> {
    const dbTimers = await db.timers.orderBy('createdAt').reverse().toArray();
    return dbTimers.map(timer => ({
      ...timer,
      createdAt: new Date(timer.createdAt),
    }));
  },

  async getTimer(id: string): Promise<Timer | undefined> {
    const dbTimer = await db.timers.get(id);
    if (!dbTimer) return undefined;
    
    return {
      ...dbTimer,
      createdAt: new Date(dbTimer.createdAt),
    };
  },

  async deleteTimer(id: string): Promise<void> {
    await db.transaction('rw', db.timers, db.sessions, async () => {
      await db.timers.delete(id);
      await db.sessions.where('timerId').equals(id).delete();
    });
  },

  // セッション操作
  async saveSession(session: TimerSession): Promise<void> {
    const dbSession: DBTimerSession = {
      ...session,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
    };
    await db.sessions.put(dbSession);
  },

  async getSessionsByTimerId(timerId: string): Promise<TimerSession[]> {
    const dbSessions = await db.sessions
      .where('timerId')
      .equals(timerId)
      .orderBy('startTime')
      .reverse()
      .toArray();
    
    return dbSessions.map(session => ({
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
    }));
  },

  async getSessionsByDateRange(startDate: Date, endDate: Date): Promise<TimerSession[]> {
    const dbSessions = await db.sessions
      .where('startTime')
      .between(startDate.toISOString(), endDate.toISOString())
      .toArray();
    
    return dbSessions.map(session => ({
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
    }));
  },

  // 設定操作
  async saveSetting<T>(key: string, value: T): Promise<void> {
    await db.settings.put({ key, value });
  },

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const setting = await db.settings.get(key);
    return setting ? setting.value : defaultValue;
  },

  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    await this.saveSetting('notificationSettings', settings);
  },

  async getNotificationSettings(): Promise<NotificationSettings> {
    return await this.getSetting('notificationSettings', {
      enabled: true,
      sound: true,
      browser: true,
      soundVolume: 50,
      customSounds: {},
      vibration: false,
    });
  },

  async savePomodoroSettings(settings: PomodoroSettings): Promise<void> {
    await this.saveSetting('pomodoroSettings', settings);
  },

  async getPomodoroSettings(): Promise<PomodoroSettings> {
    return await this.getSetting('pomodoroSettings', {
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
    });
  },

  // データエクスポート/インポート
  async exportData(): Promise<string> {
    const timers = await db.timers.toArray();
    const sessions = await db.sessions.toArray();
    const settings = await db.settings.toArray();

    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: { timers, sessions, settings }
    }, null, 2);
  },

  async importData(jsonData: string): Promise<void> {
    const { data } = JSON.parse(jsonData);

    await db.transaction('rw', db.timers, db.sessions, db.settings, async () => {
      await db.timers.clear();
      await db.sessions.clear();
      await db.settings.clear();

      if (data.timers) await db.timers.bulkAdd(data.timers);
      if (data.sessions) await db.sessions.bulkAdd(data.sessions);
      if (data.settings) await db.settings.bulkAdd(data.settings);
    });
  },

  // データベース初期化
  async initializeDatabase(): Promise<void> {
    try {
      await db.open();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  },

  // データベースクリア（開発用）
  async clearDatabase(): Promise<void> {
    await db.transaction('rw', db.timers, db.sessions, db.settings, async () => {
      await db.timers.clear();
      await db.sessions.clear();
      await db.settings.clear();
    });
    console.log('Database cleared');
  },
};
