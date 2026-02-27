import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SimpleTooltipProps {
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * @radix-ui/themes の Tooltip と同じ API で shadcn Tooltip を使う薄いラッパー。
 * `<SimpleTooltip content="..." side="top"><Button>...</Button></SimpleTooltip>`
 */
export function SimpleTooltip({
  content,
  side,
  open,
  onOpenChange,
  children,
}: SimpleTooltipProps) {
  return (
    <Tooltip open={open} onOpenChange={onOpenChange}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  );
}
