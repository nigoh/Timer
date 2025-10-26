import { useEffect, useMemo, useState } from 'react';
import {
  Target,
  Play,
  Pause,
  Square,
  RotateCcw,
  Settings,
  Coffee,
  Zap,
  SkipForward,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PomodoroPhase, PomodoroSettings } from '@/types/pomodoro';
import { formatTime } from '@/lib/utils';

interface PomodoroSettingsDialogProps {
  settings: PomodoroSettings;
  isRunning: boolean;
  onSave: (settings: PomodoroSettings) => void;
}

const PomodoroSettingsDialog = ({
  settings,
  isRunning,
  onSave,
}: PomodoroSettingsDialogProps) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    setIsOpen(false);
  };

  const presetSettings = [
    { name: 'クラシック', work: 25, shortBreak: 5, longBreak: 15, interval: 4 },
    { name: '集中型', work: 50, shortBreak: 10, longBreak: 30, interval: 3 },
    { name: '短時間型', work: 15, shortBreak: 3, longBreak: 10, interval: 4 },
    { name: '長時間型', work: 90, shortBreak: 20, longBreak: 45, interval: 2 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isRunning}>
          <Settings className="w-4 h-4 mr-2" />
          設定
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            ポモドーロ設定
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-3 block">プリセット設定</Label>
            <div className="grid grid-cols-2 gap-2">
              {presetSettings.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      workDuration: preset.work,
                      shortBreakDuration: preset.shortBreak,
                      longBreakDuration: preset.longBreak,
                      longBreakInterval: preset.interval,
                    })
                  }
                  className="text-xs justify-start"
                >
                  <div className="text-left">
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {preset.work}分 / {preset.shortBreak}分
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="work-duration" className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4" />
                作業時間: {localSettings.workDuration}分
              </Label>
              <Slider
                id="work-duration"
                min={5}
                max={120}
                step={5}
                value={[localSettings.workDuration]}
                onValueChange={([value]: number[]) =>
                  setLocalSettings({
                    ...localSettings,
                    workDuration: value,
                  })
                }
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="short-break" className="flex items-center gap-2 mb-2">
                <Coffee className="w-4 h-4" />
                短い休憩: {localSettings.shortBreakDuration}分
              </Label>
              <Slider
                id="short-break"
                min={1}
                max={30}
                step={1}
                value={[localSettings.shortBreakDuration]}
                onValueChange={([value]: number[]) =>
                  setLocalSettings({
                    ...localSettings,
                    shortBreakDuration: value,
                  })
                }
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="long-break" className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                長い休憩: {localSettings.longBreakDuration}分
              </Label>
              <Slider
                id="long-break"
                min={10}
                max={60}
                step={5}
                value={[localSettings.longBreakDuration]}
                onValueChange={([value]: number[]) =>
                  setLocalSettings({
                    ...localSettings,
                    longBreakDuration: value,
                  })
                }
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="long-break-interval" className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" />
                長い休憩の間隔: {localSettings.longBreakInterval}セット
              </Label>
              <Slider
                id="long-break-interval"
                min={2}
                max={8}
                step={1}
                value={[localSettings.longBreakInterval]}
                onValueChange={([value]: number[]) =>
                  setLocalSettings({
                    ...localSettings,
                    longBreakInterval: value,
                  })
                }
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">自動化設定</Label>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-start-breaks" className="text-sm">
                休憩の自動開始
              </Label>
              <Switch
                id="auto-start-breaks"
                checked={localSettings.autoStartBreaks}
                onCheckedChange={(checked: boolean) =>
                  setLocalSettings({
                    ...localSettings,
                    autoStartBreaks: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-start-work" className="text-sm">
                作業の自動開始
              </Label>
              <Switch
                id="auto-start-work"
                checked={localSettings.autoStartWork}
                onCheckedChange={(checked: boolean) =>
                  setLocalSettings({
                    ...localSettings,
                    autoStartWork: checked,
                  })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>設定を保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface EnhancedPomodoroTimerViewProps {
  currentPhase: PomodoroPhase;
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  cycle: number;
  settings: PomodoroSettings;
  todayStats: {
    completedPomodoros: number;
    totalFocusTime: number;
    totalBreakTime: number;
    efficiency: number;
  };
  taskName: string;
  onTaskNameChange: (value: string) => void;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onSkip: () => void;
  onReset: () => void;
  onSettingsSave: (settings: PomodoroSettings) => void;
}

const phaseInfoMap: Record<
  PomodoroPhase,
  { name: string; color: string; progressColor: string }
> = {
  work: {
    name: '作業時間',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    progressColor: 'bg-blue-500',
  },
  'short-break': {
    name: '短い休憩',
    color: 'bg-green-100 text-green-800 border-green-200',
    progressColor: 'bg-green-500',
  },
  'long-break': {
    name: '長い休憩',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    progressColor: 'bg-purple-500',
  },
};

export const EnhancedPomodoroTimerView = ({
  currentPhase,
  timeRemaining,
  isRunning,
  isPaused,
  cycle,
  settings,
  todayStats,
  taskName,
  onTaskNameChange,
  onStart,
  onPause,
  onStop,
  onSkip,
  onReset,
  onSettingsSave,
}: EnhancedPomodoroTimerViewProps) => {
  const currentPhaseDuration = useMemo(() => {
    switch (currentPhase) {
      case 'work':
        return settings.workDuration * 60;
      case 'short-break':
        return settings.shortBreakDuration * 60;
      case 'long-break':
        return settings.longBreakDuration * 60;
      default:
        return settings.workDuration * 60;
    }
  }, [currentPhase, settings]);

  const progress = ((currentPhaseDuration - timeRemaining) / currentPhaseDuration) * 100;
  const phaseInfo = phaseInfoMap[currentPhase] ?? phaseInfoMap.work;

  const statusBadge = isRunning
    ? { text: '実行中', variant: 'default' as const }
    : isPaused
    ? { text: '一時停止', variant: 'secondary' as const }
    : { text: '待機中', variant: 'outline' as const };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              ポモドーロタイマー
            </CardTitle>
            <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${phaseInfo.color}`}>
                {currentPhase === 'work' ? (
                  <Zap className="w-5 h-5" />
                ) : (
                  <Coffee className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{phaseInfo.name}</h3>
                <p className="text-sm text-muted-foreground">
                  サイクル {cycle} / {settings.longBreakInterval}
                </p>
              </div>
            </div>
          </div>

          {currentPhase === 'work' && (
            <div className="space-y-2">
              <Label htmlFor="task-name" className="text-sm font-medium">
                現在のタスク（任意）
              </Label>
              <Input
                id="task-name"
                placeholder="例: レポート作成、コーディング、資料読み込み"
                value={taskName}
                onChange={(event) => onTaskNameChange(event.target.value)}
                disabled={isRunning}
                className="text-center"
              />
            </div>
          )}

          <div className="text-center space-y-4">
            <div className="text-6xl md:text-8xl font-mono font-bold tracking-wider">
              {formatTime(timeRemaining)}
            </div>

            <div className="space-y-2">
              <Progress
                value={progress}
                className="h-3"
                indicatorClassName={phaseInfo.progressColor}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>設定時間 {formatTime(currentPhaseDuration)}</span>
                <span>{Math.round(progress)}% 経過</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            {!isRunning ? (
              <Button onClick={onStart} size="lg" className="px-8">
                <Play className="mr-2 h-5 w-5" />
                {isPaused ? '再開' : '開始'}
              </Button>
            ) : (
              <Button onClick={onPause} variant="outline" size="lg" className="px-8">
                <Pause className="mr-2 h-5 w-5" />
                一時停止
              </Button>
            )}

            <Button onClick={onStop} variant="destructive" size="lg">
              <Square className="mr-2 h-5 w-5" />
              停止
            </Button>

            <Button onClick={onSkip} variant="outline" size="lg">
              <SkipForward className="mr-2 h-5 w-5" />
              スキップ
            </Button>

            <Button onClick={onReset} variant="outline" size="lg">
              <RotateCcw className="mr-2 h-5 w-5" />
              リセット
            </Button>
          </div>

          <div className="flex justify-center pt-2 border-t">
            <PomodoroSettingsDialog
              settings={settings}
              isRunning={isRunning}
              onSave={onSettingsSave}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">今日の統計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {todayStats.completedPomodoros}
              </div>
              <div className="text-sm text-muted-foreground">完了ポモドーロ</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {todayStats.totalFocusTime}
              </div>
              <div className="text-sm text-muted-foreground">集中時間（分）</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {todayStats.totalBreakTime}
              </div>
              <div className="text-sm text-muted-foreground">休憩時間（分）</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {todayStats.completedPomodoros > 0
                  ? Math.round(
                      (todayStats.totalFocusTime /
                        (todayStats.completedPomodoros * settings.workDuration)) *
                        100,
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-muted-foreground">達成率</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
