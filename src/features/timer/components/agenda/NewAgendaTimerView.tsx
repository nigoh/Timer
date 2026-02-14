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
import {
  Play,
  Pause,
  Clock,
  CheckCircle2,
  Circle,
  SkipForward,
  SkipBack,
  Plus,
  Edit,
  Trash2,
  Settings,
  Users,
  Timer,
  AlertCircle,
  ChevronRight,
  Volume2,
  VolumeX,
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {meeting ? "会議を編集" : "新しい会議を作成"}
          </DialogTitle>
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {agenda ? "アジェンダを編集" : "新しいアジェンダを追加"}
          </DialogTitle>
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            会議設定
          </DialogTitle>
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

// メインタイマー表示
const TimerDisplay: React.FC = () => {
  const {
    currentMeeting,
    isRunning,
    getCurrentAgenda,
    getProgressPercentage,
    startTimer,
    pauseTimer,
    nextAgenda,
    previousAgenda,
    syncTime,
  } = useAgendaTimerStore();

  const currentAgenda = getCurrentAgenda();
  const progress = getProgressPercentage();
  const progressDisplay = getProgressDisplay(progress);
  const isPaused = currentAgenda?.status === "paused";
  const canCompleteSession =
    currentAgenda?.status === "running" || currentAgenda?.status === "paused";

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


  const canMovePrevious =
    !isRunning &&
    currentMeeting.agenda.some((agenda) => agenda.order < currentAgenda.order);
  const canMoveNext =
    !isRunning &&
    (currentAgenda.status === "running" ||
      currentAgenda.status === "paused" ||
      currentAgenda.status === "overtime") &&
    currentMeeting.agenda.some(
      (agenda) => agenda.status === "pending" && agenda.id !== currentAgenda.id,
    );

  return (
    <Card
      className={cn(
        "transition-all duration-300",
        isRunning && "ring-2 ring-blue-200 shadow-lg",
      )}
    >
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

        {/* ワンタップ開始ボタン */}
        <div className="flex justify-center">
          {!isRunning ? (
            <Button
              onClick={startTimer}
              size="lg"
              className="px-12 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Play className="mr-3 h-6 w-6" />
              {isPaused ? "再開" : "開始"}
            </Button>
          ) : (
            <Button
              onClick={pauseTimer}
              variant="outline"
              size="lg"
              className="px-12 py-6 text-lg rounded-full"
            >
              <Pause className="mr-3 h-6 w-6" />
              一時停止
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          一時停止で調整し、区切りがついたらセッション完了で次のセッションへ進めます。
        </p>

        {/* 制御ボタン */}
        <div className="flex justify-center gap-3">
          <Button
            onClick={previousAgenda}
            variant="outline"
            size="sm"
            disabled={!canMovePrevious}
          >
            <SkipBack className="w-4 h-4 mr-1" />
            前へ
          </Button>

          <Button
            onClick={stopTimer}
            variant="destructive"
            size="sm"
            disabled={!canStopSession}
          >
            <Square className="w-4 h-4 mr-1" />
            セッション停止
          </Button>

          <Button
            onClick={nextAgenda}
            variant="outline"
            size="sm"
            disabled={!canMoveNext}
          >
            次へ
            <SkipForward className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// アジェンダ一覧
const AgendaList: React.FC = () => {
  const { currentMeeting, deleteAgenda, getCurrentAgenda } =
    useAgendaTimerStore();
  const [editingAgenda, setEditingAgenda] = useState<AgendaItem | null>(null);
  const [isAgendaDialogOpen, setIsAgendaDialogOpen] = useState(false);

  const currentAgenda = getCurrentAgenda();

  if (!currentMeeting) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            アジェンダ一覧
          </CardTitle>
          <Button
            onClick={() => {
              setEditingAgenda(null);
              setIsAgendaDialogOpen(true);
            }}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            追加
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {currentMeeting.agenda.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>アジェンダを追加してください</p>
            </div>
          ) : (
            currentMeeting.agenda
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
                      "p-4 rounded-lg border transition-all duration-200",
                      isActive && "border-blue-200 bg-blue-50 shadow-md",
                      agenda.status === "completed" &&
                        "bg-green-50 border-green-200",
                      agenda.status === "overtime" &&
                        "bg-purple-50 border-purple-200",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {agenda.status === "completed" ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : isActive ? (
                            progressDisplay.icon
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                          <h4 className="font-medium truncate">
                            {agenda.title}
                          </h4>
                          {isActive && (
                            <ChevronRight className="w-4 h-4 text-blue-500" />
                          )}
                        </div>

                        {agenda.memo && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {agenda.memo}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                          <span>
                            予定: {formatMinutes(agenda.plannedDuration)}
                          </span>
                          {agenda.actualDuration > 0 && (
                            <span className={progressDisplay.color}>
                              実績: {formatMinutes(agenda.actualDuration)}
                            </span>
                          )}
                          <Badge variant="outline">
                            {agenda.status === "pending" && "待機"}
                            {agenda.status === "running" && "実行中"}
                            {agenda.status === "paused" && "一時停止"}
                            {agenda.status === "completed" && "完了"}
                            {agenda.status === "overtime" && "超過中"}
                          </Badge>
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

                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingAgenda(agenda);
                            setIsAgendaDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            deleteAgenda(currentMeeting.id, agenda.id)
                          }
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

        <AgendaDialog
          meetingId={currentMeeting.id}
          agenda={editingAgenda}
          isOpen={isAgendaDialogOpen}
          onClose={() => {
            setIsAgendaDialogOpen(false);
            setEditingAgenda(null);
          }}
        />
      </CardContent>
    </Card>
  );
};

// メインコンポーネント
export const NewAgendaTimerView: React.FC = () => {
  const { currentMeeting, meetings, tick, createMeeting, isRunning } =
    useAgendaTimerStore();
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            会議タイマー
          </h2>
          <p className="text-muted-foreground">
            {currentMeeting?.title || "会議を選択してください"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingMeeting(null);
              setIsMeetingDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            新しい会議
          </Button>
          {currentMeeting && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingMeeting(currentMeeting);
                setIsMeetingDialogOpen(true);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              会議名を編集
            </Button>
          )}
          {currentMeeting && (
            <Button
              variant="outline"
              onClick={() => setIsSettingsDialogOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              設定
            </Button>
          )}
        </div>
      </div>

      {/* メインタイマー */}
      <TimerDisplay />

      {/* アジェンダ一覧 */}
      <AgendaList />

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
