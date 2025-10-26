import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { Play, Pause, Square, RotateCcw, SkipForward, RefreshCw } from 'lucide-react';
import { usePomodoroTimer } from '../hooks/use-pomodoro-timer';
import { PomodoroTimer, PomodoroPhase } from '../../../types/timer';
import { formatTime } from '../../../lib/utils';
import { cn } from '../../../lib/utils';

interface PomodoroDisplayProps {
  timer: PomodoroTimer;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PomodoroDisplay({ timer, className, size = 'lg' }: PomodoroDisplayProps) {
  const { 
    timeRemaining, 
    isRunning, 
    isPaused, 
    start, 
    pause, 
    stop, 
    reset,
    skipPhase,
    resetCycles,
    progress,
    currentPhase,
    currentCycle,
    totalCycles
  } = usePomodoroTimer(timer);

  const getPhaseInfo = (phase: PomodoroPhase) => {
    switch (phase) {
      case 'work':
        return { 
          name: '作業時間', 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          progressColor: 'bg-blue-500'
        };
      case 'short-break':
        return { 
          name: '短い休憩', 
          color: 'bg-green-100 text-green-800 border-green-200',
          progressColor: 'bg-green-500'
        };
      case 'long-break':
        return { 
          name: '長い休憩', 
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          progressColor: 'bg-purple-500'
        };
      default:
        return { 
          name: '作業時間', 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          progressColor: 'bg-gray-500'
        };
    }
  };

  const getStatusBadge = () => {
    if (isRunning) return { text: '実行中', color: 'bg-green-100 text-green-800' };
    if (isPaused) return { text: '一時停止', color: 'bg-yellow-100 text-yellow-800' };
    return { text: '待機', color: 'bg-gray-100 text-gray-800' };
  };

  const phaseInfo = getPhaseInfo(currentPhase);
  const status = getStatusBadge();

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{timer.name}</CardTitle>
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            status.color
          )}>
            {status.text}
          </span>
        </div>
        
        {/* フェーズ情報 */}
        <div className="flex items-center justify-between pt-2">
          <span className={cn(
            "px-3 py-1 rounded-full text-sm font-medium border",
            phaseInfo.color
          )}>
            {phaseInfo.name}
          </span>
          <div className="text-sm text-muted-foreground">
            サイクル {currentCycle} / 完了 {totalCycles}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 時間表示 */}
        <div className="text-center space-y-2">
          <div className={cn(
            "timer-display",
            size === 'lg' && "text-4xl md:text-6xl",
            size === 'md' && "text-2xl md:text-4xl", 
            size === 'sm' && "text-xl md:text-2xl",
            isRunning && "timer-running"
          )}>
            {formatTime(timeRemaining)}
          </div>
          
          {/* 進捗バー */}
          <Progress 
            value={progress} 
            className="h-3"
            indicatorClassName={cn(
              phaseInfo.progressColor,
              isRunning && "transition-all duration-1000"
            )}
          />
          
          <p className="text-sm text-muted-foreground">
            {Math.round(progress)}% 完了
          </p>
        </div>

        {/* 操作ボタン */}
        <div className="flex justify-center gap-2 flex-wrap">
          {/* メイン操作ボタン */}
          <div className="flex gap-2">
            {!isRunning ? (
              <Button 
                onClick={start} 
                size="lg"
                className="px-6"
                disabled={timeRemaining <= 0}
              >
                <Play className="mr-2 h-4 w-4" />
                開始
              </Button>
            ) : (
              <Button 
                onClick={pause} 
                variant="outline" 
                size="lg"
                className="px-6"
              >
                <Pause className="mr-2 h-4 w-4" />
                一時停止
              </Button>
            )}
            
            <Button 
              onClick={stop} 
              variant="destructive" 
              size="lg"
            >
              <Square className="mr-2 h-4 w-4" />
              停止
            </Button>
          </div>

          {/* 追加操作ボタン */}
          <div className="flex gap-2">
            <Button 
              onClick={reset} 
              variant="outline" 
              size="sm"
              title="現在のフェーズをリセット"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={skipPhase} 
              variant="outline" 
              size="sm"
              title="フェーズをスキップ"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={resetCycles} 
              variant="outline" 
              size="sm"
              title="全サイクルをリセット"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* サイクル進捗表示 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>今日の進捗</span>
            <span>{totalCycles} / {timer.pomodoroData.settings.longBreakInterval} ポモドーロ</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: timer.pomodoroData.settings.longBreakInterval }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 h-2 rounded-full",
                  i < totalCycles ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
