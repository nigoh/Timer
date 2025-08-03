export interface AgendaItem {
  id: string;
  title: string;
  plannedDuration: number; // 予定時間（秒）
  memo?: string; // メモ
  actualDuration: number;  // 実際の時間（秒）
  status: 'pending' | 'running' | 'paused' | 'completed' | 'overtime';
  startTime?: Date;
  endTime?: Date;
  order: number;
  remainingTime: number; // 残り時間（秒、負の値は超過を表す）
}

export interface Meeting {
  id: string;
  title: string;
  agenda: AgendaItem[];
  totalPlannedDuration: number;
  totalActualDuration: number;
  status: 'not-started' | 'in-progress' | 'paused' | 'completed';
  startTime?: Date;
  endTime?: Date;
  currentAgendaId?: string;
  settings: {
    autoTransition: boolean; // 自動遷移
    silentMode: boolean; // サイレントモード（バイブのみ）
    bellSettings: {
      start: boolean; // 開始時ベル
      fiveMinWarning: boolean; // 残り5分警告
      end: boolean; // 終了時ベル
      overtime: boolean; // 超過時ベル
      soundType: 'single' | 'double' | 'loop'; // ベル音の種類
    };
  };
}

export interface AgendaTimerState {
  currentMeeting: Meeting | null;
  meetings: Meeting[];
  isRunning: boolean;
  currentTime: number;
  meetingStartTime?: Date;
  lastTickTime?: number; // バックグラウンド対応用
}
