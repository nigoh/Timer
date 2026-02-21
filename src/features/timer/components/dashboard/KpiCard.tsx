import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, className }) => (
  <Card className={cn("flex-1 min-w-0", className)}>
    <CardContent className="p-4">
      <p className="stat-label mb-1 truncate">{label}</p>
      <p className="stat-value leading-none">{value}</p>
      {sub && <p className="stat-label mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

export default KpiCard;
