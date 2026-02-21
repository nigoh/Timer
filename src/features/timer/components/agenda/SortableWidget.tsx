import React from "react";
import { Tooltip } from "@radix-ui/themes";
import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { getWidgetLabel } from "@/features/timer/stores/meeting-layout-store";
import type { WidgetHeight, WidgetLayoutItem, WidgetWidth } from "@/types/layout";
import { cn } from "@/lib/utils";

export interface SortableWidgetProps {
  widget: WidgetLayoutItem;
  isEditMode: boolean;
  onSetWidth: (widgetId: string, width: WidgetWidth) => void;
  onSetHeight: (widgetId: string, height: WidgetHeight) => void;
  onToggleWidget: (widgetId: string) => void;
  children: React.ReactNode;
}

export const SortableWidget: React.FC<SortableWidgetProps> = ({
  widget,
  isEditMode,
  onSetWidth,
  onSetHeight,
  onToggleWidget,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        transition: isDragging ? undefined : transition,
      }}
      {...(isEditMode ? attributes : {})}
      className={cn(
        widget.width === "S" && "col-span-3",
        widget.width === "M" && "col-span-4",
        widget.width === "L" && "col-span-6",
        widget.width === "XL" && "col-span-12",
        widget.height === "S" && "h-[220px]",
        widget.height === "M" && "h-[320px]",
        widget.height === "L" && "h-[420px]",
        widget.height === "XL" && "h-[560px]",
        "flex min-h-0 flex-col gap-2 relative overflow-hidden rounded-md border",
        isDragging && "opacity-30",
      )}
    >
      {isEditMode && (
        <div
          {...listeners}
          className="flex items-center gap-1 rounded-sm border bg-muted/40 px-1.5 py-0.5 cursor-grab active:cursor-grabbing select-none touch-none overflow-hidden"
        >
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate text-[11px] text-muted-foreground">
            {getWidgetLabel(widget.type)}
          </span>

          <div className="ml-1 flex shrink-0 items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground">幅</span>
            <div className="flex overflow-hidden rounded border">
              {(["S", "M", "L", "XL"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onSetWidth(widget.id, v)}
                  className={cn(
                    "border-r px-1 py-0 text-[10px] leading-5 last:border-r-0",
                    widget.width === v
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground">高</span>
            <div className="flex overflow-hidden rounded border">
              {(["S", "M", "L", "XL"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onSetHeight(widget.id, v)}
                  className={cn(
                    "border-r px-1 py-0 text-[10px] leading-5 last:border-r-0",
                    widget.height === v
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <Tooltip content="ウィジェットを削除" side="top">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onToggleWidget(widget.id)}
              className="ml-auto shrink-0 rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="ウィジェットを削除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
      )}

      <div
        className={cn(
          "min-h-0 flex-1",
          isEditMode && "pointer-events-none select-none",
        )}
      >
        {children}
      </div>
    </div>
  );
};
