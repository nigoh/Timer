import React, { useMemo } from "react";
import { useDashboardStore } from "../stores/dashboard-store";
import { useBasicTimerStore } from "../stores/basic-timer-store";
import { usePomodoroStore } from "../stores/pomodoro-store";
import { useAgendaTimerStore } from "../stores/agenda-timer-store";
import { useMultiTimerStore } from "../stores/multi-timer-store";
import { localAnalyticsService, RawData } from "../services/analytics";
import { Granularity, TimerKind } from "@/types/analytics";
import DashboardView from "../components/dashboard/DashboardView";

export const Dashboard: React.FC = () => {
  const { filter, setGranularity, setDateRange, setTimerKind } =
    useDashboardStore();

  // Read raw data from stores
  const basicHistory = useBasicTimerStore((s) => s.history);
  const pomodoroSessions = usePomodoroStore((s) => s.sessions);
  const meetings = useAgendaTimerStore((s) => s.meetings);
  const multiTimers = useMultiTimerStore((s) => s.timers);
  const multiSessions = useMultiTimerStore((s) => s.sessions);

  // Build multi category map from completed timers (approximation from current state)
  const multiCategoryMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of multiTimers) {
      if (!t.isCompleted) continue;
      const cat = t.category ?? "その他";
      const mins = Math.max(0, Math.round((t.duration - t.remainingTime) / 60));
      map[cat] = (map[cat] ?? 0) + mins;
    }
    // Also count from sessions if available
    for (const s of multiSessions) {
      const cat = s.category ?? "その他";
      const mins = Math.round(s.duration / 60);
      map[cat] = (map[cat] ?? 0) + mins;
    }
    return map;
  }, [multiTimers, multiSessions]);

  const multiCompleted = useMemo(
    () => multiTimers.filter((t) => t.isCompleted).length,
    [multiTimers],
  );

  const rawData: RawData = useMemo(
    () => ({
      basicHistory,
      pomodoroSessions,
      meetings,
      multiCompletedCount: multiCompleted,
      multiTotalCount: multiTimers.length,
      multiCategoryMap,
    }),
    [
      basicHistory,
      pomodoroSessions,
      meetings,
      multiCompleted,
      multiTimers.length,
      multiCategoryMap,
    ],
  );

  const result = useMemo(
    () => localAnalyticsService.compute(filter, rawData),
    [filter, rawData],
  );

  const handleExportCsv = () => {
    const rows = [
      ["期間", "集中時間(分)", "セッション数", "完了数"],
      ...result.trend.map((p) => [
        p.label,
        p.focusMinutes,
        p.sessions,
        p.completedSessions,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_${filter.since.toISOString().slice(0, 10)}_${filter.until.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardView
      filter={filter}
      result={result}
      onSetGranularity={(g: Granularity) => setGranularity(g)}
      onSetTimerKind={(k: TimerKind | undefined) => setTimerKind(k)}
      onSetDateRange={setDateRange}
      onExportCsv={handleExportCsv}
    />
  );
};
