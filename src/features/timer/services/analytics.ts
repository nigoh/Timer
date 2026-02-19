import {
  AnalyticsFilter,
  AnalyticsResult,
  DonutSegment,
  Granularity,
  HeatmapCell,
  KpiSummary,
  TrendPoint,
} from '@/types/analytics';
import { BasicTimerHistory } from '@/types/timer';
import { PomodoroSession } from '@/types/pomodoro';
import { Meeting } from '@/types/agenda';

const MILLISECONDS_PER_DAY = 86400000;

function secondsToMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

// ──────────────────────────────────────────────
// Public interface (Option B abstraction stub)
// ──────────────────────────────────────────────
export interface IAnalyticsService {
  compute(filter: AnalyticsFilter, data: RawData): AnalyticsResult;
}

// Raw data pulled from Zustand stores by the hook/container
export interface RawData {
  basicHistory: BasicTimerHistory[];
  pomodoroSessions: PomodoroSession[];
  meetings: Meeting[];
  multiCompletedCount: number;
  multiTotalCount: number;
  multiCategoryMap: Record<string, number>; // category → focus minutes
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function periodLabel(date: Date, granularity: Granularity): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  if (granularity === 'day') return `${y}-${m}-${d}`;
  if (granularity === 'month') return `${y}-${m}`;
  // week: ISO week label
  const startOfYear = new Date(y, 0, 1);
  const week = Math.ceil(
    ((date.getTime() - startOfYear.getTime()) / MILLISECONDS_PER_DAY + startOfYear.getDay() + 1) / 7,
  );
  return `${y}-W${String(week).padStart(2, '0')}`;
}

function buildPeriodLabels(filter: AnalyticsFilter): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();
  const cur = new Date(filter.since);
  cur.setHours(0, 0, 0, 0);
  const until = new Date(filter.until);
  until.setHours(23, 59, 59, 999);
  while (cur <= until) {
    const lbl = periodLabel(cur, filter.granularity);
    if (!seen.has(lbl)) {
      seen.add(lbl);
      labels.push(lbl);
    }
    if (filter.granularity === 'month') {
      cur.setMonth(cur.getMonth() + 1);
    } else if (filter.granularity === 'week') {
      cur.setDate(cur.getDate() + 7);
    } else {
      cur.setDate(cur.getDate() + 1);
    }
  }
  return labels;
}

function inRange(date: Date, filter: AnalyticsFilter): boolean {
  const t = date.getTime();
  return t >= filter.since.getTime() && t <= filter.until.getTime();
}

