import React, { useState, useEffect, useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import { Meeting } from "@/types/agenda";
import { cn } from "@/lib/utils";

interface MeetingOverviewChartProps {
  meeting: Meeting;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export const MeetingOverviewChart: React.FC<MeetingOverviewChartProps> = ({
  meeting,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const shortSide = Math.min(containerSize.width, containerSize.height);
  const donutSize = Math.min(Math.max(shortSide * 0.45, 56), 120);
  const isRow =
    containerSize.width > containerSize.height + 20 &&
    containerSize.width > 160;

  const agendaSlices = useMemo(() => {
    return [...meeting.agenda]
      .sort((first, second) => first.order - second.order)
      .map((agenda) => ({
        id: agenda.id,
        title: agenda.title,
        plannedDuration: agenda.plannedDuration,
      }))
      .filter((agenda) => agenda.plannedDuration > 0);
  }, [meeting.agenda]);

  const totalPlannedDuration = useMemo(() => {
    return agendaSlices.reduce(
      (sum, agenda) => sum + agenda.plannedDuration,
      0,
    );
  }, [agendaSlices]);

  const totalActualDuration = useMemo(() => {
    return meeting.agenda.reduce(
      (sum, agenda) => sum + agenda.actualDuration,
      0,
    );
  }, [meeting.agenda]);

  const donutBackground = useMemo(() => {
    if (agendaSlices.length === 0 || totalPlannedDuration <= 0) {
      return "hsl(var(--muted))";
    }

    let cumulativeRatio = 0;
    const stops = agendaSlices.map((agenda, index) => {
      const start = cumulativeRatio * 100;
      cumulativeRatio += agenda.plannedDuration / totalPlannedDuration;
      const end = cumulativeRatio * 100;
      const color = CHART_COLORS[index % CHART_COLORS.length];
      return `${color} ${start}% ${end}%`;
    });

    return `conic-gradient(${stops.join(", ")})`;
  }, [agendaSlices, totalPlannedDuration]);

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 flex-col gap-2 overflow-hidden"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          予定{" "}
          <span className="font-mono font-semibold text-foreground">
            {formatDuration(totalPlannedDuration)}
          </span>
        </span>
        <span className="text-muted-foreground">
          実績{" "}
          <span className="font-mono font-semibold text-foreground">
            {formatDuration(totalActualDuration)}
          </span>
        </span>
        <Badge variant="outline" className="text-xs">
          {agendaSlices.length}件
        </Badge>
      </div>

      {agendaSlices.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          アジェンダを追加すると時間配分を表示します
        </p>
      ) : (
        <div
          className={cn(
            "flex min-h-0 flex-1 gap-3 overflow-hidden",
            isRow ? "flex-row items-center" : "flex-col items-center",
          )}
        >
          <div className="shrink-0">
            <div
              className="rounded-full"
              style={{
                background: donutBackground,
                width: donutSize,
                height: donutSize,
              }}
            >
              <div className="flex h-full w-full items-center justify-center p-[18%]">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-background text-center">
                  <div className="text-[10px] leading-tight text-muted-foreground">
                    全体
                  </div>
                  <div className="font-mono text-[11px] font-semibold leading-tight">
                    {formatDuration(totalPlannedDuration)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <div className="space-y-0.5 text-xs">
              {agendaSlices.map((agenda, index) => {
                const ratio =
                  totalPlannedDuration > 0
                    ? (agenda.plannedDuration / totalPlannedDuration) * 100
                    : 0;
                return (
                  <div
                    key={agenda.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      />
                      <span className="truncate text-muted-foreground">
                        {agenda.title}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-foreground">
                      {Math.round(ratio)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
