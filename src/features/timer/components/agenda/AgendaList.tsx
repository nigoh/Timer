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
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  Circle,
  ChevronRight,
} from "lucide-react";
import { useAgendaTimerStore } from "@/features/timer/stores/agenda-timer-store";
import { cn, formatMinutes } from "@/lib/utils";
import { TIMER_STATUS_CONFIG } from "@/constants/timer-theme";
import { getProgressDisplay } from "./agenda-timer-utils";
import { AgendaItem } from "@/types/agenda";

export interface AgendaListProps {
  className?: string;
  onAddAgenda: () => void;
  onEditAgenda: (agenda: AgendaItem) => void;
}

export const AgendaList: React.FC<AgendaListProps> = ({
  className,
  onAddAgenda,
  onEditAgenda,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const { currentMeeting, deleteAgenda, getCurrentAgenda, selectAgenda } =
    useAgendaTimerStore();

  const currentAgenda = getCurrentAgenda();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isWide = containerWidth > 350;

  if (!currentMeeting) return null;

  return (
    <Card
      ref={containerRef}
      className={cn(
        "grid h-full min-h-0 rounded-none shadow-none border-0 grid-rows-[auto_minmax(0,1fr)]",
        className,
      )}
    >
      <CardHeader className="px-3 py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <Clock className="h-3.5 w-3.5" />
            アジェンダ一覧
            <Badge variant="outline" className="h-5 px-1.5 text-xs">
              {currentMeeting.agenda.length}件
            </Badge>
          </CardTitle>
          <Button
            onClick={() => {
              onAddAgenda();
            }}
            variant="secondary"
            size="sm"
            className="h-7 w-7 p-0"
            aria-label="アジェンダを追加"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 pt-0 min-h-0">
        <div className="space-y-1.5 overflow-auto pr-1 h-full min-h-0">
          {currentMeeting.agenda.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>アジェンダを追加してください</p>
            </div>
          ) : (
            [...currentMeeting.agenda]
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
                      "cursor-pointer px-2 py-2",
                      isActive && TIMER_STATUS_CONFIG.running.surfaceClass,
                      agenda.status === "completed" &&
                        TIMER_STATUS_CONFIG.completed.surfaceClass,
                      agenda.status === "overtime" &&
                        TIMER_STATUS_CONFIG.overtime.surfaceClass,
                    )}
                    onClick={() => selectAgenda(currentMeeting.id, agenda.id)}
                  >
                    <div
                      className={cn(
                        "flex min-w-0 flex-col gap-1.5",
                        isWide && "flex-row items-start justify-between",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          {agenda.status === "completed" ? (
                            <CheckCircle2
                              className={`w-3.5 h-3.5 ${TIMER_STATUS_CONFIG.completed.color}`}
                            />
                          ) : isActive ? (
                            progressDisplay.icon
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <h4
                            className={cn(
                              "min-w-0 flex-1 text-sm font-medium break-words",
                              isWide && "truncate",
                            )}
                          >
                            {agenda.title}
                          </h4>
                          {isActive && (
                            <ChevronRight
                              className={`w-3.5 h-3.5 ${TIMER_STATUS_CONFIG.running.color}`}
                            />
                          )}
                          <Badge
                            variant={
                              agenda.status === "pending"
                                ? TIMER_STATUS_CONFIG.idle.badgeVariant
                                : agenda.status === "running"
                                  ? TIMER_STATUS_CONFIG.running.badgeVariant
                                  : agenda.status === "paused"
                                    ? TIMER_STATUS_CONFIG.paused.badgeVariant
                                    : agenda.status === "completed"
                                      ? TIMER_STATUS_CONFIG.completed
                                          .badgeVariant
                                      : agenda.status === "overtime"
                                        ? TIMER_STATUS_CONFIG.overtime
                                            .badgeVariant
                                        : TIMER_STATUS_CONFIG.idle.badgeVariant
                            }
                            className="text-xs"
                          >
                            {agenda.status === "pending"
                              ? TIMER_STATUS_CONFIG.idle.label
                              : agenda.status === "running"
                                ? TIMER_STATUS_CONFIG.running.label
                                : agenda.status === "paused"
                                  ? TIMER_STATUS_CONFIG.paused.label
                                  : agenda.status === "completed"
                                    ? TIMER_STATUS_CONFIG.completed.label
                                    : agenda.status === "overtime"
                                      ? TIMER_STATUS_CONFIG.overtime.label
                                      : TIMER_STATUS_CONFIG.idle.label}
                          </Badge>
                        </div>

                        {agenda.memo && (
                          <p className="mb-1 text-xs text-muted-foreground line-clamp-2">
                            {agenda.memo}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-1.5 text-xs">
                          <div
                            className={cn(
                              "flex min-w-0 flex-wrap items-center gap-1.5",
                              isWide && "gap-3",
                            )}
                          >
                            <span
                              className={isWide ? "break-normal" : "break-all"}
                            >
                              予定: {formatMinutes(agenda.plannedDuration)}
                            </span>
                            {agenda.actualDuration > 0 && (
                              <span
                                className={cn(
                                  isWide ? "break-normal" : "break-all",
                                  progressDisplay.color,
                                )}
                              >
                                実績: {formatMinutes(agenda.actualDuration)}
                              </span>
                            )}
                          </div>

                          <div className="flex shrink-0 gap-0.5">
                            <Tooltip content="アジェンダを編集" side="top">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onEditAgenda(agenda);
                                }}
                                aria-label="アジェンダを編集"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </Tooltip>
                            <Tooltip content="アジェンダを削除" side="top">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteAgenda(currentMeeting.id, agenda.id);
                                }}
                                aria-label="アジェンダを削除"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </Tooltip>
                          </div>
                        </div>

                        <div className="mt-1">
                          <Progress
                            value={Math.min(progress, 100)}
                            className="h-1.5"
                            indicatorClassName={progressDisplay.bgColor}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
