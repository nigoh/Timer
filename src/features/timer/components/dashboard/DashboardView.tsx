import React, { useCallback } from 'react';
import { AnalyticsFilter, AnalyticsResult, Granularity, TimerKind } from '@/types/analytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import KpiCard from './KpiCard';
import TrendChart from './TrendChart';
import HeatmapChart from './HeatmapChart';
import DonutChart from './DonutChart';
import { Download } from 'lucide-react';

interface DashboardViewProps {
  filter: AnalyticsFilter;
  result: AnalyticsResult;
  onSetGranularity: (g: Granularity) => void;
  onSetTimerKind: (k: TimerKind | undefined) => void;
  onSetDateRange: (since: Date, until: Date) => void;
  onExportCsv: () => void;
}

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'day', label: '日次' },
  { value: 'week', label: '週次' },
  { value: 'month', label: '月次' },
];

const KIND_OPTIONS: { value: TimerKind | 'all'; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'basic', label: '基本タイマー' },
  { value: 'pomodoro', label: 'ポモドーロ' },
  { value: 'agenda', label: 'アジェンダ' },
  { value: 'multi', label: '複数タイマー' },
];

const RANGE_OPTIONS: { label: string; days: number }[] = [
  { label: '直近7日', days: 7 },
  { label: '直近30日', days: 30 },
  { label: '直近90日', days: 90 },
];

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}分`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  filter,
  result,
  onSetGranularity,
  onSetTimerKind,
  onSetDateRange,
  onExportCsv,
}) => {
  const { kpi, trend, heatmap, donut } = result;

  const handleRangeClick = useCallback(
    (days: number) => {
      const until = new Date();
      until.setHours(23, 59, 59, 999);
      const since = new Date();
      since.setDate(since.getDate() - (days - 1));
      since.setHours(0, 0, 0, 0);
      onSetDateRange(since, until);
    },
    [onSetDateRange],
  );

  const completionRate =
    kpi.sessions > 0 ? Math.round((kpi.completedSessions / kpi.sessions) * 100) : 0;

  return (
    <div className="space-y-4 py-2">
      {/* ── Filter bar ── */}
      <div
        className="flex flex-wrap gap-2 items-center"
        role="region"
        aria-label="ダッシュボードフィルタ"
      >
        {/* Date range quick picks */}
        <div className="flex gap-1">
          {RANGE_OPTIONS.map(({ label, days }) => (
            <Button
              key={days}
              variant="outline"
              size="sm"
              className="h-8 text-xs px-2"
              onClick={() => handleRangeClick(days)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Granularity */}
        <Select
          value={filter.granularity}
          onValueChange={(v) => onSetGranularity(v as Granularity)}
        >
          <SelectTrigger className="h-8 w-24 text-xs" aria-label="集計粒度">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRANULARITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Timer kind filter */}
        <Select
          value={filter.timerKind ?? 'all'}
          onValueChange={(v) => onSetTimerKind(v === 'all' ? undefined : (v as TimerKind))}
        >
          <SelectTrigger className="h-8 w-36 text-xs" aria-label="タイマー種別">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KIND_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Export */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 ml-auto text-xs"
          onClick={onExportCsv}
          aria-label="CSVエクスポート"
        >
          <Download className="w-3 h-3 mr-1" />
          CSV
        </Button>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="集中時間"
          value={formatMinutes(kpi.focusMinutes)}
          sub={`${kpi.sessions}セッション`}
        />
        <KpiCard
          label="完了セッション"
          value={`${kpi.completedSessions}`}
          sub={`完了率 ${completionRate}%`}
        />
        <KpiCard
          label="ポモドーロ達成率"
          value={`${kpi.pomodoroAchievementRate}%`}
        />
        <KpiCard
          label="会議超過率"
          value={`${kpi.meetingOvertimeRate}%`}
        />
      </div>

      {/* ── Trend chart ── */}
      <TrendChart data={trend} />

      {/* ── Heatmap + Donut ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HeatmapChart data={heatmap} />
        <DonutChart data={donut} />
      </div>
    </div>
  );
};

export default DashboardView;
