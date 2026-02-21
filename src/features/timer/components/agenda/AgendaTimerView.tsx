import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { useAgendaTimerStore } from "@/features/timer/stores/agenda-timer-store";
import { useMeetingReportStore } from "@/features/timer/stores/meeting-report-store";
import {
  getWidgetLabel,
  useMeetingLayoutStore,
} from "@/features/timer/stores/meeting-layout-store";
import { AgendaItem, Meeting } from "@/types/agenda";
import type { WidgetLayoutItem } from "@/types/layout";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { MeetingDialog } from "./MeetingDialog";
import { AgendaDialog } from "./AgendaDialog";
import { AgendaSettingsDialog } from "./AgendaSettingsDialog";
import { MeetingOverviewChart } from "./MeetingOverviewChart";
import { MinutesEditor } from "./MinutesEditor";
import { TimerDisplay } from "./TimerDisplay";
import { MeetingList } from "./MeetingList";
import { AgendaList } from "./AgendaList";
import { WidgetCatalogDialog } from "./WidgetCatalogDialog";
import { SortableWidget } from "./SortableWidget";
import { VoiceTranscriptPanel } from "@/features/timer/components/voice/VoiceTranscriptPanel";
import { VoiceTranscriptSummaryDialog } from "@/features/timer/components/voice/VoiceTranscriptSummaryDialog";
import { MeetingReportHistory } from "@/features/timer/components/agenda/MeetingReportHistory";

