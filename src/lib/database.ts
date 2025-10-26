import Dexie, { Table } from 'dexie';
import type { Timer, TimerSession } from '@/types/timer';

export interface DBTimer extends Omit<Timer, 'createdAt'> {
  id: string;
  createdAt: string;
}

export interface DBTimerSession extends Omit<TimerSession, 'startTime' | 'endTime'> {
  id: string;
  startTime: string;
  endTime?: string;
}

export interface DBSettings {
  key: string;
  value: unknown;
}

class TimerDatabase extends Dexie {
  timers!: Table<DBTimer>;
  sessions!: Table<DBTimerSession>;
  settings!: Table<DBSettings>;

  constructor() {
    super('TimerAppDatabase');

    this.version(1).stores({
      timers: 'id, name, status, createdAt, category',
      sessions: 'id, timerId, startTime, endTime, actualDuration, tags',
      settings: 'key',
    });
  }
}

export const db = new TimerDatabase();

