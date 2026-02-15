import { formatDuration } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Play,
  Pause,
  Square,
  RotateCcw,
  Trash2,
  Copy,
  Settings,
  Timer,
  Clock,
  CheckCircle,
  Circle,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { useMultiTimerStore } from "@/features/timer/stores/multi-timer-store";
import { TIMER_STATUS_CONFIG, getTimerStatus } from "@/constants/timer-theme";

const parseDuration = (input: string): number => {
  // MM:SS または H:MM:SS 形式をパース
  const parts = input.split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]; // MM:SS
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]; // H:MM:SS
  }
  // 分数のみの場合
  const minutes = parseInt(input, 10);
  return isNaN(minutes) ? 0 : minutes * 60;
};

interface TimerFormData {
  name: string;
  duration: string;
  category: string;
  description: string;
  color: string;
}

const TIMER_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-yellow-500",
  "bg-indigo-500",
  "bg-teal-500",
];

const AddTimerDialog: React.FC = () => {
  const { addTimer, categories, addCategory } = useMultiTimerStore();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<TimerFormData>({
    name: "",
    duration: "",
    category: "",
    description: "",
    color: TIMER_COLORS[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.duration) return;

    const durationSeconds = parseDuration(formData.duration);
    if (durationSeconds <= 0) return;

    // 新しいカテゴリを追加（必要に応じて）
    if (formData.category && !categories.includes(formData.category)) {
      addCategory(formData.category);
    }

    addTimer({
      name: formData.name,
      duration: durationSeconds,
      category: formData.category || undefined,
      description: formData.description || undefined,
      color: formData.color,
    });

    // フォームリセット
    setFormData({
      name: "",
      duration: "",
      category: "",
      description: "",
      color: TIMER_COLORS[0],
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          タイマーを追加
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新しいタイマーを作成</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="timer-name">タイマー名</Label>
            <Input
              id="timer-name"
              placeholder="例: 運動、勉強、料理"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="timer-duration">時間（MM:SS または 分数）</Label>
            <Input
              id="timer-duration"
              placeholder="例: 25:00, 10:30, 45"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="timer-category">カテゴリ（任意）</Label>
            <Select
              value={formData.category}
              onValueChange={(value: string) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timer-description">説明（任意）</Label>
            <Textarea
              id="timer-description"
              placeholder="タイマーの詳細説明"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
            />
          </div>

          <div>
            <Label>色</Label>
            <div className="flex gap-2 mt-2">
              {TIMER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full ${color} ${
                    formData.color === color
                      ? "ring-2 ring-offset-2 ring-gray-400"
                      : ""
                  }`}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">作成</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const TimerCard: React.FC<{
  timer: import("@/types/multi-timer").MultiTimer;
}> = ({ timer }) => {
  const {
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    deleteTimer,
    duplicateTimer,
  } = useMultiTimerStore();

  const progress =
    timer.duration > 0
      ? ((timer.duration - timer.remainingTime) / timer.duration) * 100
      : 0;

  const timerStatus = getTimerStatus(
    timer.isRunning,
    timer.isPaused,
    timer.isCompleted,
  );
  const statusConfig = TIMER_STATUS_CONFIG[timerStatus];

  return (
    <Card
      className={`${timer.isRunning ? "ring-2 ring-blue-200" : ""} ${timer.isCompleted ? "bg-green-50" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{timer.name}</CardTitle>
            <div
              className={`flex items-center gap-2 mt-1 ${statusConfig.color}`}
            >
              {statusConfig.icon}
              <span className="text-sm font-medium">{statusConfig.label}</span>
              {timer.category && (
                <Badge variant="secondary" className="text-xs text-foreground">
                  {timer.category}
                </Badge>
              )}
            </div>
          </div>
          <div className={`w-4 h-4 rounded-full ${timer.color}`} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 時間表示 */}
        <div className="text-center">
          <div className="text-3xl font-mono font-bold">
            {formatDuration(timer.remainingTime)}
          </div>
          <div className="text-sm text-muted-foreground">
            / {formatDuration(timer.duration)}
          </div>
        </div>

        {/* 進捗バー */}
        <Progress
          value={progress}
          className="h-2"
          indicatorClassName={timer.color}
        />

        {/* 説明 */}
        {timer.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {timer.description}
          </p>
        )}

        {/* コントロールボタン */}
        <div className="flex justify-center gap-2">
          {!timer.isRunning && !timer.isCompleted ? (
            <Button
              size="sm"
              onClick={() => startTimer(timer.id)}
              disabled={timer.isCompleted}
            >
              <Play className="w-4 h-4 mr-1" />
              開始
            </Button>
          ) : timer.isRunning ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => pauseTimer(timer.id)}
            >
              <Pause className="w-4 h-4 mr-1" />
              一時停止
            </Button>
          ) : null}

          <Button
            size="sm"
            variant="outline"
            onClick={() => stopTimer(timer.id)}
            disabled={!timer.isRunning && !timer.isPaused}
          >
            <Square className="w-4 h-4 mr-1" />
            停止
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => resetTimer(timer.id)}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            リセット
          </Button>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-center gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => duplicateTimer(timer.id)}
          >
            <Copy className="w-4 h-4 mr-1" />
            複製
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteTimer(timer.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            削除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const GlobalControls: React.FC = () => {
  const {
    timers,
    isAnyRunning,
    startAllTimers,
    pauseAllTimers,
    stopAllTimers,
    resetAllTimers,
    globalSettings,
    updateGlobalSettings,
  } = useMultiTimerStore();

  const hasTimers = timers.length > 0;
  const hasIncompleteTimers = timers.some((t) => !t.isCompleted);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          グローバル制御
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 一括制御ボタン */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={startAllTimers}
            disabled={!hasIncompleteTimers}
            size="sm"
          >
            <PlayCircle className="w-4 h-4 mr-1" />
            すべて開始
          </Button>

          <Button
            onClick={pauseAllTimers}
            variant="outline"
            disabled={!isAnyRunning}
            size="sm"
          >
            <PauseCircle className="w-4 h-4 mr-1" />
            すべて一時停止
          </Button>

          <Button
            onClick={stopAllTimers}
            variant="outline"
            disabled={!hasTimers}
            size="sm"
          >
            <Square className="w-4 h-4 mr-1" />
            すべて停止
          </Button>

          <Button
            onClick={resetAllTimers}
            variant="outline"
            disabled={!hasTimers}
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            すべてリセット
          </Button>
        </div>

        {/* 設定 */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-sm">通知を表示</Label>
            <Switch
              checked={globalSettings.showNotifications}
              onCheckedChange={(checked) =>
                updateGlobalSettings({ showNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">完了音を再生</Label>
            <Switch
              checked={globalSettings.soundEnabled}
              onCheckedChange={(checked) =>
                updateGlobalSettings({ soundEnabled: checked })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MultiTimerView: React.FC = () => {
  const { timers, isAnyRunning, tick, getRunningTimers, getCompletedTimers } =
    useMultiTimerStore();

  // タイマーのtick処理
  useEffect(() => {
    if (isAnyRunning) {
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [isAnyRunning, tick]);

  // 通知権限をリクエスト
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const runningTimers = getRunningTimers();
  const completedTimers = getCompletedTimers();
  const waitingTimers = timers.filter((t) => !t.isRunning && !t.isCompleted);

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <Timer className="h-6 w-6" />
              複数タイマー
            </CardTitle>
            <CardDescription>
              複数のタイマーを同時に管理できます
            </CardDescription>
          </div>
          <AddTimerDialog />
        </CardHeader>
      </Card>

      {/* 統計サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div
            className={`text-2xl font-bold ${TIMER_STATUS_CONFIG.running.color}`}
          >
            {runningTimers.length}
          </div>
          <div className="text-sm text-muted-foreground">実行中</div>
        </Card>
        <Card className="text-center p-4">
          <div
            className={`text-2xl font-bold ${TIMER_STATUS_CONFIG.idle.color}`}
          >
            {waitingTimers.length}
          </div>
          <div className="text-sm text-muted-foreground">待機中</div>
        </Card>
        <Card className="text-center p-4">
          <div
            className={`text-2xl font-bold ${TIMER_STATUS_CONFIG.completed.color}`}
          >
            {completedTimers.length}
          </div>
          <div className="text-sm text-muted-foreground">完了</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-foreground">
            {timers.length}
          </div>
          <div className="text-sm text-muted-foreground">総数</div>
        </Card>
      </div>

      {/* グローバル制御 */}
      <GlobalControls />

      {/* タイマー一覧 */}
      {timers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">タイマーがありません</h3>
            <p className="text-muted-foreground mb-4">
              新しいタイマーを作成して開始しましょう
            </p>
            <AddTimerDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {timers.map((timer) => (
            <TimerCard key={timer.id} timer={timer} />
          ))}
        </div>
      )}
    </div>
  );
};