export const AgendaTimerView: React.FC = () => {
  const {
    currentMeeting,
    meetings,
    tick,
    createMeeting,
    deleteMeeting,
    setCurrentMeeting,
    isRunning,
    getCurrentAgenda,
  } = useAgendaTimerStore();
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [editingAgenda, setEditingAgenda] = useState<AgendaItem | null>(null);
  const [isAgendaDialogOpen, setIsAgendaDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
  const [isWidgetCatalogOpen, setIsWidgetCatalogOpen] = useState(false);
  const [layoutPresetName, setLayoutPresetName] = useState("");
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  const [isDeleteMeetingDialogOpen, setIsDeleteMeetingDialogOpen] =
    useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const quillRef = useRef<QuillEditorHandle>(null);
  const {
    isEditMode,
    currentLayout,
    presets,
    setEditMode,
    showWidget,
    toggleWidget,
    reorderVisibleWidgets,
    setWidth,
    setHeight,
    resetLayout,
    saveCurrentLayout,
    applyPreset,
    deletePreset,
  } = useMeetingLayoutStore();

  const { createDraftFromMeeting, setDialogOpen: setReportDialogOpen } =
    useMeetingReportStore();

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning, tick]);

  useEffect(() => {
    if (meetings.length === 0) {
      createMeeting("新しい会議");
    }
  }, [meetings.length, createMeeting]);

  const currentAgenda = getCurrentAgenda();

  const orderedWidgets = useMemo(
    () =>
      currentLayout.slice().sort((first, second) => first.order - second.order),
    [currentLayout],
  );
  const visibleWidgets = useMemo(
    () => orderedWidgets.filter((widget) => widget.visible),
    [orderedWidgets],
  );
  const hiddenWidgets = useMemo(
    () => orderedWidgets.filter((widget) => !widget.visible),
    [orderedWidgets],
  );
  const visibleWidgetIds = useMemo(
    () => visibleWidgets.map((w) => w.id),
    [visibleWidgets],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveWidgetId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visibleWidgetIds.indexOf(String(active.id));
    const newIndex = visibleWidgetIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorderVisibleWidgets(arrayMove(visibleWidgetIds, oldIndex, newIndex));
  };

  const handleSaveLayoutPreset = () => {
    if (!layoutPresetName.trim()) {
      return;
    }
    saveCurrentLayout(layoutPresetName);
    setLayoutPresetName("");
  };

  const renderWidget = (widget: WidgetLayoutItem) => {
    if (widget.type === "timer") {
      return <TimerDisplay />;
    }

    if (widget.type === "agenda") {
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
    }

    if (widget.type === "minutes") {
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
    }

    if (widget.type === "transcript") {
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
          <CardContent className="min-h-0 overflow-hidden p-3 pt-0">
            <VoiceTranscriptPanel
              meetingId={currentMeeting.id}
              agendaId={currentAgenda.id}
              minutesFormat={currentAgenda.minutesFormat}
              onRequestSummaryDialog={() => setIsSummaryDialogOpen(true)}
            />
          </CardContent>
        </Card>
      );
    }

    if (widget.type === "time-allocation") {
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
    }

    if (widget.type === "report-history") {
      return <MeetingReportHistory className="h-full" />;
    }

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
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsManagementDialogOpen(true)}
        >
          <Users className="mr-1.5 h-4 w-4" />
          会議管理
        </Button>
        {currentMeeting && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSettingsDialogOpen(true)}
          >
            <Settings className="mr-1.5 h-4 w-4" />
            設定
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Label htmlFor="widget-edit-mode" className="text-sm">
            編集モード
          </Label>
          <Switch
            id="widget-edit-mode"
            checked={isEditMode}
            onCheckedChange={setEditMode}
          />
          {isEditMode && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsWidgetCatalogOpen(true)}
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                ウィジェット追加
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={resetLayout}
              >
                リセット
              </Button>
            </>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => {
          if (isEditMode) setActiveWidgetId(String(event.active.id));
        }}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveWidgetId(null)}
      >
        <SortableContext
          items={visibleWidgetIds}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-6 gap-3 lg:grid-cols-12">
            {visibleWidgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                isEditMode={isEditMode}
                onSetWidth={setWidth}
                onSetHeight={setHeight}
                onToggleWidget={toggleWidget}
              >
                {renderWidget(widget)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeWidgetId
            ? (() => {
                const w = visibleWidgets.find((x) => x.id === activeWidgetId);
                return w ? (
                  <div
                    className={cn(
                      w.width === "S" && "col-span-3",
                      w.width === "M" && "col-span-4",
                      w.width === "L" && "col-span-6",
                      w.width === "XL" && "col-span-12",
                      w.height === "S" && "h-[220px]",
                      w.height === "M" && "h-[320px]",
                      w.height === "L" && "h-[420px]",
                      w.height === "XL" && "h-[560px]",
                      "flex items-center justify-center rounded-md border-2 border-primary bg-muted/60 opacity-80",
                    )}
                  >
                    <span className="text-sm text-muted-foreground">
                      {getWidgetLabel(w.type)}
                    </span>
                  </div>
                ) : null;
              })()
            : null}
        </DragOverlay>
      </DndContext>

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
          <div className="space-y-4">
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

            <Card>
              <CardHeader className="px-3 py-2">
                <CardTitle className="text-sm">画面レイアウト</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-3 pb-3 pt-0">
                <div className="space-y-2 border-t pt-2">
                  <Label htmlFor="layout-preset-name">レイアウトを保存</Label>
                  <div className="flex gap-2">
                    <Input
                      id="layout-preset-name"
                      value={layoutPresetName}
                      onChange={(event) =>
                        setLayoutPresetName(event.target.value)
                      }
                      placeholder="例: 議事録重視"
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
                              {new Date(preset.updatedAt).toLocaleString(
                                "ja-JP",
                              )}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => applyPreset(preset.id)}
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
          </div>
        </DialogContent>
      </Dialog>

      <WidgetCatalogDialog
        open={isWidgetCatalogOpen}
        hiddenWidgets={hiddenWidgets}
        onOpenChange={setIsWidgetCatalogOpen}
        onAddWidget={(widgetId) => {
          showWidget(widgetId);
          setIsWidgetCatalogOpen(false);
        }}
      />

      {currentMeeting && (
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
                  if (meetingToDelete) {
                    deleteMeeting(meetingToDelete.id);
                  }
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
