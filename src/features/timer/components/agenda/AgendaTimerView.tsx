import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip } from "@radix-ui/themes";
import ReactMarkdown from "react-markdown";
import ReactQuill from "react-quill";
import remarkGfm from "remark-gfm";
import "react-quill/dist/quill.snow.css";
import {
  Play,
  Pause,
  Clock,
  CheckCircle2,
  Circle,
  Square,
  Plus,
  Edit,
  Trash2,
  Settings,
  Users,
  Timer,
  AlertCircle,
  CircleHelp,
  ChevronRight,
  Volume2,
  VolumeX,
  PanelRightClose,
  PanelRightOpen,
  X,
} from "lucide-react";
import { useAgendaTimerStore } from "@/features/timer/stores/new-agenda-timer-store";
import { AgendaItem, Meeting } from "@/types/agenda";
import { cn } from "@/lib/utils";

const formatTime = (seconds: number): string => {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const hrs = Math.floor(absSeconds / 3600);
  const mins = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;

  const timeStr =
    hrs > 0
      ? `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      : `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  return isNegative ? `-${timeStr}` : timeStr;
};

const formatMinutes = (seconds: number): string => {
  return `${Math.ceil(seconds / 60)}分`;
};

// 進捗に応じた色とアイコンを取得
const getProgressDisplay = (percentage: number) => {
  if (percentage <= 70) {
    return {
      color: "text-green-600",
      bgColor: "bg-green-500",
      icon: <Clock className="w-4 h-4" />,
      label: "余裕",
    };
  }
  if (percentage <= 90) {
    return {
      color: "text-orange-600",
      bgColor: "bg-orange-500",
      icon: <AlertCircle className="w-4 h-4" />,
      label: "残り少",
    };
  }
  if (percentage <= 100) {
    return {
      color: "text-red-600",
      bgColor: "bg-red-500",
      icon: <Timer className="w-4 h-4" />,
      label: "終了間近",
    };
  }
  return {
    color: "text-purple-600",
    bgColor: "bg-purple-500",
    icon: <AlertCircle className="w-4 h-4" />,
    label: "超過中",
  };
};

// 会議作成/編集ダイアログ
interface MeetingDialogProps {
  meeting?: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
}

