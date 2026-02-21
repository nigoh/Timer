import React, { useMemo } from "react";
import { formatDuration } from "@/lib/utils";
import { Meeting } from "@/types/agenda";

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
  const agendaSlices = useMemo(() => {
    return [...meeting.agenda]
      .sort((a, b) => a.order - b.order)
      .map((agenda, index) => ({
        id: agenda.id,
        title: agenda.title,
        plannedDuration: agenda.plannedDuration,
        actualDuration: agenda.actualDuration,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .filter((agenda) => agenda.plannedDuration > 0);
  }, [meeting.agenda]);

  const totalPlanned = useMemo(
    () => agendaSlices.reduce((s, a) => s + a.plannedDuration, 0),
    [agendaSlices],
  );

  const totalActual = useMemo(
    () => meeting.agenda.reduce((s, a) => s + a.actualDuration, 0),
    [meeting.agenda],
  );

  const overrun = totalActual > totalPlanned && totalPlanned > 0;

  if (agendaSlices.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        アジェンダを追加すると時間配分を表示します
      </p>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      {/* サマリー行 */}
      <div className="flex shrink-0 items-center gap-4 text-xs">
        <span className="text-muted-foreground">
          予定{" "}
          <span className="font-mono font-semibold text-foreground">
            {formatDuration(totalPlanned)}
          </span>
        </span>
        <span className="text-muted-foreground">
          実績{" "}
          <span
            className={
              overrun
                ? "font-mono font-semibold text-destructive"
                : "font-mono font-semibold text-foreground"
            }
          >
            {formatDuration(totalActual)}
          </span>
        </span>
      </div>

      {/* 横積みバー（予定配分） */}
      <div className="shrink-0 overflow-hidden rounded-full" style={{ height: 8 }}>
        <div className="flex h-full w-full">
          {agendaSlices.map((agenda) => (
            <div
              key={agenda.id}
              title={`${agenda.title} ${formatDuration(agenda.plannedDuration)}`}
              style={{
                width: `${(agenda.plannedDuration / totalPlanned) * 100}%`,
                backgroundColor: agenda.color,
              }}
            />
          ))}
        </div>
      </div>

      {/* アジェンダ一覧 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-2">
          {agendaSlices.map((agenda) => {
            const plannedPct = (agenda.plannedDuration / totalPlanned) * 100;
            const actualPct =
              agenda.plannedDuration > 0
                ? Math.min(
                    (agenda.actualDuration / agenda.plannedDuration) * 100,
                    100,
                  )
                : 0;
            const isOver =
              agenda.actualDuration > agenda.plannedDuration &&
              agenda.plannedDuration > 0;

            return (
              <div key={agenda.id} className="space-y-1">
                {/* タイトル行 */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: agenda.color }}
                    />
                    <span className="truncate text-foreground">
                      {agenda.title}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 font-mono text-muted-foreground">
                    {agenda.actualDuration > 0 && (
                      <span className={isOver ? "text-destructive" : ""}>
                        {formatDuration(agenda.actualDuration)}
                      </span>
                    )}
                    {agenda.actualDuration > 0 && <span>/</span>}
                    <span>{formatDuration(agenda.plannedDuration)}</span>
                    <span className="text-muted-foreground/60">
                      {Math.round(plannedPct)}%
                    </span>
                  </div>
                </div>

                {/* 進捗バー */}
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${actualPct}%`,
                      backgroundColor: isOver
                        ? "hsl(var(--destructive))"
                        : agenda.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
