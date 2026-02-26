import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  GridLayout,
  useContainerWidth,
  verticalCompactor,
  type Layout,
} from "react-grid-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertDialog } from "@radix-ui/themes";
import type { QuillEditorHandle } from "@/components/ui/quill-editor";
import {
  Plus,
  Clock,
  Settings,
  Users,
  PlusCircle,
  Volume2,
  FileText,
  X,
} from "lucide-react";
import {
  useTaskStore,
  selectActiveTask,
} from "@/features/timer/stores/task-store";
import { useAgendaTimerInstance } from "@/features/timer/hooks/useTimerInstances";
import { useMeetingReportStore } from "@/features/timer/stores/meeting-report-store";
import { useDashboardStore } from "@/features/timer/stores/dashboard-store";
import { useBasicTimerStore } from "@/features/timer/stores/basic-timer-store";
import { usePomodoroStore } from "@/features/timer/stores/pomodoro-store";
import { useAgendaTimerStore } from "@/features/timer/stores/agenda-timer-store";
import { useMultiTimerStore } from "@/features/timer/stores/multi-timer-store";
import {
  localAnalyticsService,
  RawData,
} from "@/features/timer/services/analytics";
import type { Granularity, TimerKind } from "@/types/analytics";
import type { WidgetLayoutItem, WidgetType } from "@/types/layout";
import type { AgendaItem, Meeting } from "@/types/agenda";
import { GridWidget } from "@/features/timer/components/agenda/GridWidget";
import { WidgetCatalogDialog } from "@/features/timer/components/agenda/WidgetCatalogDialog";
import { BasicTimer } from "@/features/timer/containers/BasicTimer";

import { TimerDisplay } from "@/features/timer/components/agenda/TimerDisplay";
import { AgendaList } from "@/features/timer/components/agenda/AgendaList";
import { MinutesEditor } from "@/features/timer/components/agenda/MinutesEditor";
import { MeetingOverviewChart } from "@/features/timer/components/agenda/MeetingOverviewChart";
import { MeetingReportHistory } from "@/features/timer/components/agenda/MeetingReportHistory";
import { MeetingList } from "@/features/timer/components/agenda/MeetingList";
import { MeetingDialog } from "@/features/timer/components/agenda/MeetingDialog";
import { AgendaDialog } from "@/features/timer/components/agenda/AgendaDialog";
import { AgendaSettingsDialog } from "@/features/timer/components/agenda/AgendaSettingsDialog";
import { VoiceTranscriptPanel } from "@/features/timer/components/voice/VoiceTranscriptPanel";
import { VoiceTranscriptSummaryDialog } from "@/features/timer/components/voice/VoiceTranscriptSummaryDialog";
import KpiCard from "@/features/timer/components/dashboard/KpiCard";
import TrendChart from "@/features/timer/components/dashboard/TrendChart";
import HeatmapChart from "@/features/timer/components/dashboard/HeatmapChart";
import DonutChart from "@/features/timer/components/dashboard/DonutChart";
import ErrorBoundary from "@/components/ErrorBoundary";
import { formatMinutesValue } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import {
  getWidgetsByCategory,
  CATEGORY_LABELS,
  createWidgetLayoutItem,
} from "@/features/timer/utils/widget-catalog";

// ── Analytics helpers ──

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: "day", label: "日次" },
  { value: "week", label: "週次" },
  { value: "month", label: "月次" },
];

const KIND_OPTIONS: { value: TimerKind | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "basic", label: "基本タイマー" },
  { value: "pomodoro", label: "ポモドーロ" },
  { value: "multi", label: "複数タイマー" },
];

const RANGE_OPTIONS: { label: string; days: number }[] = [
  { label: "直近7日", days: 7 },
  { label: "直近30日", days: 30 },
  { label: "直近90日", days: 90 },
];

// ── Analytics data hook ──