const MeetingDialog: React.FC<MeetingDialogProps> = ({
  meeting,
  isOpen,
  onClose,
}) => {
  const { createMeeting, updateMeetingTitle } = useAgendaTimerStore();
  const [title, setTitle] = useState(meeting?.title || "");

  useEffect(() => {
    setTitle(meeting?.title || "");
  }, [meeting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (meeting) {
      updateMeetingTitle(meeting.id, title);
    } else {
      createMeeting(title);
    }

    setTitle("");
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {meeting ? "会議を編集" : "新しい会議を作成"}
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="ダイアログを閉じる"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="meeting-title">会議名</Label>
            <Input
              id="meeting-title"
              placeholder="例: プロジェクト進捗会議、部門ミーティング"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">{meeting ? "更新" : "作成"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// アジェンダ追加/編集ダイアログ
interface AgendaDialogProps {
  meetingId: string;
  agenda?: AgendaItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const AgendaDialog: React.FC<AgendaDialogProps> = ({
  meetingId,
  agenda,
  isOpen,
  onClose,
}) => {
  const { addAgenda, updateAgenda } = useAgendaTimerStore();
  const [title, setTitle] = useState(agenda?.title || "");
  const [duration, setDuration] = useState(
    agenda ? Math.ceil(agenda.plannedDuration / 60) : 10,
  );
  const [memo, setMemo] = useState(agenda?.memo || "");

  useEffect(() => {
    setTitle(agenda?.title || "");
    setDuration(agenda ? Math.ceil(agenda.plannedDuration / 60) : 10);
    setMemo(agenda?.memo || "");
  }, [agenda]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const durationSeconds = duration * 60;

    if (agenda) {
      updateAgenda(meetingId, agenda.id, {
        title,
        plannedDuration: durationSeconds,
        memo,
        remainingTime: durationSeconds - agenda.actualDuration,
      });
    } else {
      addAgenda(meetingId, title, durationSeconds, memo);
    }

    setTitle("");
    setDuration(10);
    setMemo("");
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {agenda ? "アジェンダを編集" : "新しいアジェンダを追加"}
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="ダイアログを閉じる"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="agenda-title">アジェンダタイトル</Label>
            <Input
              id="agenda-title"
              placeholder="例: 進捗報告、課題検討、次回予定"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="agenda-duration">予定時間（分）</Label>
            <Input
              id="agenda-duration"
              type="number"
              min="1"
              max="180"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
              required
            />
          </div>

          <div>
            <Label htmlFor="agenda-memo">メモ（任意）</Label>
            <Textarea
              id="agenda-memo"
              placeholder="議論のポイント、準備資料、参加者への連絡事項など"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">{agenda ? "更新" : "追加"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// 設定ダイアログ
interface SettingsDialogProps {
  meeting: Meeting;
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  meeting,
  isOpen,
  onClose,
}) => {
  const { updateMeetingSettings } = useAgendaTimerStore();
  const [settings, setSettings] = useState(meeting.settings);

  useEffect(() => {
    setSettings(meeting.settings);
  }, [meeting.settings]);

  const handleSave = () => {
    updateMeetingSettings(meeting.id, settings);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              会議設定
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="ダイアログを閉じる"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本設定 */}
          <div className="space-y-4">
            <h4 className="font-medium">基本設定</h4>

            <div className="flex items-center justify-between">
              <Label className="text-sm">
                自動遷移
                <div className="text-xs text-muted-foreground">
                  アジェンダが終了したら自動で次へ
                </div>
              </Label>
              <Switch
                checked={settings.autoTransition}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    autoTransition: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">
                サイレントモード
                <div className="text-xs text-muted-foreground">
                  音を鳴らさずバイブのみ
                </div>
              </Label>
              <Switch
                checked={settings.silentMode}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    silentMode: checked,
                  })
                }
              />
            </div>
          </div>

          {/* ベル設定 */}
          <div className="space-y-4">
            <h4 className="font-medium">ベル通知設定</h4>

            <div>
              <Label className="text-sm mb-2 block">ベル音の種類</Label>
              <Select
                value={settings.bellSettings.soundType}
                onValueChange={(value: "single" | "double" | "loop") =>
                  setSettings({
                    ...settings,
                    bellSettings: {
                      ...settings.bellSettings,
                      soundType: value,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">単発ベル</SelectItem>
                  <SelectItem value="double">二打ベル</SelectItem>
                  <SelectItem value="loop">ループベル</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">開始時</Label>
                <Switch
                  checked={settings.bellSettings.start}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      bellSettings: {
                        ...settings.bellSettings,
                        start: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">残り5分</Label>
                <Switch
                  checked={settings.bellSettings.fiveMinWarning}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      bellSettings: {
                        ...settings.bellSettings,
                        fiveMinWarning: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">終了時</Label>
                <Switch
                  checked={settings.bellSettings.end}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      bellSettings: { ...settings.bellSettings, end: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">超過時</Label>
                <Switch
                  checked={settings.bellSettings.overtime}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      bellSettings: {
                        ...settings.bellSettings,
                        overtime: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>設定を保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface MinutesEditorProps {
  meetingId: string;
  agenda: AgendaItem;
}

const MinutesEditor: React.FC<MinutesEditorProps> = ({ meetingId, agenda }) => {
  const { updateAgendaMinutes } = useAgendaTimerStore();
  const [activeFormat, setActiveFormat] = useState<AgendaItem["minutesFormat"]>(
    agenda.minutesFormat,
  );
  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false);
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link"],
      ["clean"],
    ],
  };

  useEffect(() => {
    setActiveFormat(agenda.minutesFormat);
  }, [agenda.minutesFormat, agenda.id]);

  const handleFormatChange = (format: AgendaItem["minutesFormat"]) => {
    setActiveFormat(format);
    if (format !== "markdown") {
      setIsMarkdownPreview(false);
    }
    updateAgendaMinutes(meetingId, agenda.id, {
      minutesContent: agenda.minutesContent,
      minutesFormat: format,
    });
  };

  return (
    <Card className="min-h-0">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">議事録</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border p-1">
              <Button
                type="button"
                variant={activeFormat === "richtext" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleFormatChange("richtext")}
              >
                Rich Text
              </Button>
              <Button
                type="button"
                variant={activeFormat === "markdown" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleFormatChange("markdown")}
              >
                Markdown
              </Button>
            </div>
            {activeFormat === "markdown" && (
              <div className="flex rounded-md border p-1">
                <Button
                  type="button"
                  variant={!isMarkdownPreview ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setIsMarkdownPreview(false)}
                >
                  編集
                </Button>
                <Button
                  type="button"
                  variant={isMarkdownPreview ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setIsMarkdownPreview(true)}
                >
                  プレビュー
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeFormat === "markdown" ? (
          isMarkdownPreview ? (
            <div className="min-h-40 rounded-md border bg-background p-3 text-sm">
              {agenda.minutesContent.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {agenda.minutesContent}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground">
                  プレビューする内容がありません
                </p>
              )}
            </div>
          ) : (
            <Textarea
              value={agenda.minutesContent}
              onChange={(event) =>
                updateAgendaMinutes(meetingId, agenda.id, {
                  minutesContent: event.target.value,
                  minutesFormat: "markdown",
                })
              }
              rows={8}
              placeholder="議事録をMarkdownで入力してください"
            />
          )
        ) : (
          <div className="rounded-md border bg-background">
            <ReactQuill
              theme="snow"
              value={agenda.minutesContent}
              onChange={(value) =>
                updateAgendaMinutes(meetingId, agenda.id, {
                  minutesContent: value,
                  minutesFormat: "richtext",
                })
              }
              modules={quillModules}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// メインタイマー表示
const TimerDisplay: React.FC = () => {
  const [isHelpTooltipOpen, setIsHelpTooltipOpen] = useState(false);

  const {
    currentMeeting,
    isRunning,
    getCurrentAgenda,
    getProgressPercentage,
    startTimer,
    pauseTimer,
    stopTimer,
    syncTime,
  } = useAgendaTimerStore();

  const currentAgenda = getCurrentAgenda();
  const progress = getProgressPercentage();
  const progressDisplay = getProgressDisplay(progress);
  const isPaused = currentAgenda?.status === "paused";
  const canCompleteSession =
    currentAgenda?.status === "running" ||
    currentAgenda?.status === "paused" ||
    currentAgenda?.status === "overtime";

  // バックグラウンド復帰時の時間同期
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncTime();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [syncTime]);

  if (!currentMeeting || !currentAgenda) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">アジェンダがありません</h3>
          <p className="text-muted-foreground">
            会議にアジェンダを追加してタイマーを開始してください
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", isRunning && "ring-2 ring-blue-200 shadow-lg")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {progressDisplay.icon}
            現在のアジェンダ
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={progressDisplay.color}>
              {progressDisplay.label}
            </Badge>
            {currentMeeting.settings.silentMode ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* アジェンダタイトル */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{currentAgenda.title}</h2>
          {currentAgenda.memo && (
            <p className="text-muted-foreground text-sm">
              {currentAgenda.memo}
            </p>
          )}
        </div>

        {/* 時間表示 */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <div className="text-5xl md:text-7xl font-mono font-bold">
              {formatTime(currentAgenda.remainingTime)}
            </div>
            <div className="text-sm text-muted-foreground">
              予定時間: {formatTime(currentAgenda.plannedDuration)}
            </div>
          </div>

          {/* 進捗バー */}
          <div className="space-y-2">
            <Progress
              value={Math.min(progress, 100)}
              className="h-4"
              indicatorClassName={progressDisplay.bgColor}
            />
            <div className="flex justify-between text-sm">
              <span className={progressDisplay.color}>
                {progress.toFixed(1)}% 経過
              </span>
              <span className="text-muted-foreground">
                {progress > 100 ? `+${(progress - 100).toFixed(1)}% 超過` : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          <Tooltip
            content="開始/一時停止で進行を調整し、区切りがついたらセッション完了で次のセッションへ進めます。"
            side="top"
            open={isHelpTooltipOpen}
            onOpenChange={setIsHelpTooltipOpen}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsHelpTooltipOpen((prev) => !prev)}
              aria-label={
                isHelpTooltipOpen ? "操作説明を閉じる" : "操作説明を表示"
              }
            >
              <CircleHelp className="h-4 w-4" />
            </Button>
          </Tooltip>
          {!isRunning ? (
            <Button onClick={startTimer} size="sm">
              <Play className="mr-1 h-4 w-4" />
              {isPaused ? "再開" : "開始"}
            </Button>
          ) : (
            <Button onClick={pauseTimer} variant="outline" size="sm">
              <Pause className="mr-1 h-4 w-4" />
              一時停止
            </Button>
          )}

          <Button
            onClick={stopTimer}
            variant="destructive"
            size="sm"
            disabled={!canCompleteSession}
          >
            <Square className="w-4 h-4 mr-1" />
            セッション完了
          </Button>
        </div>

        <MinutesEditor meetingId={currentMeeting.id} agenda={currentAgenda} />
      </CardContent>
    </Card>
  );
};

// アジェンダ一覧
interface AgendaListProps {
  onAddAgenda: () => void;
  onEditAgenda: (agenda: AgendaItem) => void;
}

interface MeetingListProps {
  meetings: Meeting[];
  currentMeetingId?: string;
  onSelectMeeting: (meetingId: string) => void;
  onCreateMeeting: () => void;
  onEditMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (meeting: Meeting) => void;
  onOpenSettings: () => void;
}

const MeetingList: React.FC<MeetingListProps> = ({
  meetings,
  currentMeetingId,
  onSelectMeeting,
  onCreateMeeting,
  onEditMeeting,
  onDeleteMeeting,
  onOpenSettings,
}) => {
  const handleMeetingButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    meeting: Meeting,
  ) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-meeting-edit="true"]')) {
      event.preventDefault();
      event.stopPropagation();
      onEditMeeting(meeting);
      return;
    }

    if (target.closest('[data-meeting-delete="true"]')) {
      event.preventDefault();
      event.stopPropagation();
      onDeleteMeeting(meeting);
      return;
    }

    onSelectMeeting(meeting.id);
  };

  return (
    <Card>
      <CardHeader className="px-3 py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4" />
            会議一覧
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              {meetings.length}件
            </Badge>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onCreateMeeting}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              新しい会議
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onOpenSettings}
              disabled={!currentMeetingId}
            >
              <Settings className="mr-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        {meetings.length === 0 ? (
          <p className="text-xs text-muted-foreground">会議がありません</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {meetings.map((meeting) => (
              <Button
                key={meeting.id}
                type="button"
                variant={
                  meeting.id === currentMeetingId ? "default" : "outline"
                }
                size="sm"
                className="h-7 max-w-[260px] gap-1 px-2 text-xs"
                onClick={(event) => handleMeetingButtonClick(event, meeting)}
              >
                <span className="truncate text-left">{meeting.title}</span>
                <span className="shrink-0 text-[10px] opacity-80">
                  {meeting.agenda.length}件
                </span>
                <span
                  data-meeting-edit="true"
                  className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-sm opacity-80 hover:opacity-100"
                  aria-label="会議名を編集"
                >
                  <Edit className="h-3 w-3 pointer-events-none" />
                </span>
                <span
                  data-meeting-delete="true"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-red-500 opacity-80 hover:opacity-100"
                  aria-label="会議を削除"
                >
                  <Trash2 className="h-3 w-3 pointer-events-none" />
                </span>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AgendaList: React.FC<AgendaListProps> = ({
  onAddAgenda,
  onEditAgenda,
}) => {
  const { currentMeeting, deleteAgenda, getCurrentAgenda, selectAgenda } =
    useAgendaTimerStore();

  const currentAgenda = getCurrentAgenda();

  if (!currentMeeting) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <Clock className="h-4 w-4" />
            アジェンダ一覧
          </CardTitle>
          <Button
            onClick={() => {
              onAddAgenda();
            }}
            variant="default"
            size="sm"
            className="h-7 px-2 text-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            追加
          </Button>
        </div>
      </CardHeader>

      <CardContent className="max-h-[45vh] overflow-auto pr-1">
        <div className="space-y-3">
          {currentMeeting.agenda.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>アジェンダを追加してください</p>
            </div>
          ) : (
            [...currentMeeting.agenda]
              .sort((a, b) => a.order - b.order)
              .map((agenda) => {
                const isActive = currentAgenda?.id === agenda.id;
                const progress =
                  agenda.plannedDuration > 0
                    ? (agenda.actualDuration / agenda.plannedDuration) * 100
                    : 0;
                const progressDisplay = getProgressDisplay(progress);

                return (
                  <div
                    key={agenda.id}
                    className={cn(
                      "relative p-4 pb-11 rounded-lg border cursor-pointer",
                      isActive && "border-blue-200 bg-blue-50 shadow-md",
                      agenda.status === "completed" &&
                        "bg-green-50 border-green-200",
                      agenda.status === "overtime" &&
                        "bg-purple-50 border-purple-200",
                    )}
                    onClick={() => selectAgenda(currentMeeting.id, agenda.id)}
                  >
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          {agenda.status === "completed" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          ) : isActive ? (
                            progressDisplay.icon
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <h4 className="min-w-0 flex-1 text-sm font-medium break-words sm:truncate">
                            {agenda.title}
                          </h4>
                          {isActive && (
                            <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {agenda.status === "pending" && "待機"}
                            {agenda.status === "running" && "実行中"}
                            {agenda.status === "paused" && "一時停止"}
                            {agenda.status === "completed" && "完了"}
                            {agenda.status === "overtime" && "超過中"}
                          </Badge>
                        </div>

                        {agenda.memo && (
                          <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
                            {agenda.memo}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-4 sm:text-sm">
                          <span className="break-all sm:break-normal">
                            予定: {formatMinutes(agenda.plannedDuration)}
                          </span>
                          {agenda.actualDuration > 0 && (
                            <span
                              className={cn(
                                "break-all sm:break-normal",
                                progressDisplay.color,
                              )}
                            >
                              実績: {formatMinutes(agenda.actualDuration)}
                            </span>
                          )}
                        </div>

                        {agenda.actualDuration > 0 && (
                          <div className="mt-2">
                            <Progress
                              value={Math.min(progress, 100)}
                              className="h-2"
                              indicatorClassName={progressDisplay.bgColor}
                            />
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditAgenda(agenda);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteAgenda(currentMeeting.id, agenda.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// メインコンポーネント
export const AgendaTimerView: React.FC = () => {
  const {
    currentMeeting,
    meetings,
    tick,
    createMeeting,
    deleteMeeting,
    setCurrentMeeting,
    isRunning,
  } = useAgendaTimerStore();
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [editingAgenda, setEditingAgenda] = useState<AgendaItem | null>(null);
  const [isAgendaDialogOpen, setIsAgendaDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);

  // タイマーのtick処理
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning, tick]);

  // 初期会議作成
  useEffect(() => {
    if (meetings.length === 0) {
      createMeeting("新しい会議");
    }
  }, [meetings.length, createMeeting]);

  return (
    <div className="w-full space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground">
            {currentMeeting?.title || "会議を選択してください"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2"></div>
      </div>

      <div className="lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="w-full touch-manipulation justify-center"
          onClick={() => {
            setIsSidePanelOpen((prev) => !prev);
          }}
        >
          {isSidePanelOpen ? (
            <PanelRightClose className="w-4 h-4 mr-2 pointer-events-none" />
          ) : (
            <PanelRightOpen className="w-4 h-4 mr-2 pointer-events-none" />
          )}
          一覧
        </Button>
      </div>

      <div
        className={cn(
          "grid gap-4",
          isSidePanelOpen
            ? "lg:grid-cols-[360px_minmax(0,1fr)]"
            : "lg:grid-cols-[auto_minmax(0,1fr)]",
        )}
      >
        <div className="hidden lg:block">
          {isSidePanelOpen ? (
            <div className="space-y-3 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-1">
              <div className="flex justify-end">
                <Tooltip content="一覧を閉じる" side="top">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 touch-manipulation"
                    onClick={() => setIsSidePanelOpen(false)}
                    aria-label="一覧を閉じる"
                  >
                    <PanelRightClose className="h-3.5 w-3.5 pointer-events-none" />
                  </Button>
                </Tooltip>
              </div>
              <MeetingList
                meetings={meetings}
                currentMeetingId={currentMeeting?.id}
                onSelectMeeting={setCurrentMeeting}
                onCreateMeeting={() => {
                  setEditingMeeting(null);
                  setIsMeetingDialogOpen(true);
                }}
                onEditMeeting={(meeting) => {
                  setEditingMeeting(meeting);
                  setIsMeetingDialogOpen(true);
                }}
                onDeleteMeeting={(meeting) => {
                  const shouldDelete = window.confirm(
                    `「${meeting.title}」を削除しますか？`,
                  );
                  if (!shouldDelete) return;
                  deleteMeeting(meeting.id);
                }}
                onOpenSettings={() => setIsSettingsDialogOpen(true)}
              />
              <AgendaList
                onAddAgenda={() => {
                  setEditingAgenda(null);
                  setIsAgendaDialogOpen(true);
                }}
                onEditAgenda={(agenda) => {
                  setEditingAgenda(agenda);
                  setIsAgendaDialogOpen(true);
                }}
              />
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7 touch-manipulation"
              onClick={() => setIsSidePanelOpen(true)}
            >
              <PanelRightOpen className="h-3.5 w-3.5 pointer-events-none" />
            </Button>
          )}
        </div>

        <div>
          <TimerDisplay />
        </div>
      </div>

      {isSidePanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsSidePanelOpen(false)}
        >
          <div
            className="mr-auto h-full w-[88vw] max-w-md bg-background p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="max-h-[calc(100vh-120px)] space-y-3 overflow-y-auto pr-1">
              <div className="flex justify-end">
                <Tooltip content="一覧を閉じる" side="top">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 touch-manipulation"
                    onClick={() => setIsSidePanelOpen(false)}
                    aria-label="一覧を閉じる"
                  >
                    <PanelRightClose className="h-3.5 w-3.5 pointer-events-none" />
                  </Button>
                </Tooltip>
              </div>
              <MeetingList
                meetings={meetings}
                currentMeetingId={currentMeeting?.id}
                onSelectMeeting={setCurrentMeeting}
                onCreateMeeting={() => {
                  setEditingMeeting(null);
                  setIsMeetingDialogOpen(true);
                }}
                onEditMeeting={(meeting) => {
                  setEditingMeeting(meeting);
                  setIsMeetingDialogOpen(true);
                }}
                onDeleteMeeting={(meeting) => {
                  const shouldDelete = window.confirm(
                    `「${meeting.title}」を削除しますか？`,
                  );
                  if (!shouldDelete) return;
                  deleteMeeting(meeting.id);
                }}
                onOpenSettings={() => setIsSettingsDialogOpen(true)}
              />
              <AgendaList
                onAddAgenda={() => {
                  setEditingAgenda(null);
                  setIsAgendaDialogOpen(true);
                }}
                onEditAgenda={(agenda) => {
                  setEditingAgenda(agenda);
                  setIsAgendaDialogOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

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

      {/* ダイアログ */}
      <MeetingDialog
        meeting={editingMeeting}
        isOpen={isMeetingDialogOpen}
        onClose={() => {
          setIsMeetingDialogOpen(false);
          setEditingMeeting(null);
        }}
      />

      {currentMeeting && (
        <SettingsDialog
          meeting={currentMeeting}
          isOpen={isSettingsDialogOpen}
          onClose={() => setIsSettingsDialogOpen(false)}
        />
      )}
    </div>
  );
};
