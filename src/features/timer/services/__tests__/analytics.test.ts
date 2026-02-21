import { describe, it, expect, beforeEach } from 'vitest';
import { LocalAnalyticsService, RawData } from '../analytics';
import { AnalyticsFilter } from '@/types/analytics';
import { BasicTimerHistory } from '@/types/timer';
import { PomodoroSession } from '@/types/pomodoro';
import { Meeting } from '@/types/agenda';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function makeDate(daysAgo: number, hour = 10): Date {
  const d = new Date('2025-01-15T00:00:00.000Z');
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function makeFilter(daysAgo: number): AnalyticsFilter {
  const since = makeDate(daysAgo, 0);
  since.setHours(0, 0, 0, 0);
  const until = makeDate(0, 23);
  until.setHours(23, 59, 59, 999);
  return { since, until, granularity: 'day' };
}

function basicHistoryEntry(
  daysAgo: number,
  actualDuration: number,
  completed: boolean,
): BasicTimerHistory {
  const start = makeDate(daysAgo);
  return {
    id: crypto.randomUUID(),
    duration: actualDuration,
    actualDuration,
    startTime: start,
    endTime: new Date(start.getTime() + actualDuration * 1000),
    completed,
  };
}

function pomodoroSession(
  daysAgo: number,
  duration: number,
  completed: boolean,
  phase: 'work' | 'short-break' = 'work',
): PomodoroSession {
  const start = makeDate(daysAgo, 9);
  return {
    id: crypto.randomUUID(),
    taskName: 'task',
    startTime: start,
    endTime: new Date(start.getTime() + duration * 1000),
    duration,
    phase,
    completed,
  };
}

function makeMeeting(
  daysAgo: number,
  agendaItems: { planned: number; actual: number; completed: boolean }[],
): Meeting {
  const start = makeDate(daysAgo, 14);
  return {
    id: crypto.randomUUID(),
    title: 'Meeting',
    agenda: agendaItems.map((item, i) => ({
      id: `a-${i}`,
      title: `Item ${i}`,
      plannedDuration: item.planned,
      actualDuration: item.actual,
      remainingTime: item.planned - item.actual,
      status: item.completed ? 'completed' : (item.actual > item.planned ? 'overtime' : 'pending'),
      order: i,
      minutesContent: '',
      minutesFormat: 'markdown' as const,
      startTime: start,
      endTime: item.completed ? new Date(start.getTime() + item.actual * 1000) : undefined,
    })),
    totalPlannedDuration: agendaItems.reduce((s, a) => s + a.planned, 0),
    totalActualDuration: agendaItems.reduce((s, a) => s + a.actual, 0),
    status: 'completed',
    settings: {
      autoTransition: false,
      silentMode: false,
      bellSettings: {
        start: false,
        fiveMinWarning: false,
        end: false,
        overtime: false,
        soundType: 'single',
      },
    },
  };
}

const EMPTY_DATA: RawData = {
  basicHistory: [],
  pomodoroSessions: [],
  meetings: [],
  multiCompletedCount: 0,
  multiTotalCount: 0,
  multiCategoryMap: {},
};

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────
describe('LocalAnalyticsService', () => {
  let service: LocalAnalyticsService;

  beforeEach(() => {
    service = new LocalAnalyticsService();
  });

  // ── Empty data ────────────────────────────────
  describe('empty data', () => {
    it('returns zero KPI when no history exists', () => {
      const filter = makeFilter(6);
      const result = service.compute(filter, EMPTY_DATA);

      expect(result.kpi.focusMinutes).toBe(0);
      expect(result.kpi.sessions).toBe(0);
      expect(result.kpi.completedSessions).toBe(0);
      expect(result.kpi.pomodoroAchievementRate).toBe(0);
      expect(result.kpi.meetingOvertimeRate).toBe(0);
    });

    it('returns empty trend/heatmap/donut for empty data', () => {
      const filter = makeFilter(2);
      const result = service.compute(filter, EMPTY_DATA);

      expect(result.trend.every((p) => p.focusMinutes === 0)).toBe(true);
      expect(result.heatmap).toHaveLength(0);
      expect(result.donut).toHaveLength(0);
    });
  });

  // ── Basic timer ───────────────────────────────
  describe('basic timer history', () => {
    it('accumulates focusMinutes from completed sessions', () => {
      const filter = makeFilter(6);
      const data: RawData = {
        ...EMPTY_DATA,
        basicHistory: [
          basicHistoryEntry(0, 1800, true),  // 30 min completed
          basicHistoryEntry(1, 900, false),  // 15 min not completed
        ],
      };
      const result = service.compute(filter, data);

      expect(result.kpi.focusMinutes).toBe(45);
      expect(result.kpi.sessions).toBe(2);
      expect(result.kpi.completedSessions).toBe(1);
    });

    it('excludes sessions outside the date range', () => {
      const filter = makeFilter(2); // only last 3 days
      const data: RawData = {
        ...EMPTY_DATA,
        basicHistory: [
          basicHistoryEntry(0, 600, true),  // in range
          basicHistoryEntry(10, 600, true), // out of range
        ],
      };
      const result = service.compute(filter, data);

      expect(result.kpi.sessions).toBe(1);
    });

    it('filters by timerKind=basic', () => {
      const filter: AnalyticsFilter = { ...makeFilter(6), timerKind: 'basic' };
      const data: RawData = {
        ...EMPTY_DATA,
        basicHistory: [basicHistoryEntry(0, 1200, true)],
        pomodoroSessions: [pomodoroSession(0, 1500, true)],
      };
      const result = service.compute(filter, data);

      // Only basic: 20 min, not 25 min (pomodoro)
      expect(result.kpi.focusMinutes).toBe(20);
    });

    it('populates donut with 基本タイマー segment', () => {
      const filter = makeFilter(2);
      const data: RawData = {
        ...EMPTY_DATA,
        basicHistory: [basicHistoryEntry(0, 1800, true)],
      };
      const result = service.compute(filter, data);
      const seg = result.donut.find((d) => d.name === '基本タイマー');
      expect(seg).toBeDefined();
      expect(seg!.value).toBe(30);
    });
  });

  // ── Pomodoro ─────────────────────────────────
  describe('pomodoro sessions', () => {
    it('counts only work-phase sessions in focusMinutes', () => {
      const filter = makeFilter(6);
      const data: RawData = {
        ...EMPTY_DATA,
        pomodoroSessions: [
          pomodoroSession(0, 1500, true, 'work'),        // 25 min
          pomodoroSession(0, 300, true, 'short-break'),  // break - ignored
        ],
      };
      const result = service.compute(filter, data);

      expect(result.kpi.focusMinutes).toBe(25);
      expect(result.kpi.sessions).toBe(1);
    });

    it('calculates pomodoroAchievementRate correctly', () => {
      const filter = makeFilter(6);
      const data: RawData = {
        ...EMPTY_DATA,
        pomodoroSessions: [
          pomodoroSession(0, 1500, true, 'work'),
          pomodoroSession(1, 1500, true, 'work'),
          pomodoroSession(2, 1500, false, 'work'),
        ],
      };
      const result = service.compute(filter, data);

      expect(result.kpi.pomodoroAchievementRate).toBe(67); // 2/3 = 66.6 → 67
    });

    it('returns 0 pomodoroAchievementRate when no work sessions', () => {
      const filter = makeFilter(6);
      const data: RawData = {
        ...EMPTY_DATA,
        pomodoroSessions: [pomodoroSession(0, 300, true, 'short-break')],
      };
      const result = service.compute(filter, data);
      expect(result.kpi.pomodoroAchievementRate).toBe(0);
    });
  });

  // ── Agenda (meetings) ─────────────────────────
  describe('agenda meetings', () => {
    it('calculates meetingOvertimeRate from agenda items', () => {
      const filter = makeFilter(6);
      const meeting = makeMeeting(0, [
        { planned: 600, actual: 700, completed: false }, // overtime
        { planned: 600, actual: 500, completed: true },  // on-time
        { planned: 600, actual: 700, completed: false }, // overtime
      ]);
      const data: RawData = { ...EMPTY_DATA, meetings: [meeting] };
      const result = service.compute(filter, data);

      expect(result.kpi.meetingOvertimeRate).toBe(67); // 2/3 = 66.6 → 67
    });

    it('returns 0 meetingOvertimeRate when no agenda items in range', () => {
      const filter = makeFilter(0); // very short range
      const meeting = makeMeeting(10, [{ planned: 600, actual: 700, completed: false }]);
      const data: RawData = { ...EMPTY_DATA, meetings: [meeting] };
      const result = service.compute(filter, data);

      expect(result.kpi.meetingOvertimeRate).toBe(0);
    });

    it('excludes agenda items without startTime', () => {
      const filter = makeFilter(6);
      const meeting = makeMeeting(0, [{ planned: 600, actual: 700, completed: false }]);
      // Remove startTime from all agenda items
      meeting.agenda.forEach((a) => {
        delete (a as { startTime?: Date }).startTime;
      });
      const data: RawData = { ...EMPTY_DATA, meetings: [meeting] };
      const result = service.compute(filter, data);

      expect(result.kpi.sessions).toBe(0);
      expect(result.kpi.meetingOvertimeRate).toBe(0);
    });
  });

  // ── Trend ────────────────────────────────────
  describe('trend aggregation', () => {
    it('generates one trend point per day for daily granularity', () => {
      const filter = makeFilter(6); // 7 days
      const result = service.compute(filter, EMPTY_DATA);
      expect(result.trend).toHaveLength(7);
    });

    it('assigns focusMinutes to the correct day label', () => {
      const filter = makeFilter(2); // 3 days
      const today = makeDate(0);
      const todayLabel = today.toISOString().slice(0, 10);
      const data: RawData = {
        ...EMPTY_DATA,
        basicHistory: [basicHistoryEntry(0, 3600, true)], // 60 min today
      };
      const result = service.compute(filter, data);
      const pt = result.trend.find((p) => p.label === todayLabel);
      expect(pt).toBeDefined();
      expect(pt!.focusMinutes).toBe(60);
    });

    it('generates weekly labels for week granularity', () => {
      const filter: AnalyticsFilter = {
        since: makeDate(13, 0),
        until: makeDate(0, 23),
        granularity: 'week',
      };
      const result = service.compute(filter, EMPTY_DATA);
      expect(result.trend.every((p) => p.label.includes('-W'))).toBe(true);
    });

    it('generates monthly labels for month granularity', () => {
      const since = new Date(2025, 0, 1, 0, 0, 0);
      const until = new Date(2025, 2, 31, 23, 59, 59);
      const filter: AnalyticsFilter = { since, until, granularity: 'month' };
      const result = service.compute(filter, EMPTY_DATA);
      expect(result.trend.map((p) => p.label)).toEqual(['2025-01', '2025-02', '2025-03']);
    });
  });

  // ── Heatmap ───────────────────────────────────
  describe('heatmap', () => {
    it('creates heatmap cells at correct weekday and hour', () => {
      const filter = makeFilter(6);
      // makeDate(0, 10) → hour 10
      const data: RawData = {
        ...EMPTY_DATA,
        basicHistory: [basicHistoryEntry(0, 1800, true)], // 30 min at hour 10
      };
      const result = service.compute(filter, data);
      const cell = result.heatmap.find((c) => c.hour === 10);
      expect(cell).toBeDefined();
      expect(cell!.minutes).toBe(30);
    });

    it('accumulates minutes for sessions at the same weekday/hour', () => {
      const filter = makeFilter(13);
      const data: RawData = {
        ...EMPTY_DATA,
        basicHistory: [
          { ...basicHistoryEntry(0, 1800, true), startTime: makeDate(0, 10) },
          { ...basicHistoryEntry(7, 1200, true), startTime: makeDate(7, 10) }, // same weekday, same hour (7 days earlier)
        ],
      };
      const weekday = makeDate(0, 10).getDay();
      const result = service.compute(filter, data);
      const cell = result.heatmap.find((c) => c.weekday === weekday && c.hour === 10);
      expect(cell).toBeDefined();
      expect(cell!.minutes).toBe(50); // 30 + 20
    });
  });

  // ── Donut ─────────────────────────────────────
  describe('donut', () => {
    it('shows multiple segments when multiple timer kinds have data', () => {
      const filter = makeFilter(6);
      const data: RawData = {
        ...EMPTY_DATA,
        basicHistory: [basicHistoryEntry(0, 1800, true)],
        pomodoroSessions: [pomodoroSession(0, 1500, true, 'work')],
      };
      const result = service.compute(filter, data);
      expect(result.donut.length).toBeGreaterThanOrEqual(2);
      expect(result.donut.some((d) => d.name === '基本タイマー')).toBe(true);
      expect(result.donut.some((d) => d.name === 'ポモドーロ')).toBe(true);
    });

    it('excludes segments with zero minutes', () => {
      const filter = makeFilter(6);
      const data: RawData = {
        ...EMPTY_DATA,
        basicHistory: [basicHistoryEntry(0, 1800, true)],
        // no pomodoro data
      };
      const result = service.compute(filter, data);
      expect(result.donut.every((d) => d.value > 0)).toBe(true);
      expect(result.donut.some((d) => d.name === 'ポモドーロ')).toBe(false);
    });

    it('includes multi-timer categories from categoryMap', () => {
      const filter = makeFilter(6);
      const data: RawData = {
        ...EMPTY_DATA,
        multiCategoryMap: { 仕事: 45, 運動: 0 },
      };
      const result = service.compute(filter, data);
      expect(result.donut.some((d) => d.name === '仕事' && d.value === 45)).toBe(true);
      expect(result.donut.some((d) => d.name === '運動')).toBe(false);
    });
  });

  // ── timerKind filter ──────────────────────────
  describe('timerKind filter', () => {
    const fullData: RawData = {
      basicHistory: [basicHistoryEntry(0, 1800, true)],
      pomodoroSessions: [pomodoroSession(0, 1500, true, 'work')],
      meetings: [makeMeeting(0, [{ planned: 600, actual: 500, completed: true }])],
      multiCompletedCount: 1,
      multiTotalCount: 1,
      multiCategoryMap: { 仕事: 30 },
    };

    it('filters to only pomodoro when timerKind=pomodoro', () => {
      const filter: AnalyticsFilter = { ...makeFilter(6), timerKind: 'pomodoro' };
      const result = service.compute(filter, fullData);
      // Only pomodoro 25 min, not basic 30 min
      expect(result.kpi.focusMinutes).toBe(25);
    });

    it('includes agenda data in all-view when timerKind is undefined', () => {
      const filter: AnalyticsFilter = makeFilter(6);
      const result = service.compute(filter, fullData);
      // agenda (500s ≈ 8min) is included in the total
      expect(result.kpi.focusMinutes).toBeGreaterThanOrEqual(8);
    });

    it('shows all when timerKind is undefined', () => {
      const filter: AnalyticsFilter = makeFilter(6);
      const result = service.compute(filter, fullData);
      expect(result.kpi.focusMinutes).toBeGreaterThan(0);
      expect(result.donut.length).toBeGreaterThanOrEqual(3);
    });

    // TC-AN-25: timerKind=basic のとき agenda データが meetingOvertimeRate に含まれない
    it('timerKind=basic のとき agenda が除外されまた meetingOvertimeRate は 0', () => {
      const filter: AnalyticsFilter = { ...makeFilter(6), timerKind: 'basic' };
      const data: RawData = {
        ...EMPTY_DATA,
        basicHistory: [basicHistoryEntry(0, 1800, true)],
        meetings: [makeMeeting(0, [{ planned: 600, actual: 700, completed: false }])],
      };
      const result = service.compute(filter, data);
      // basic (1800s = 30min) のみ対象; agenda は includeAgenda = !timerKind なので除外
      expect(result.kpi.focusMinutes).toBe(30);
      expect(result.kpi.meetingOvertimeRate).toBe(0);
    });

    // TC-AN-26: timerKind=multi のとき basic/pomodoro データが KPI に含まれない
    it('timerKind=multi のとき basic/pomodoro の sessions が 0 になる', () => {
      const filter: AnalyticsFilter = { ...makeFilter(6), timerKind: 'multi' };
      const data: RawData = {
        ...EMPTY_DATA,
        basicHistory: [basicHistoryEntry(0, 1800, true)],
        pomodoroSessions: [pomodoroSession(0, 1500, true, 'work')],
        multiCategoryMap: { '仕事': 30 },
      };
      const result = service.compute(filter, data);
      // timerKind='multi' 時, includeBasic=false, includePomodoro=false
      expect(result.kpi.sessions).toBe(0);
      expect(result.kpi.focusMinutes).toBe(0);
      // donut には multi カテゴリデータが含まれる
      expect(result.donut.some((d) => d.name === '仕事' && d.value === 30)).toBe(true);
    });
  });

  describe('trend granularity', () => {
    // TC-AN-27: 月次粒度で同一月内の範囲では trend が 1 件になる
    it('月次粒度で同一月内の範囲では trend が 1 件になる', () => {
      const filter: AnalyticsFilter = {
        since: new Date(2025, 2, 1, 0, 0, 0),
        until: new Date(2025, 2, 31, 23, 59, 59),
        granularity: 'month',
      };
      const result = service.compute(filter, EMPTY_DATA);
      expect(result.trend).toHaveLength(1);
      expect(result.trend[0].label).toBe('2025-03');
    });
  });
});