function useAnalytics() {
  const { filter, setGranularity, setDateRange, setTimerKind } =
    useDashboardStore();

  const basicInstances = useBasicTimerStore((s) => s.instances);
  const pomodoroInstances = usePomodoroStore((s) => s.instances);
  const agendaInstances = useAgendaTimerStore((s) => s.instances);
  const multiInstances = useMultiTimerStore((s) => s.instances);

  const basicHistory = useMemo(
    () => Object.values(basicInstances).flatMap((i) => i.history),
    [basicInstances],
  );
  const pomodoroSessions = useMemo(
    () => Object.values(pomodoroInstances).flatMap((i) => i.sessions),
    [pomodoroInstances],
  );
  const meetings = useMemo(
    () => Object.values(agendaInstances).flatMap((i) => i.meetings),
    [agendaInstances],
  );
  const multiTimers = useMemo(
    () => Object.values(multiInstances).flatMap((i) => i.timers),
    [multiInstances],
  );
  const multiSessions = useMemo(
    () => Object.values(multiInstances).flatMap((i) => i.sessions),
    [multiInstances],
  );

  const multiCategoryMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of multiTimers) {
      if (!t.isCompleted) continue;
      const cat = t.category ?? "その他";
      const mins = Math.max(0, Math.round((t.duration - t.remainingTime) / 60));
      map[cat] = (map[cat] ?? 0) + mins;
    }
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

  const handleExportCsv = useCallback(() => {
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
  }, [filter, result.trend]);

  return {
    filter,
    result,
    setGranularity,
    setDateRange,
    setTimerKind,
    handleExportCsv,
  };
}

// ── Widget Add Dialog (full catalog with categories) ──

interface WidgetAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTypes: Set<WidgetType>;
  onAddWidget: (type: WidgetType) => void;
}

const WidgetAddDialog: React.FC<WidgetAddDialogProps> = ({
  open,
  onOpenChange,
  existingTypes,
  onAddWidget,
}) => {
  const grouped = useMemo(() => getWidgetsByCategory(), []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>ウィジェットを追加</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              aria-label="閉じる"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        {(Object.keys(grouped) as Array<keyof typeof grouped>).map((cat) => (
          <div key={cat} className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
              {CATEGORY_LABELS[cat]}
            </p>
            {grouped[cat].map((meta) => {
              const alreadyExists = existingTypes.has(meta.type);
              return (
                <div
                  key={meta.type}
                  className="flex items-center justify-between rounded-sm border px-2 py-1.5"
                >
                  <p className="text-sm">{meta.label}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={alreadyExists}
                    onClick={() => {
                      onAddWidget(meta.type);
                      onOpenChange(false);
                    }}
                  >
                    {alreadyExists ? "追加済み" : "追加"}
                  </Button>
                </div>
              );
            })}
          </div>
        ))}
      </DialogContent>
    </Dialog>
  );
};

// ── Main Canvas ──

