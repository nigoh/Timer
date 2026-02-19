export type Granularity = 'day' | 'week' | 'month';
export type TimerKind = 'basic' | 'pomodoro' | 'multi' | 'agenda';

export interface AnalyticsFilter {
  since: Date;
  until: Date;
  granularity: Granularity;
  timerKind?: TimerKind;
}

export interface TrendPoint {
  label: string;
  focusMinutes: number;
  sessions: number;
  completedSessions: number;
}

export interface KpiSummary {
  focusMinutes: number;
  sessions: number;
  completedSessions: number;
  pomodoroAchievementRate: number;
  meetingOvertimeRate: number;
}

export interface HeatmapCell {
  weekday: number;
  hour: number;
  minutes: number;
}

export interface DonutSegment {
  name: string;
  value: number;
}

export interface AnalyticsResult {
  kpi: KpiSummary;
  trend: TrendPoint[];
  heatmap: HeatmapCell[];
  donut: DonutSegment[];
}
