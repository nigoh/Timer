import React, { useCallback, useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Moon, Plus, Settings, Sun } from "lucide-react";
import {
  useTaskStore,
  selectSortedTasks,
} from "@/features/timer/stores/task-store";
import { LucideDynamicIcon } from "./LucideDynamicIcon";

interface CommandPaletteProps {
  colorMode: "light" | "dark";
  onToggleColorMode: () => void;
  onCreateTask: () => void;
  onOpenSettings: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  colorMode,
  onToggleColorMode,
  onCreateTask,
  onOpenSettings,
}) => {
  const [open, setOpen] = useState(false);
  const tasks = useTaskStore(selectSortedTasks);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const runAndClose = useCallback((action: () => void) => {
    action();
    setOpen(false);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="タスクやコマンドを検索…" />
      <CommandList>
        <CommandEmpty>結果が見つかりません</CommandEmpty>

        {tasks.length > 0 && (
          <CommandGroup heading="タスク">
            {tasks.map((task) => (
              <CommandItem
                key={task.id}
                value={task.name}
                onSelect={() => runAndClose(() => setActiveTask(task.id))}
              >
                <LucideDynamicIcon name={task.icon} className="h-4 w-4" />
                <span>{task.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="アクション">
          <CommandItem onSelect={() => runAndClose(onCreateTask)}>
            <Plus className="h-4 w-4" />
            <span>新しいタスクを作成</span>
          </CommandItem>
          <CommandItem onSelect={() => runAndClose(onOpenSettings)}>
            <Settings className="h-4 w-4" />
            <span>設定を開く</span>
          </CommandItem>
          <CommandItem onSelect={() => runAndClose(onToggleColorMode)}>
            {colorMode === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span>
              {colorMode === "dark"
                ? "ライトモードに切り替え"
                : "ダークモードに切り替え"}
            </span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