export const TaskWidgetCanvas: React.FC<{ taskId: string }> = ({ taskId }) => {
  const task = useTaskStore(selectActiveTask);
  const {
    isEditMode,
    presets,
    setEditMode,
    addWidget,
    showWidget,
    toggleWidget,
    updateWidgetLayout,
    savePreset,
    applyPreset,
    deletePreset,
  } = useTaskStore();

  const widgets = task?.widgets ?? [];

  // ── Meeting state ──
  const {
    currentMeeting,
    meetings,
    createMeeting,
    deleteMeeting,
    setCurrentMeeting,
    getCurrentAgenda,
  } = useAgendaTimerInstance(taskId);

  const { createDraftFromMeeting, setDialogOpen: setReportDialogOpen } =
    useMeetingReportStore();

  // Ensure at least one meeting exists for meeting widgets
  useEffect(() => {
    const hasMeetingWidgets = widgets.some((w) =>
      [
        "meeting-shortcut",
        "timer",
        "agenda",
        "minutes",
        "transcript",
        "time-allocation",
        "report-history",
      ].includes(w.type),
    );
    if (hasMeetingWidgets && meetings.length === 0) {
      createMeeting("新しい会議");
    }
  }, [widgets, meetings.length, createMeeting]);

  const currentAgenda = getCurrentAgenda();

  // ── Analytics data ──
  const analytics = useAnalytics();

  // ── Dialog states ──
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [editingAgenda, setEditingAgenda] = useState<AgendaItem | null>(null);
  const [isAgendaDialogOpen, setIsAgendaDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
  const [isWidgetAddOpen, setIsWidgetAddOpen] = useState(false);
  const [isLayoutDialogOpen, setIsLayoutDialogOpen] = useState(false);
  const [layoutPresetName, setLayoutPresetName] = useState("");
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  const [isDeleteMeetingDialogOpen, setIsDeleteMeetingDialogOpen] =
    useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  // Legacy hidden-widget catalog (for existing toggleWidget flow)
  const [isWidgetCatalogOpen, setIsWidgetCatalogOpen] = useState(false);
  const quillRef = useRef<QuillEditorHandle>(null);
  const isMobile = useIsMobile();

  const { containerRef, width: gridWidth } = useContainerWidth();

  const visibleWidgets = useMemo(
    () => widgets.filter((w) => w.visible),
    [widgets],
  );

  const hiddenWidgets = useMemo(
    () => widgets.filter((w) => !w.visible),
    [widgets],
  );

  const existingTypes = useMemo(
    () => new Set(widgets.map((w) => w.type)),
    [widgets],
  );

  const rglLayout = useMemo(
    () =>
      visibleWidgets.map((w) => ({
        i: w.id,
        x: w.x,
        y: w.y,
        w: w.w,
        h: w.h,
        minW: w.minW ?? 2,
        minH: w.minH ?? 3,
      })),
    [visibleWidgets],
  );

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      updateWidgetLayout(taskId, [...newLayout]);
    },
    [taskId, updateWidgetLayout],
  );

  const handleAddWidget = useCallback(
    (type: WidgetType) => {
      const item = createWidgetLayoutItem(type, widgets);
      addWidget(taskId, item);
    },
    [taskId, widgets, addWidget],
  );

  const handleToggleWidget = useCallback(
    (widgetId: string) => {
      toggleWidget(taskId, widgetId);
    },
    [taskId, toggleWidget],
  );

  const handleShowWidget = useCallback(
    (widgetId: string) => {
      showWidget(taskId, widgetId);
      setIsWidgetCatalogOpen(false);
    },
    [taskId, showWidget],
  );

  const handleSaveLayoutPreset = () => {
    if (!layoutPresetName.trim()) return;
    savePreset(layoutPresetName);
    setLayoutPresetName("");
  };

  // ── Analytics widget renderers ──

  const renderAnalyticsFilter = () => {
    const {
      filter,
      setGranularity,
      setTimerKind,
      setDateRange,
      handleExportCsv,
    } = analytics;
    const handleRangeClick = (days: number) => {
      const until = new Date();
      until.setHours(23, 59, 59, 999);
      const since = new Date();
      since.setDate(since.getDate() - (days - 1));
      since.setHours(0, 0, 0, 0);
      setDateRange(since, until);
    };
    return (
      <div className="flex h-full flex-wrap content-start gap-2 overflow-auto p-3">
        <div className="flex gap-1">
          {RANGE_OPTIONS.map(({ label, days }) => (
            <Button
              key={days}
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => handleRangeClick(days)}
            >
              {label}
            </Button>
          ))}
        </div>
        <Select
          value={filter.granularity}
          onValueChange={(v) => setGranularity(v as Granularity)}
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
        <Select
          value={filter.timerKind ?? "all"}
          onValueChange={(v) =>
            setTimerKind(v === "all" ? undefined : (v as TimerKind))
          }
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
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={handleExportCsv}
          aria-label="CSVエクスポート"
        >
          <Download className="mr-1.5 h-3 w-3" />
          CSV
        </Button>
      </div>
    );
  };

  // ── Unified renderWidget ──

  const renderWidget = (widget: WidgetLayoutItem) => {
    const { kpi, trend, heatmap, donut } = analytics.result;
    const completionRate =
      kpi.sessions > 0
        ? Math.round((kpi.completedSessions / kpi.sessions) * 100)
        : 0;

    switch (widget.type) {
      // --- Timer widgets ---
      case "timer-unified":
        return (
          <ErrorBoundary componentName="BasicTimer">
            <BasicTimer />
          </ErrorBoundary>
        );

      // --- Meeting widgets ---
      case "meeting-shortcut":
        return (
          <Card className="grid h-full min-h-0 rounded-none shadow-none border-0 grid-rows-[auto_minmax(0,1fr)]">
            <CardHeader className="px-3 py-2">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <Settings className="h-3.5 w-3.5" />
                会議管理ショートカット
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsManagementDialogOpen(true)}
              >
                <Users className="mr-1.5 h-3.5 w-3.5" />
                会議一覧を開く
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditingMeeting(null);
                  setIsMeetingDialogOpen(true);
                }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                新しい会議
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSettingsDialogOpen(true)}
                disabled={!currentMeeting}
              >
                <Settings className="mr-1.5 h-3.5 w-3.5" />
                会議設定
              </Button>
            </CardContent>
          </Card>
        );

      case "timer":
        return <TimerDisplay />;

      case "agenda":
        if (!currentMeeting) {
          return (
            <Card className="grid h-full min-h-0 rounded-none shadow-none border-0 grid-rows-[auto_minmax(0,1fr)]">
              <CardHeader className="px-3 py-2">
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <Clock className="h-3.5 w-3.5" />
                  アジェンダ一覧
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-3 pt-0">
                <p className="text-center text-sm text-muted-foreground">
                  会議を作成するとアジェンダ一覧が表示されます
                </p>
              </CardContent>
            </Card>
          );
        }
        return (
          <AgendaList
            className="h-full"
            onAddAgenda={() => {
              setEditingAgenda(null);
              setIsAgendaDialogOpen(true);
            }}
            onEditAgenda={(agenda) => {
              setEditingAgenda(agenda);
              setIsAgendaDialogOpen(true);
            }}
          />
        );

      case "minutes":
        if (!currentMeeting || !currentAgenda) {
          return (
            <Card className="grid h-full min-h-0 rounded-none shadow-none border-0 grid-rows-[auto_minmax(0,1fr)]">
              <CardHeader className="px-3 py-2">
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <FileText className="h-3.5 w-3.5" />
                  議事録
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-3 pt-0">
                <p className="text-center text-sm text-muted-foreground">
                  アジェンダを選択すると議事録を表示できます
                </p>
              </CardContent>
            </Card>
          );
        }
        return (
          <MinutesEditor
            meetingId={currentMeeting.id}
            agenda={currentAgenda}
            quillRef={quillRef}
          />
        );

      case "transcript":
        if (!currentMeeting || !currentAgenda) {
          return (
            <Card className="grid h-full min-h-0 rounded-none shadow-none border-0 grid-rows-[auto_minmax(0,1fr)]">
              <CardHeader className="px-3 py-2">
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <Volume2 className="h-3.5 w-3.5" />
                  文字起こし
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-3 pt-0">
                <p className="text-center text-sm text-muted-foreground">
                  アジェンダを選択すると文字起こしを表示できます
                </p>
              </CardContent>
            </Card>
          );
        }
        return (
          <Card className="grid h-full min-h-0 rounded-none shadow-none border-0 grid-rows-[auto_minmax(0,1fr)]">
            <CardHeader className="px-3 py-2">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <Volume2 className="h-3.5 w-3.5" />
                文字起こし
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 overflow-hidden flex flex-col p-3 pt-0">
              <VoiceTranscriptPanel
                meetingId={currentMeeting.id}
                agendaId={currentAgenda.id}
                minutesFormat={currentAgenda.minutesFormat}
                onRequestSummaryDialog={() => setIsSummaryDialogOpen(true)}
              />
            </CardContent>
          </Card>
        );

      case "time-allocation":
        if (!currentMeeting) {
          return (
            <Card className="grid h-full min-h-0 rounded-none shadow-none border-0 grid-rows-[auto_minmax(0,1fr)]">
              <CardHeader className="px-3 py-2">
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <Clock className="h-3.5 w-3.5" />
                  会議時間配分
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-3 pt-0">
                <p className="text-center text-sm text-muted-foreground">
                  会議を作成すると時間配分を表示できます
                </p>
              </CardContent>
            </Card>
          );
        }
        return (
          <Card className="grid h-full min-h-0 rounded-none shadow-none border-0 grid-rows-[auto_minmax(0,1fr)]">
            <CardHeader className="px-3 py-2">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <Clock className="h-3.5 w-3.5" />
                会議時間配分
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 min-h-0 overflow-hidden">
              <MeetingOverviewChart meeting={currentMeeting} />
            </CardContent>
          </Card>
        );

      case "report-history":
        return <MeetingReportHistory className="h-full" />;

      // --- Analytics widgets ---
      case "analytics-filter":
        return renderAnalyticsFilter();

      case "kpi-focus-time":
        return (
          <div className="flex h-full items-center p-3">
            <KpiCard
              label="集中時間"
              value={formatMinutesValue(kpi.focusMinutes)}
              sub={`${kpi.sessions}セッション`}
              className="w-full"
            />
          </div>
        );

      case "kpi-sessions":
        return (
          <div className="flex h-full items-center p-3">
            <KpiCard
              label="完了セッション"
              value={`${kpi.completedSessions}`}
              sub={`完了率 ${completionRate}%`}
              className="w-full"
            />
          </div>
        );

      case "kpi-pomodoro":
        return (
          <div className="flex h-full items-center p-3">
            <KpiCard
              label="ポモドーロ達成率"
              value={`${kpi.pomodoroAchievementRate}%`}
              className="w-full"
            />
          </div>
        );

      case "kpi-meeting-overtime":
        return (
          <div className="flex h-full items-center p-3">
            <KpiCard
              label="会議超過率"
              value={`${kpi.meetingOvertimeRate}%`}
              className="w-full"
            />
          </div>
        );

      case "trend-chart":
        return (
          <Card className="grid h-full min-h-0 rounded-none border-0 shadow-none grid-rows-[auto_minmax(0,1fr)]">
            <CardHeader className="px-3 py-2">
              <CardTitle className="text-sm">トレンド</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 overflow-hidden p-3 pt-0">
              <TrendChart data={trend} />
            </CardContent>
          </Card>
        );

      case "heatmap-chart":
        return (
          <Card className="grid h-full min-h-0 rounded-none border-0 shadow-none grid-rows-[auto_minmax(0,1fr)]">
            <CardHeader className="px-3 py-2">
              <CardTitle className="text-sm">ヒートマップ</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 overflow-hidden p-3 pt-0">
              <HeatmapChart data={heatmap} />
            </CardContent>
          </Card>
        );

      case "donut-chart":
        return (
          <Card className="grid h-full min-h-0 rounded-none border-0 shadow-none grid-rows-[auto_minmax(0,1fr)]">
            <CardHeader className="px-3 py-2">
              <CardTitle className="text-sm">タイマー種別</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 overflow-hidden p-3 pt-0">
              <DonutChart data={donut} />
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* ── ツールバー ── */}
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <div className="ml-auto flex items-center gap-2">
          <Label htmlFor="canvas-edit-mode" className="text-sm">
            編集モード
          </Label>
          <Switch
            id="canvas-edit-mode"
            checked={isEditMode}
            onCheckedChange={setEditMode}
          />
          {isEditMode && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsWidgetAddOpen(true)}
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                ウィジェット追加
              </Button>
              {hiddenWidgets.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsWidgetCatalogOpen(true)}
                >
                  非表示を復元 ({hiddenWidgets.length})
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsLayoutDialogOpen(true)}
              >
                レイアウト管理
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── グリッド ── */}
      <div ref={containerRef as React.Ref<HTMLDivElement>} className="w-full">
        {visibleWidgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-sm">ウィジェットがありません</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setIsWidgetAddOpen(true)}
            >
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              ウィジェットを追加
            </Button>
          </div>
        ) : (
          <GridLayout
            width={gridWidth ?? 1200}
            layout={rglLayout}
            gridConfig={{
              cols: isMobile ? 1 : 12,
              rowHeight: 40,
              margin: [8, 8] as [number, number],
              containerPadding: [0, 0] as [number, number],
              maxRows: Infinity,
            }}
            dragConfig={{
              enabled: isEditMode,
              handle: ".widget-drag-handle",
              bounded: false,
              threshold: 3,
            }}
            resizeConfig={{
              enabled: isEditMode,
              handles: ["s", "w", "e", "n", "sw", "nw", "se", "ne"] as const,
            }}
            compactor={verticalCompactor}
            onLayoutChange={handleLayoutChange}
          >
            {visibleWidgets.map((widget) => (
              <div key={widget.id}>
                <GridWidget
                  widget={widget}
                  isEditMode={isEditMode}
                  onToggleWidget={handleToggleWidget}
                >
                  {renderWidget(widget)}
                </GridWidget>
              </div>
            ))}
          </GridLayout>
        )}
      </div>

      {/* ── ウィジェット追加ダイアログ（全カタログ） ── */}
      <WidgetAddDialog
        open={isWidgetAddOpen}
        onOpenChange={setIsWidgetAddOpen}
        existingTypes={existingTypes}
        onAddWidget={handleAddWidget}
      />

      {/* ── 非表示ウィジェット復元（既存フロー） ── */}
      <WidgetCatalogDialog
        open={isWidgetCatalogOpen}
        hiddenWidgets={hiddenWidgets}
        onOpenChange={setIsWidgetCatalogOpen}
        onAddWidget={handleShowWidget}
      />

      {/* ── レイアウト管理ダイアログ ── */}
      <Dialog open={isLayoutDialogOpen} onOpenChange={setIsLayoutDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>レイアウト管理</DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsLayoutDialogOpen(false)}
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <Card>
            <CardHeader className="px-3 py-2">
              <CardTitle className="text-sm">画面レイアウト</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-3 pb-3 pt-0">
              <div className="space-y-2 border-t pt-2">
                <Label htmlFor="canvas-layout-preset-name">
                  レイアウトを保存
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="canvas-layout-preset-name"
                    value={layoutPresetName}
                    onChange={(e) => setLayoutPresetName(e.target.value)}
                    placeholder="例: 集中モード"
                    maxLength={40}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSaveLayoutPreset}
                    disabled={!layoutPresetName.trim()}
                  >
                    保存
                  </Button>
                </div>
              </div>
              <div className="space-y-2 border-t pt-2">
                <div className="text-sm font-medium">保存済みレイアウト</div>
                {presets.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    まだ保存されたレイアウトはありません
                  </p>
                ) : (
                  <div className="space-y-2">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between gap-2 rounded-sm border px-2 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {preset.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(preset.updatedAt).toLocaleString("ja-JP")}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => applyPreset(taskId, preset.id)}
                          >
                            適用
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => deletePreset(preset.id)}
                          >
                            削除
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* ── 会議管理ダイアログ ── */}
      <Dialog
        open={isManagementDialogOpen}
        onOpenChange={setIsManagementDialogOpen}
      >
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                会議管理
              </DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsManagementDialogOpen(false)}
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <MeetingList
            meetings={meetings}
            currentMeetingId={currentMeeting?.id}
            onSelectMeeting={(id) => {
              setCurrentMeeting(id);
              setIsManagementDialogOpen(false);
            }}
            onCreateMeeting={() => {
              setEditingMeeting(null);
              setIsMeetingDialogOpen(true);
            }}
            onEditMeeting={(meeting) => {
              setEditingMeeting(meeting);
              setIsMeetingDialogOpen(true);
            }}
            onDeleteMeeting={(meeting) => {
              setMeetingToDelete(meeting);
              setIsDeleteMeetingDialogOpen(true);
            }}
            onSaveReport={(meeting) => {
              setCurrentMeeting(meeting.id);
              createDraftFromMeeting(meeting);
              setReportDialogOpen(true);
            }}
            onOpenSettings={() => {
              setIsSettingsDialogOpen(true);
              setIsManagementDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ── Meeting sub-dialogs ── */}
      {isAgendaDialogOpen && currentMeeting && (
        <AgendaDialog
          meetingId={currentMeeting.id}
          agenda={editingAgenda}
          isOpen={isAgendaDialogOpen}
          onClose={() => {
            setIsAgendaDialogOpen(false);
            setEditingAgenda(null);
          }}
        />
      )}

      <MeetingDialog
        meeting={editingMeeting}
        isOpen={isMeetingDialogOpen}
        onClose={() => {
          setIsMeetingDialogOpen(false);
          setEditingMeeting(null);
        }}
      />

      {currentMeeting && (
        <AgendaSettingsDialog
          meeting={currentMeeting}
          isOpen={isSettingsDialogOpen}
          onClose={() => setIsSettingsDialogOpen(false)}
        />
      )}

      <VoiceTranscriptSummaryDialog
        isOpen={isSummaryDialogOpen}
        onClose={() => setIsSummaryDialogOpen(false)}
        quillRef={quillRef}
        onInserted={() => setIsSummaryDialogOpen(false)}
      />

      <AlertDialog.Root
        open={isDeleteMeetingDialogOpen}
        onOpenChange={setIsDeleteMeetingDialogOpen}
      >
        <AlertDialog.Content maxWidth="420px">
          <AlertDialog.Title>会議を削除しますか？</AlertDialog.Title>
          <AlertDialog.Description>
            {meetingToDelete
              ? `「${meetingToDelete.title}」を削除します。この操作は取り消せません。`
              : "この操作は取り消せません。"}
          </AlertDialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialog.Cancel>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteMeetingDialogOpen(false);
                  setMeetingToDelete(null);
                }}
              >
                キャンセル
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (meetingToDelete) deleteMeeting(meetingToDelete.id);
                  setIsDeleteMeetingDialogOpen(false);
                  setMeetingToDelete(null);
                }}
              >
                削除
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </div>
  );
};
