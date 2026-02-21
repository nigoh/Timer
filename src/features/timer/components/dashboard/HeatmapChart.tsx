import React, { useMemo } from "react";
import { HeatmapCell } from "@/types/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HeatmapChartProps {
  data: HeatmapCell[];
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function cellColor(minutes: number, maxMinutes: number): string {
  if (minutes === 0 || maxMinutes === 0) return "hsl(var(--muted))";
  const ratio = Math.min(minutes / maxMinutes, 1);
  const lightness = Math.round(65 - ratio * 40); // 65% → 25%
  return `hsl(var(--primary-hsl, 221 83% ${lightness}%))`;
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ data }) => {
  const grid = useMemo(() => {
    const map = new Map<string, number>();
    for (const cell of data) {
      map.set(`${cell.weekday}-${cell.hour}`, cell.minutes);
    }
    return map;
  }, [data]);

  const maxMinutes = useMemo(
    () => Math.max(...data.map((c) => c.minutes), 1),
    [data],
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">時間帯別 生産性</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 overflow-x-auto">
        <div className="min-w-[480px]">
          {/* Hour header */}
          <div className="flex ml-6 mb-0.5">
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex-1 text-center text-xs text-muted-foreground leading-none"
              >
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
          </div>
          {/* Weekday rows */}
          {WEEKDAYS.map((day, wd) => (
            <div key={wd} className="flex items-center mb-0.5">
              <span className="w-6 text-xs text-muted-foreground text-right pr-1 shrink-0">
                {day}
              </span>
              {HOURS.map((h) => {
                const mins = grid.get(`${wd}-${h}`) ?? 0;
                return (
                  <div
                    key={h}
                    className="flex-1 aspect-square rounded-[2px] m-[1px]"
                    style={{ backgroundColor: cellColor(mins, maxMinutes) }}
                    title={mins > 0 ? `${day} ${h}時: ${mins}分` : undefined}
                    aria-label={
                      mins > 0 ? `${day}曜${h}時 ${mins}分` : undefined
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatmapChart;
