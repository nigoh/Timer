import React from 'react';
import { Timer, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TimerSettings } from '@/components/TimerSettings';
import { TimerHistory } from '@/components/TimerHistory';
import { BasicTimerHistory } from '@/types/timer';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

type StatusVariant = 'default' | 'secondary' | 'outline';

interface StatusBadge {
  text: string;
  variant: StatusVariant;
}

export interface BasicTimerViewProps {
  duration: number;
  remainingTime: number;
  isRunning: boolean;
  isPaused: boolean;
  sessionLabel: string;
  history: BasicTimerHistory[];
  onSessionLabelChange: (value: string) => void;
  onDurationChange: (duration: number) => void;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onDeleteHistoryEntry: (id: string) => void;
  onClearHistory: () => void;
}

export const BasicTimerView: React.FC<BasicTimerViewProps> = ({
  duration,
  remainingTime,
  isRunning,
  isPaused,
  sessionLabel,
  history,
  onSessionLabelChange,
  onDurationChange,
  onStart,
  onPause,
  onStop,
  onReset,
  onDeleteHistoryEntry,
  onClearHistory,
}) => {
  const progress = duration > 0 ? ((duration - remainingTime) / duration) * 100 : 0;
  const isCompleted = remainingTime === 0 && !isRunning;

  const getStatusBadge = (): StatusBadge => {
    if (isRunning) return { text: '実行中', variant: 'default' };
    if (isPaused) return { text: '一時停止', variant: 'secondary' };
    if (isCompleted) return { text: '完了', variant: 'secondary' };
    return { text: '待機中', variant: 'outline' };
  };

  const status = getStatusBadge();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
          <div className="space-y-2">
            <Label htmlFor="session-label" className="text-sm font-medium">
              セッション名（任意）
            </Label>
            <Input
              id="session-label"
              placeholder="例: 集中作業、読書、運動など"
              value={sessionLabel}
              onChange={(e) => onSessionLabelChange(e.target.value)}
              disabled={isRunning}
              className="text-center"
            />
          </div>

          <div className="text-center space-y-4">
            <div className="text-6xl md:text-8xl font-mono font-bold tracking-wider">
              {formatTime(remainingTime)}
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>設定時間 {formatTime(duration)}</span>
                <span>{Math.round(progress)}% 経過</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            {!isRunning ? (
              <Button
                onClick={onStart}
                size="lg"
                disabled={remainingTime === 0}
                className="px-8"
              >
                <Play className="mr-2 h-5 w-5" />
                {isPaused ? '再開' : '開始'}
              </Button>
            ) : (
              <Button
                onClick={onPause}
                variant="outline"
                size="lg"
                className="px-8"
              >
                <Pause className="mr-2 h-5 w-5" />
                一時停止
              </Button>
            )}

            <Button
              onClick={onStop}
              variant="destructive"
              size="lg"
              disabled={!isRunning && !isPaused}
            >
              <Square className="mr-2 h-5 w-5" />
              停止
            </Button>

            <Button onClick={onReset} variant="outline" size="lg">
              <RotateCcw className="mr-2 h-5 w-5" />
              リセット
            </Button>
          </div>

          <div className="flex justify-center gap-3 pt-2 border-t">
            <TimerSettings
              duration={duration}
              onDurationChange={onDurationChange}
              disabled={isRunning}
            />

            <TimerHistory
              history={history}
              onDeleteEntry={onDeleteHistoryEntry}
              onClearHistory={onClearHistory}
            />
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">最近のセッション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {history.slice(0, 3).map((entry) => {
                const efficiency =
                  entry.duration > 0 ? (entry.actualDuration / entry.duration) * 100 : 0;
                return (
                  <div key={entry.id} className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{entry.label}</span>
                      <Badge variant={entry.completed ? 'secondary' : 'outline'} className="text-xs">
                        {entry.completed ? '完了' : '中断'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(entry.actualDuration)} / {formatTime(entry.duration)}
                    </div>
                    <div className="text-xs">
                      効率{' '}
                      <span className={efficiency <= 100 ? 'text-green-600' : 'text-orange-600'}>
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
