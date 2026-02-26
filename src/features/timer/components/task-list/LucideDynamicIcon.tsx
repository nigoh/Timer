import React from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LucideIconName } from "@/types/task";

const iconMap = LucideIcons as unknown as Record<
  string,
  LucideIcon | undefined
>;

/** Lucide アイコン名から React コンポーネントを返す */
export const LucideDynamicIcon: React.FC<{
  name: LucideIconName;
  className?: string;
}> = ({ name, className = "h-4 w-4" }) => {
  const Icon = iconMap[name];
  if (!Icon) {
    return <LucideIcons.SquareAsterisk className={className} />;
  }
  return <Icon className={className} />;
};
