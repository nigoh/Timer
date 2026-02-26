import React, { useState, useCallback } from "react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import type { LucideIconName } from "@/types/task";
import { useTaskStore } from "@/features/timer/stores/task-store";

// よく使うアイコン（全量だと重いため厳選）
const ICON_LIST: LucideIconName[] = [
  "Timer",
  "Clock",
  "BookOpen",
  "Code",
  "Briefcase",
  "Coffee",
  "Dumbbell",
  "Flame",
  "GraduationCap",
  "HeartPulse",
  "Lightbulb",
  "ListTodo",
  "Mail",
  "Mic",
  "Music",
  "Pencil",
  "Phone",
  "Presentation",
  "Rocket",
  "Search",
  "Settings",
  "ShoppingCart",
  "Star",
  "Target",
  "Users",
  "Video",
  "Wrench",
  "Zap",
  "FileText",
  "Folder",
  "Globe",
  "Home",
  "Laptop",
  "MessageSquare",
  "Monitor",
  "Palette",
  "PiggyBank",
  "Shield",
  "Smile",
  "Trophy",
];

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskCreateDialog: React.FC<TaskCreateDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const createTask = useTaskStore((s) => s.createTask);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<LucideIconName>("Timer");

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    createTask(name.trim(), icon);
    setName("");
    setIcon("Timer");
    onOpenChange(false);
  }, [name, icon, createTask, onOpenChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && name.trim()) {
        e.preventDefault();
        handleCreate();
      }
    },
    [handleCreate, name],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>新しいタスクを作成</DialogTitle>
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
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-name-input">タスク名</Label>
            <Input
              id="task-name-input"
              placeholder="例: ポモドーロ集中"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              maxLength={60}
            />
          </div>

          <div className="space-y-1.5">
            <Label>アイコン</Label>
            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto rounded-md border p-2">
              {ICON_LIST.map((iconName) => {
                const IconComp = (
                  LucideIcons as unknown as Record<
                    string,
                    React.ComponentType<{ className?: string }> | undefined
                  >
                )[iconName];
                if (!IconComp) return null;
                const isSelected = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`flex items-center justify-center rounded-sm p-1.5 transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    }`}
                    aria-label={iconName}
                    title={iconName}
                  >
                    <IconComp className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim()}
            >
              作成
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
