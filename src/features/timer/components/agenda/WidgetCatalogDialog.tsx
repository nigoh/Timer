import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LayoutGrid, X } from "lucide-react";
import { getWidgetLabel } from "@/features/timer/stores/meeting-layout-store";
import type { WidgetLayoutItem } from "@/types/layout";

export interface WidgetCatalogDialogProps {
  open: boolean;
  hiddenWidgets: WidgetLayoutItem[];
  onOpenChange: (open: boolean) => void;
  onAddWidget: (widgetId: string) => void;
}

export const WidgetCatalogDialog: React.FC<WidgetCatalogDialogProps> = ({
  open,
  hiddenWidgets,
  onOpenChange,
  onAddWidget,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              ウィジェットを追加
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              aria-label="閉じる"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {hiddenWidgets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            追加できるウィジェットはありません
          </p>
        ) : (
          <div className="space-y-2">
            {hiddenWidgets.map((widget) => (
              <div
                key={widget.id}
                className="flex items-center justify-between rounded-sm border px-2 py-2"
              >
                <p className="text-sm">{getWidgetLabel(widget.type)}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onAddWidget(widget.id)}
                >
                  追加
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
