import { db, DBTimer, DBTimerSession } from '@/lib/database';
import type {
  NotificationSettings,
  PomodoroSettings,
  Timer,
  TimerSession,
} from '@/types/timer';

export const timerPersistence = {
  async saveTimer(timer: Timer): Promise<void> {
    const dbTimer: DBTimer = {
      ...timer,
      createdAt: timer.createdAt.toISOString(),
    };
    await db.timers.put(dbTimer);
  },

  async getTimers(): Promise<Timer[]> {
    const dbTimers = await db.timers.orderBy('createdAt').reverse().toArray();
    return dbTimers.map((timer) => ({
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

  async saveSession(session: TimerSession): Promise<void> {
    const dbSession: DBTimerSession = {
      ...session,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
    };
    await db.sessions.put(dbSession);
  },

  async getSessionsByTimerId(timerId: string): Promise<TimerSession[]> {
    const dbSessions = await db.sessions.where('timerId').equals(timerId).toArray();

    return dbSessions
      .sort((a, b) => b.startTime.localeCompare(a.startTime))
      .map((session) => ({
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

    return dbSessions.map((session) => ({
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
    }));
  },

  async saveSetting<T>(key: string, value: T): Promise<void> {
    await db.settings.put({ key, value });
  },

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const setting = await db.settings.get(key);
    return setting ? (setting.value as T) : defaultValue;
  },

  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    await this.saveSetting('notificationSettings', settings);
  },

  async getNotificationSettings(): Promise<NotificationSettings> {
    return this.getSetting('notificationSettings', {
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
    return this.getSetting('pomodoroSettings', {
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

  async exportData(): Promise<string> {
    const timers = await db.timers.toArray();
    const sessions = await db.sessions.toArray();
    const settings = await db.settings.toArray();

    return JSON.stringify(
      {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: { timers, sessions, settings },
      },
      null,
      2,
    );
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

  async initializeDatabase(): Promise<void> {
    try {
      await db.open();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  },

  async clearDatabase(): Promise<void> {
    await db.transaction('rw', db.timers, db.sessions, db.settings, async () => {
      await db.timers.clear();
      await db.sessions.clear();
      await db.settings.clear();
    });
    console.log('Database cleared');
  },
};

