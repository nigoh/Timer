import React, { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendPoint } from "@/types/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TrendChartProps {
  data: TrendPoint[];
}

const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<"line" | "bar">("bar");

  const formatMinutes = (
    value: number | string | Array<number | string> | undefined,
  ) => {
    if (Array.isArray(value)) {
      return `${value[0] ?? 0}分`;
    }
    return `${value ?? 0}分`;
  };

  const tickFormatter = (label: string) => {
    // shorten long labels for readability
    if (label.length > 8) return label.slice(5);
    return label;
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">集中時間の推移</CardTitle>
        <div className="flex gap-1">
          <Button
            variant={chartType === "bar" ? "default" : "outline"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setChartType("bar")}
            aria-pressed={chartType === "bar"}
          >
            棒
          </Button>
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setChartType("line")}
            aria-pressed={chartType === "line"}
          >
            折れ線
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          {chartType === "bar" ? (
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                tickFormatter={tickFormatter}
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value) => [formatMinutes(value), "集中時間"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar
                dataKey="focusMinutes"
                fill="hsl(var(--primary))"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart
              data={data}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                tickFormatter={tickFormatter}
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value) => [formatMinutes(value), "集中時間"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="focusMinutes"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TrendChart;
