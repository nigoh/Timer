import { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import DashboardView from '../DashboardView';
import { AnalyticsFilter, AnalyticsResult } from '@/types/analytics';

// ── UI mock helpers ──────────────────────────────────────────────────────────
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, 'aria-label': al }: any) => (
    <button onClick={onClick} aria-label={al}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      aria-label="select"
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children, 'aria-label': al }: any) => <span aria-label={al}>{children}</span>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock('lucide-react', () => ({
  Download: () => <span>download</span>,
}));

// Recharts: stub out so happy-dom doesn't choke on SVG/canvas
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <svg>{children}</svg>,
  LineChart: ({ children }: any) => <svg>{children}</svg>,
  PieChart: ({ children }: any) => <svg>{children}</svg>,
  Bar: () => null,
  Line: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────
const filter: AnalyticsFilter = {
  since: new Date('2025-01-01T00:00:00Z'),
  until: new Date('2025-01-07T23:59:59Z'),
  granularity: 'day',
};

const result: AnalyticsResult = {
  kpi: {
    focusMinutes: 185,
    sessions: 8,
    completedSessions: 6,
    pomodoroAchievementRate: 75,
    meetingOvertimeRate: 33,
  },
  trend: [
    { label: '2025-01-01', focusMinutes: 30, sessions: 1, completedSessions: 1 },
    { label: '2025-01-02', focusMinutes: 25, sessions: 1, completedSessions: 1 },
  ],
  heatmap: [{ weekday: 1, hour: 9, minutes: 55 }],
  donut: [
    { name: '基本タイマー', value: 100 },
    { name: 'ポモドーロ', value: 85 },
  ],
};

const MS_PER_DAY = 86_400_000;

const noop = () => {};
describe('DashboardView', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('renders KPI values', async () => {
    await act(async () => {
      createRoot(container).render(
        <DashboardView
          filter={filter}
          result={result}
          onSetGranularity={noop}
          onSetTimerKind={noop}
          onSetDateRange={noop}
          onExportCsv={noop}
        />,
      );
    });

    expect(container.textContent).toContain('集中時間');
    expect(container.textContent).toContain('3h 5m');   // 185 min → 3h 5m
    expect(container.textContent).toContain('完了セッション');
    expect(container.textContent).toContain('6');
    expect(container.textContent).toContain('ポモドーロ達成率');
    expect(container.textContent).toContain('75%');
    expect(container.textContent).toContain('会議超過率');
    expect(container.textContent).toContain('33%');
  });

  it('shows filter bar with date-range buttons', async () => {
    await act(async () => {
      createRoot(container).render(
        <DashboardView
          filter={filter}
          result={result}
          onSetGranularity={noop}
          onSetTimerKind={noop}
          onSetDateRange={noop}
          onExportCsv={noop}
        />,
      );
    });

    expect(container.textContent).toContain('直近7日');
    expect(container.textContent).toContain('直近30日');
    expect(container.textContent).toContain('直近90日');
  });

  it('calls onSetDateRange when a range button is clicked', async () => {
    const onSetDateRange = vi.fn();

    await act(async () => {
      createRoot(container).render(
        <DashboardView
          filter={filter}
          result={result}
          onSetGranularity={noop}
          onSetTimerKind={noop}
          onSetDateRange={onSetDateRange}
          onExportCsv={noop}
        />,
      );
    });

    const btn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === '直近7日',
    )!;

    await act(async () => {
      btn.click();
    });

    expect(onSetDateRange).toHaveBeenCalledTimes(1);
    const [since, until] = onSetDateRange.mock.calls[0] as [Date, Date];
    expect(since).toBeInstanceOf(Date);
    expect(until).toBeInstanceOf(Date);
    // "直近7日" covers 7 days (today-6 00:00 → today 23:59:59)
    const diffDays = Math.round((until.getTime() - since.getTime()) / MS_PER_DAY);
    expect(diffDays).toBe(7);
  });

  it('calls onExportCsv when CSV button is clicked', async () => {
    const onExportCsv = vi.fn();

    await act(async () => {
      createRoot(container).render(
        <DashboardView
          filter={filter}
          result={result}
          onSetGranularity={noop}
          onSetTimerKind={noop}
          onSetDateRange={noop}
          onExportCsv={onExportCsv}
        />,
      );
    });

    const btn = container.querySelector('[aria-label="CSVエクスポート"]') as HTMLButtonElement;
    expect(btn).not.toBeNull();

    await act(async () => {
      btn.click();
    });

    expect(onExportCsv).toHaveBeenCalledTimes(1);
  });

  it('calls onSetGranularity when granularity select changes', async () => {
    const onSetGranularity = vi.fn();

    await act(async () => {
      createRoot(container).render(
        <DashboardView
          filter={filter}
          result={result}
          onSetGranularity={onSetGranularity}
          onSetTimerKind={noop}
          onSetDateRange={noop}
          onExportCsv={noop}
        />,
      );
    });

    const selects = container.querySelectorAll('select');
    // First select is granularity
    await act(async () => {
      selects[0].value = 'week';
      selects[0].dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(onSetGranularity).toHaveBeenCalledWith('week');
  });

  it('calls onSetTimerKind when kind select changes', async () => {
    const onSetTimerKind = vi.fn();

    await act(async () => {
      createRoot(container).render(
        <DashboardView
          filter={filter}
          result={result}
          onSetGranularity={noop}
          onSetTimerKind={onSetTimerKind}
          onSetDateRange={noop}
          onExportCsv={noop}
        />,
      );
    });

    const selects = container.querySelectorAll('select');
    // Second select is kind
    await act(async () => {
      selects[1].value = 'pomodoro';
      selects[1].dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(onSetTimerKind).toHaveBeenCalledWith('pomodoro');
  });

  it('calls onSetTimerKind with undefined when "all" is selected', async () => {
    const onSetTimerKind = vi.fn();
    const filterWithKind: AnalyticsFilter = { ...filter, timerKind: 'basic' };

    await act(async () => {
      createRoot(container).render(
        <DashboardView
          filter={filterWithKind}
          result={result}
          onSetGranularity={noop}
          onSetTimerKind={onSetTimerKind}
          onSetDateRange={noop}
          onExportCsv={noop}
        />,
      );
    });

    const selects = container.querySelectorAll('select');
    await act(async () => {
      selects[1].value = 'all';
      selects[1].dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(onSetTimerKind).toHaveBeenCalledWith(undefined);
  });

  it('displays completion rate derived from kpi', async () => {
    await act(async () => {
      createRoot(container).render(
        <DashboardView
          filter={filter}
          result={result}
          onSetGranularity={noop}
          onSetTimerKind={noop}
          onSetDateRange={noop}
          onExportCsv={noop}
        />,
      );
    });

    // completedSessions=6, sessions=8 → 75%
    expect(container.textContent).toContain('完了率 75%');
  });

  it('shows 0分 for focusMinutes when result is zero', async () => {
    const emptyResult: AnalyticsResult = {
      kpi: { focusMinutes: 0, sessions: 0, completedSessions: 0, pomodoroAchievementRate: 0, meetingOvertimeRate: 0 },
      trend: [],
      heatmap: [],
      donut: [],
    };

    await act(async () => {
      createRoot(container).render(
        <DashboardView
          filter={filter}
          result={emptyResult}
          onSetGranularity={noop}
          onSetTimerKind={noop}
          onSetDateRange={noop}
          onExportCsv={noop}
        />,
      );
    });

    expect(container.textContent).toContain('0分');
  });
});