// ──────────────────────────────────────────────
// LocalAggregator – client-side implementation
// ──────────────────────────────────────────────
export class LocalAnalyticsService implements IAnalyticsService {
  compute(filter: AnalyticsFilter, data: RawData): AnalyticsResult {
    const periodLabels = buildPeriodLabels(filter);
    const trendMap = new Map<string, TrendPoint>(
      periodLabels.map((lbl) => [
        lbl,
        { label: lbl, focusMinutes: 0, sessions: 0, completedSessions: 0 },
      ]),
    );
    const heatmapMap = new Map<string, HeatmapCell>();

    // ── Basic timer ──────────────────────────────
    const includeBasic = !filter.timerKind || filter.timerKind === 'basic';
    if (includeBasic) {
      for (const h of data.basicHistory) {
        const start = new Date(h.startTime);
        if (!inRange(start, filter)) continue;
        const lbl = periodLabel(start, filter.granularity);
        const pt = trendMap.get(lbl);
        if (pt) {
          pt.focusMinutes += secondsToMinutes(h.actualDuration);
          pt.sessions += 1;
          if (h.completed) pt.completedSessions += 1;
        }
        accumulateHeatmap(heatmapMap, start, secondsToMinutes(h.actualDuration));
      }
    }

    // ── Pomodoro ─────────────────────────────────
    const includePomodoro = !filter.timerKind || filter.timerKind === 'pomodoro';
    let pomodoroTotal = 0;
    let pomodoroCompleted = 0;
    if (includePomodoro) {
      for (const s of data.pomodoroSessions) {
        if (s.phase !== 'work') continue;
        const start = new Date(s.startTime);
        if (!inRange(start, filter)) continue;
        pomodoroTotal += 1;
        const lbl = periodLabel(start, filter.granularity);
        const pt = trendMap.get(lbl);
        const mins = secondsToMinutes(s.duration);
        if (pt) {
          pt.focusMinutes += mins;
          pt.sessions += 1;
          if (s.completed) {
            pt.completedSessions += 1;
            pomodoroCompleted += 1;
          }
        }
        accumulateHeatmap(heatmapMap, start, mins);
      }
    }

    // ── Agenda (meetings) ─────────────────────────
    const includeAgenda = !filter.timerKind || filter.timerKind === 'agenda';
    let overtimeAgendas = 0;
    let totalAgendas = 0;
    if (includeAgenda) {
      for (const meeting of data.meetings) {
        for (const item of meeting.agenda) {
          if (!item.startTime) continue;
          const start = new Date(item.startTime);
          if (!inRange(start, filter)) continue;
          totalAgendas += 1;
          const lbl = periodLabel(start, filter.granularity);
          const pt = trendMap.get(lbl);
          const mins = secondsToMinutes(item.actualDuration);
          if (pt) {
            pt.focusMinutes += mins;
            pt.sessions += 1;
            if (item.status === 'completed') pt.completedSessions += 1;
          }
          if (item.actualDuration > item.plannedDuration) overtimeAgendas += 1;
          accumulateHeatmap(heatmapMap, start, mins);
        }
      }
    }

    // ── Multi timer ───────────────────────────────
    // multi timer sessions are tracked via completedAt on timers; we use
    // aggregated totals passed from the container for simplicity.

    // ── KPI ──────────────────────────────────────
    let totalFocusMinutes = 0;
    let totalSessions = 0;
    let totalCompleted = 0;
    for (const pt of trendMap.values()) {
      totalFocusMinutes += pt.focusMinutes;
      totalSessions += pt.sessions;
      totalCompleted += pt.completedSessions;
    }

    const kpi: KpiSummary = {
      focusMinutes: totalFocusMinutes,
      sessions: totalSessions,
      completedSessions: totalCompleted,
      pomodoroAchievementRate:
        pomodoroTotal > 0 ? Math.round((pomodoroCompleted / pomodoroTotal) * 100) : 0,
      meetingOvertimeRate:
        totalAgendas > 0 ? Math.round((overtimeAgendas / totalAgendas) * 100) : 0,
    };

    // ── Donut ────────────────────────────────────
    const donut = buildDonut(filter, data);

    return {
      kpi,
      trend: periodLabels.map((lbl) => trendMap.get(lbl)!),
      heatmap: Array.from(heatmapMap.values()),
      donut,
    };
  }
}

function accumulateHeatmap(
  map: Map<string, HeatmapCell>,
  start: Date,
  minutes: number,
): void {
  const weekday = start.getDay();
  const hour = start.getHours();
  const key = `${weekday}-${hour}`;
  const existing = map.get(key);
  if (existing) {
    existing.minutes += minutes;
  } else {
    map.set(key, { weekday, hour, minutes });
  }
}

function buildDonut(filter: AnalyticsFilter, data: RawData): DonutSegment[] {
  const segments: DonutSegment[] = [];

  if (!filter.timerKind || filter.timerKind === 'basic') {
    const mins = data.basicHistory
      .filter((h) => inRange(new Date(h.startTime), filter))
      .reduce((sum, h) => sum + secondsToMinutes(h.actualDuration), 0);
    if (mins > 0) segments.push({ name: '基本タイマー', value: mins });
  }

  if (!filter.timerKind || filter.timerKind === 'pomodoro') {
    const mins = data.pomodoroSessions
      .filter((s) => s.phase === 'work' && inRange(new Date(s.startTime), filter))
      .reduce((sum, s) => sum + secondsToMinutes(s.duration), 0);
    if (mins > 0) segments.push({ name: 'ポモドーロ', value: mins });
  }

  if (!filter.timerKind || filter.timerKind === 'agenda') {
    const mins = data.meetings
      .flatMap((m) => m.agenda)
      .filter((a) => a.startTime && inRange(new Date(a.startTime), filter))
      .reduce((sum, a) => sum + secondsToMinutes(a.actualDuration), 0);
    if (mins > 0) segments.push({ name: 'アジェンダ', value: mins });
  }

  // Multi-timer categories
  if (!filter.timerKind || filter.timerKind === 'multi') {
    for (const [cat, mins] of Object.entries(data.multiCategoryMap)) {
      if (mins > 0) segments.push({ name: cat, value: mins });
    }
  }

  return segments;
}

export const localAnalyticsService = new LocalAnalyticsService();
