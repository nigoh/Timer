import React from "react";
import { Tooltip } from "@radix-ui/themes";
import { GripVertical, Trash2 } from "lucide-react";
import { getWidgetLabel } from "@/features/timer/stores/meeting-layout-store";
import type { WidgetLayoutItem } from "@/types/layout";
import { cn } from "@/lib/utils";

export interface GridWidgetProps {
  widget: WidgetLayoutItem;
  isEditMode: boolean;
  onToggleWidget: (widgetId: string) => void;
  children: React.ReactNode;
}

export const GridWidget: React.FC<GridWidgetProps> = ({
  widget,
  isEditMode,
  onToggleWidget,
  children,
}) => {
  return (
    <div
      className={cn(
        "h-full flex flex-col overflow-hidden rounded-md border bg-background",
        isEditMode && "ring-2 ring-primary/30",
      )}
    >
      {isEditMode && (
        <div className="widget-drag-handle flex shrink-0 items-center gap-1 border-b bg-muted/40 px-1.5 py-0.5 cursor-grab active:cursor-grabbing select-none touch-none">
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate text-[11px] text-muted-foreground">
            {getWidgetLabel(widget.type)}
          </span>
          <Tooltip content="ウィジェットを非表示" side="top">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onToggleWidget(widget.id)}
              className="ml-auto shrink-0 rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="ウィジェットを非表示"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
};
