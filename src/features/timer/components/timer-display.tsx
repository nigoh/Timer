import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useTimer } from '../hooks/use-timer';
import { Timer } from '../../../types/timer';
import { cn, formatTime } from '../../../lib/utils';

interface TimerDisplayProps {
  timer: Timer;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TimerDisplay({ timer, className, size = 'lg' }: TimerDisplayProps) {
  const { 
    timeRemaining, 
    isRunning, 
    isPaused, 
    start, 
    pause, 
    stop, 
    reset,
    progress 
  } = useTimer(timer);

  const getStatusBadge = () => {
    if (isRunning) return { text: '実行中', color: 'bg-green-100 text-green-800' };
    if (isPaused) return { text: '一時停止', color: 'bg-yellow-100 text-yellow-800' };
    if (timer.status === 'completed') return { text: '完了', color: 'bg-blue-100 text-blue-800' };
    return { text: '待機', color: 'bg-gray-100 text-gray-800' };
  };

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
            className="h-2"
            indicatorClassName={cn(
              isRunning && "bg-primary",
              isPaused && "bg-yellow-500",
              timer.status === 'completed' && "bg-green-500"
            )}
          />
          
          <p className="text-sm text-muted-foreground">
            {Math.round(progress)}% 完了
          </p>
        </div>

        {/* 操作ボタン */}
        <div className="flex justify-center gap-2">
          {!isRunning ? (
            <Button 
              onClick={start} 
              size="lg"
              className="px-8"
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
              className="px-8"
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
          
          <Button 
            onClick={reset} 
            variant="outline" 
            size="lg"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            リセット
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
