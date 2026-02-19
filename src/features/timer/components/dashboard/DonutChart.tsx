import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DonutSegment } from "@/types/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(270, 60%, 55%)",
  "hsl(190, 80%, 45%)",
];

interface DonutChartProps {
  data: DonutSegment[];
}

const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
  const formatMinutes = (
    value: number | string | Array<number | string> | undefined,
  ) => {
    if (Array.isArray(value)) {
      return `${value[0] ?? 0}分`;
    }
    return `${value ?? 0}分`;
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">種別内訳</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex items-center justify-center h-[200px]">
          <p className="text-sm text-muted-foreground">データなし</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">種別内訳</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="80%"
              dataKey="value"
              nameKey="name"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                formatMinutes(value),
                String(name ?? ""),
              ]}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: 11 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DonutChart;
