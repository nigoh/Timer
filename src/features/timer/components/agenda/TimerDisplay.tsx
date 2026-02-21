import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@radix-ui/themes";
import {
  Play,
  Pause,
  Clock,
  Square,
  Timer,
  CircleHelp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAgendaTimerStore } from "@/features/timer/stores/agenda-timer-store";
import { cn, formatDuration } from "@/lib/utils";
import { getProgressDisplay } from "./agenda-timer-utils";

export const TimerDisplay: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const digitFontSize =
    containerWidth > 0
      ? Math.min(Math.max(containerWidth * 0.2, 32), 88)
      : undefined;

  if (!currentMeeting || !currentAgenda) {
    return (
      <Card className="grid h-full min-h-0 rounded-none shadow-none border-0 grid-rows-[auto_minmax(0,1fr)]">
        <CardHeader className="px-3 py-2">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <Timer className="h-3.5 w-3.5" />
            タイマー
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-3 pt-0 text-center">
          <Clock className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            会議にアジェンダを追加してタイマーを開始してください
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      ref={containerRef}
      className={cn(
        "grid h-full min-h-0 rounded-none shadow-none border-0 grid-rows-[auto_minmax(0,1fr)]",
        isRunning && "ring-2 ring-ring",
      )}
    >
      <CardHeader className="px-3 py-2">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <CardTitle className="flex min-w-0 items-center gap-1.5 text-sm">
            {progressDisplay.icon}
            <span className="truncate">{currentAgenda.title}</span>
          </CardTitle>
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge variant="outline" className={cn("text-xs", progressDisplay.color)}>
              {progressDisplay.label}
            </Badge>
            {currentMeeting.settings.silentMode ? (
              <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-col gap-4 overflow-y-auto p-3 pt-0">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <div
              className="timer-display-digit font-mono font-bold"
              style={
                digitFontSize !== undefined
                  ? { fontSize: `${digitFontSize}px` }
                  : undefined
              }
            >
              {formatDuration(currentAgenda.remainingTime)}
            </div>
            <div className="text-sm text-muted-foreground">
              予定時間: {formatDuration(currentAgenda.plannedDuration)}
            </div>
          </div>

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
              <Play className="mr-1.5 h-4 w-4" />
              {isPaused ? "再開" : "開始"}
            </Button>
          ) : (
            <Button onClick={pauseTimer} variant="outline" size="sm">
              <Pause className="mr-1.5 h-4 w-4" />
              一時停止
            </Button>
          )}

          <Button
            onClick={stopTimer}
            variant="destructive"
            size="sm"
            disabled={!canCompleteSession}
          >
            <Square className="w-4 h-4 mr-1.5" />
            セッション完了
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
