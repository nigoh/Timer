import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Timer, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useBasicTimerStore } from '../stores/basic-timer-store';
import { TimerSettings } from './TimerSettings';
import { TimerHistory } from './TimerHistory';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const BasicTimer: React.FC = () => {
  const {
    duration,
    remainingTime,
    isRunning,
    isPaused,
    sessionLabel,
    history,
    setDuration,
    start,
    pause,
    stop,
    reset,
    setSessionLabel,
    tick,
    deleteHistoryEntry,
    clearHistory,
  } = useBasicTimerStore();

  const [localLabel, setLocalLabel] = useState(sessionLabel);

  // タイマーのtick処理
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning, tick]);

  // セッションラベルの同期
  useEffect(() => {
    setSessionLabel(localLabel);
  }, [localLabel, setSessionLabel]);

  const progress = duration > 0 ? ((duration - remainingTime) / duration) * 100 : 0;
  const isCompleted = remainingTime === 0 && !isRunning;

  const getStatusBadge = () => {
    if (isRunning) return { text: '実行中', variant: 'default' as const };
    if (isPaused) return { text: '一時停止', variant: 'secondary' as const };
    if (isCompleted) return { text: '完了', variant: 'secondary' as const };
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
              <Timer className="h-6 w-6" />
              基本タイマー
            </CardTitle>
            <Badge variant={status.variant}>{status.text}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* セッションラベル入力 */}
          <div className="space-y-2">
            <Label htmlFor="session-label" className="text-sm font-medium">
              セッション名（任意）
            </Label>
            <Input
              id="session-label"
              placeholder="例: 集中作業、読書、運動など"
              value={localLabel}
              onChange={(e) => setLocalLabel(e.target.value)}
              disabled={isRunning}
              className="text-center"
            />
          </div>
          
          {/* 時間表示 */}
          <div className="text-center space-y-4">
            <div className="text-6xl md:text-8xl font-mono font-bold tracking-wider">
              {formatTime(remainingTime)}
            </div>
            
            {/* 進捗バー */}
            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>設定時間: {formatTime(duration)}</span>
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
                disabled={remainingTime === 0}
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
            
            <Button onClick={reset} variant="outline" size="lg">
              <RotateCcw className="mr-2 h-5 w-5" />
              リセット
            </Button>
          </div>
          
          {/* 設定と履歴ボタン */}
          <div className="flex justify-center gap-3 pt-2 border-t">
            <TimerSettings
              duration={duration}
              onDurationChange={setDuration}
              disabled={isRunning}
            />
            
            <TimerHistory
              history={history}
              onDeleteEntry={deleteHistoryEntry}
              onClearHistory={clearHistory}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* 最新履歴のクイックビュー */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">最近のセッション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {history.slice(0, 3).map((entry) => {
                const efficiency = entry.duration > 0 ? (entry.actualDuration / entry.duration) * 100 : 0;
                return (
                  <div key={entry.id} className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {entry.label}
                      </span>
                      <Badge variant={entry.completed ? "secondary" : "outline"} className="text-xs">
                        {entry.completed ? '完了' : '中断'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(entry.actualDuration)} / {formatTime(entry.duration)}
                    </div>
                    <div className="text-xs">
                      効率: <span className={efficiency <= 100 ? 'text-green-600' : 'text-orange-600'}>
                        {Math.round(efficiency)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
