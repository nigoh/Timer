import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
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
  TrendingUp
} from 'lucide-react';
import { usePomodoroStore } from '../stores/pomodoro-store';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const PomodoroSettings: React.FC = () => {
  const {
    settings,
    updateSettings,
    isRunning
  } = usePomodoroStore();

  const [localSettings, setLocalSettings] = useState(settings);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
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
          {/* プリセット設定 */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              プリセット設定
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {presetSettings.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => setLocalSettings({
                    ...localSettings,
                    workDuration: preset.work,
                    shortBreakDuration: preset.shortBreak,
                    longBreakDuration: preset.longBreak,
                    longBreakInterval: preset.interval,
                  })}
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
          
          {/* 時間設定 */}
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
                onValueChange={([value]: number[]) => setLocalSettings({
                  ...localSettings,
                  workDuration: value
                })}
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
                onValueChange={([value]: number[]) => setLocalSettings({
                  ...localSettings,
                  shortBreakDuration: value
                })}
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
                onValueChange={([value]: number[]) => setLocalSettings({
                  ...localSettings,
                  longBreakDuration: value
                })}
                className="w-full"
              />
            </div>
            
            <div>
              <Label htmlFor="long-break-interval" className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" />
                長休憩の間隔: {localSettings.longBreakInterval}ポモドーロ毎
              </Label>
              <Slider
                id="long-break-interval"
                min={2}
                max={8}
                step={1}
                value={[localSettings.longBreakInterval]}
                onValueChange={([value]: number[]) => setLocalSettings({
                  ...localSettings,
                  longBreakInterval: value
                })}
                className="w-full"
              />
            </div>
          </div>
          
          {/* 自動化設定 */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">自動化設定</Label>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-start-breaks" className="text-sm">
                休憩の自動開始
              </Label>
              <Switch
                id="auto-start-breaks"
                checked={localSettings.autoStartBreaks}
                onCheckedChange={(checked: boolean) => setLocalSettings({
                  ...localSettings,
                  autoStartBreaks: checked
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-start-work" className="text-sm">
                作業の自動開始
              </Label>
              <Switch
                id="auto-start-work"
                checked={localSettings.autoStartWork}
                onCheckedChange={(checked: boolean) => setLocalSettings({
                  ...localSettings,
                  autoStartWork: checked
                })}
              />
            </div>
          </div>
          
          {/* アクションボタン */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>
              設定を保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const EnhancedPomodoroTimer: React.FC = () => {
  const {
    currentPhase,
    timeRemaining,
    isRunning,
    isPaused,
    cycle,
    taskName,
    todayStats,
    settings,
    start,
    pause,
    stop,
    skip,
    reset,
    setTaskName,
    tick,
  } = usePomodoroStore();

  const [localTaskName, setLocalTaskName] = useState(taskName);

  // タイマーのtick処理
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning, tick]);

  // タスク名の同期
  useEffect(() => {
    setTaskName(localTaskName);
  }, [localTaskName, setTaskName]);

  const getCurrentPhaseDuration = () => {
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
  };

  const progress = ((getCurrentPhaseDuration() - timeRemaining) / getCurrentPhaseDuration()) * 100;

  const getPhaseIcon = () => {
    switch (currentPhase) {
      case 'work':
        return <Zap className="w-5 h-5" />;
      case 'short-break':
      case 'long-break':
        return <Coffee className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getPhaseLabel = () => {
    switch (currentPhase) {
      case 'work':
        return '作業時間';
      case 'short-break':
        return '短い休憩';
      case 'long-break':
        return '長い休憩';
      default:
        return 'ポモドーロ';
    }
  };

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'work':
        return 'bg-blue-500';
      case 'short-break':
        return 'bg-green-500';
      case 'long-break':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = () => {
    if (isRunning) return { text: '実行中', variant: 'default' as const };
    if (isPaused) return { text: '一時停止', variant: 'secondary' as const };
    return { text: '待機', variant: 'outline' as const };
  };

  const status = getStatusBadge();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* メインタイマーカード */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              ポモドーロタイマー
            </CardTitle>
            <Badge variant={status.variant}>{status.text}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* フェーズ表示 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${getPhaseColor()} text-white`}>
                {getPhaseIcon()}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{getPhaseLabel()}</h3>
                <p className="text-sm text-muted-foreground">
                  サイクル {cycle} / {settings.longBreakInterval}
                </p>
              </div>
            </div>
          </div>
          
          {/* タスク名入力 */}
          {currentPhase === 'work' && (
            <div className="space-y-2">
              <Label htmlFor="task-name" className="text-sm font-medium">
                現在のタスク（任意）
              </Label>
              <Input
                id="task-name"
                placeholder="例: レポート作成、コーディング、資料読み込み"
                value={localTaskName}
                onChange={(e) => setLocalTaskName(e.target.value)}
                disabled={isRunning}
                className="text-center"
              />
            </div>
          )}
          
          {/* 時間表示 */}
          <div className="text-center space-y-4">
            <div className="text-6xl md:text-8xl font-mono font-bold tracking-wider">
              {formatTime(timeRemaining)}
            </div>
            
            {/* 進捗バー */}
            <div className="space-y-2">
              <Progress 
                value={progress} 
                className="h-3"
                indicatorClassName={getPhaseColor()}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>設定時間: {formatTime(getCurrentPhaseDuration())}</span>
                <span>{Math.round(progress)}% 経過</span>
              </div>
            </div>
          </div>
          
          {/* コントロールボタン */}
          <div className="flex justify-center gap-3">
            {!isRunning ? (
              <Button
                onClick={start}
                size="lg"
                className="px-8"
              >
                <Play className="mr-2 h-5 w-5" />
                {isPaused ? '再開' : '開始'}
              </Button>
            ) : (
              <Button
                onClick={pause}
                variant="outline"
                size="lg"
                className="px-8"
              >
                <Pause className="mr-2 h-5 w-5" />
                一時停止
              </Button>
            )}
            
            <Button onClick={stop} variant="destructive" size="lg">
              <Square className="mr-2 h-5 w-5" />
              停止
            </Button>
            
            <Button onClick={skip} variant="outline" size="lg">
              <SkipForward className="mr-2 h-5 w-5" />
              スキップ
            </Button>
            
            <Button onClick={reset} variant="outline" size="lg">
              <RotateCcw className="mr-2 h-5 w-5" />
              リセット
            </Button>
          </div>
          
          {/* 設定ボタン */}
          <div className="flex justify-center pt-2 border-t">
            <PomodoroSettings />
          </div>
        </CardContent>
      </Card>
      
      {/* 今日の統計 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">今日の統計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{todayStats.completedPomodoros}</div>
              <div className="text-sm text-muted-foreground">完了ポモドーロ</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{todayStats.totalFocusTime}</div>
              <div className="text-sm text-muted-foreground">集中時間（分）</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{todayStats.totalBreakTime}</div>
              <div className="text-sm text-muted-foreground">休憩時間（分）</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {todayStats.completedPomodoros > 0 ? Math.round((todayStats.totalFocusTime / (todayStats.completedPomodoros * settings.workDuration)) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">完了率</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
