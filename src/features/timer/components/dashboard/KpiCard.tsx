import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  className?: string;
  primary?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, className, primary }) => (
  <Card className={cn("flex-1 min-w-0", primary && "col-span-full sm:col-span-1", className)}>
    <CardContent className={cn("p-4", primary && "p-5")}>
      <p className={cn("stat-label mb-1 truncate", primary && "text-sm")}>{label}</p>
      <p className={cn("stat-value leading-none", primary && "text-3xl")}>{value}</p>
      {sub && <p className="stat-label mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

export default KpiCard;
