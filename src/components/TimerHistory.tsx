import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Calendar,
} from "lucide-react";
import { BasicTimerHistory } from "../types/timer";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { TIMER_STATUS_CONFIG } from "@/constants/timer-theme";
import { GitHubIssueLinking } from "./GitHubIssueLinking";
import { useIntegrationLinkStore } from "@/features/timer/stores/integration-link-store";
import { buildIntegrationIssueStats } from "@/features/timer/utils/integration-stats";

interface TimerHistoryProps {
  history: BasicTimerHistory[];
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
}

const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

interface HistoryEntryProps {
  entry: BasicTimerHistory;
  onDelete: () => void;
}

const HistoryEntry: React.FC<HistoryEntryProps> = ({ entry, onDelete }) => {
  const efficiency =
    entry.duration > 0 ? (entry.actualDuration / entry.duration) * 100 : 0;
  const isOvertime = entry.actualDuration > entry.duration;

  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            {/* ヘッダー */}
            <div className="flex items-center gap-2">
              {entry.completed ? (
                <CheckCircle2
                  className={`w-4 h-4 ${TIMER_STATUS_CONFIG.completed.color}`}
                />
              ) : (
                <XCircle
                  className={`w-4 h-4 ${TIMER_STATUS_CONFIG.paused.color}`}
                />
              )}

              <span className="font-medium text-sm">{entry.label}</span>

              <Badge
                variant={entry.completed ? "secondary" : "outline"}
                className="text-xs"
              >
                {entry.completed ? "完了" : "中断"}
              </Badge>
            </div>

            {/* 時間情報 */}
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
              <div>
                <div className="text-muted-foreground text-xs">予定時間</div>
                <div className="font-mono">{formatTime(entry.duration)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">実際の時間</div>
                <div
                  className={`font-mono ${isOvertime ? TIMER_STATUS_CONFIG.warning.color : TIMER_STATUS_CONFIG.completed.color}`}
                >
                  {formatTime(entry.actualDuration)}
                </div>
              </div>
            </div>

            {/* 効率性 */}
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">効率:</div>
              <Badge
                variant={efficiency <= 100 ? "secondary" : "outline"}
                className="text-xs"
              >
                {Math.round(efficiency)}%
              </Badge>
              {isOvertime && (
                <span
                  className={`text-xs ${TIMER_STATUS_CONFIG.warning.color}`}
                >
                  (+{formatTime(entry.actualDuration - entry.duration)})
                </span>
              )}
            </div>

            {/* 日時 */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(entry.startTime)}</span>
              <span className="mx-1">•</span>
              <span>
                {formatDistanceToNow(entry.startTime, {
                  locale: ja,
                  addSuffix: true,
                })}
              </span>
            </div>

            {/* GitHub Issue 連携 */}
            <GitHubIssueLinking timeLogId={entry.id} />
          </div>

          {/* 削除ボタン */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const TimerHistory: React.FC<TimerHistoryProps> = ({
  history,
  onDeleteEntry,
  onClearHistory,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const linksByLogId = useIntegrationLinkStore((state) => state.linksByLogId);

  // 統計計算
  const totalSessions = history.length;
  const completedSessions = history.filter((h) => h.completed).length;
  const totalTime = history.reduce((sum, h) => sum + h.actualDuration, 0);
  const averageTime = totalSessions > 0 ? totalTime / totalSessions : 0;
  const issueStats = React.useMemo(
    () => buildIntegrationIssueStats(history, linksByLogId),
    [history, linksByLogId],
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="w-4 h-4 mr-2" />
          履歴 ({totalSessions})
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] max-h-[85vh] p-4 sm:max-w-2xl sm:p-6">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              タイマー履歴
            </DialogTitle>

            {totalSessions > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearHistory}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                全削除
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* 統計サマリー */}
          {totalSessions > 0 && (
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 sm:grid-cols-4 sm:gap-4 sm:p-4">
              <div className="text-center">
                <div className="stat-value">{totalSessions}</div>
                <div className="stat-label">セッション</div>
              </div>
              <div className="text-center">
                <div className="stat-value">{completedSessions}</div>
                <div className="stat-label">完了</div>
              </div>
              <div className="text-center">
                <div className="stat-value">{formatTime(totalTime)}</div>
                <div className="stat-label">合計時間</div>
              </div>
              <div className="text-center">
                <div className="stat-value">
                  {formatTime(Math.round(averageTime))}
                </div>
                <div className="stat-label">平均時間</div>
              </div>
            </div>
          )}

          {issueStats.length > 0 && (
            <div className="space-y-2 rounded-lg p-3">
              <h3 className="text-sm font-medium">GitHub Issue 別集計</h3>
              <div className="space-y-2">
                {issueStats.slice(0, 5).map((stat) => (
                  <div
                    key={stat.issueUrl}
                    className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <a
                      href={stat.issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 break-all text-xs text-blue-600 hover:underline"
                    >
                      {stat.issueTitle}
                    </a>
                    <div className="text-xs text-muted-foreground">
                      合計 {formatTime(stat.totalActualDuration)} /{" "}
                      {stat.sessionCount}件
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 履歴リスト */}
          {totalSessions === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">履歴がありません</h3>
              <p className="text-muted-foreground">
                タイマーを実行すると、ここに履歴が表示されます
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {history.map((entry) => (
                  <HistoryEntry
                    key={entry.id}
                    entry={entry}
                    onDelete={() => onDeleteEntry(entry.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
