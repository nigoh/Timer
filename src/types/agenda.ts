export interface AgendaItem {
  id: string;
  title: string;
  plannedDuration: number; // 予定時間（秒）
  actualDuration: number;  // 実際の時間（秒）
  status: 'pending' | 'running' | 'paused' | 'completed';
  startTime?: Date;
  endTime?: Date;
  order: number;
}

export interface AgendaSession {
  id: string;
  title: string;
  items: AgendaItem[];
  totalPlannedDuration: number;
  totalActualDuration: number;
  status: 'not-started' | 'in-progress' | 'paused' | 'completed';
  startTime?: Date;
  endTime?: Date;
  currentItemId?: string;
}

export interface AgendaTimerState {
  currentSession: AgendaSession | null;
  sessions: AgendaSession[];
  isRunning: boolean;
  currentTime: number;
  sessionStartTime?: Date;
}
