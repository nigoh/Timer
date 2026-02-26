import React, { useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@radix-ui/themes";
import { Plus, Trash2, GripVertical, Settings } from "lucide-react";
import type { Task } from "@/types/task";
import {
  useTaskStore,
  selectSortedTasks,
} from "@/features/timer/stores/task-store";
import { LucideDynamicIcon } from "./LucideDynamicIcon";
import { cn } from "@/lib/utils";

// ── Sortable Task Item ──

interface SortableTaskItemProps {
  task: Task;
  isActive: boolean;
  sidebarOpen: boolean;
  onSelect: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  isActive,
  sidebarOpen,
  onSelect,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const btn = (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex w-full items-center gap-1 text-sm transition-colors",
        sidebarOpen ? "px-1" : "justify-center px-0",
        isActive
          ? "bg-accent font-semibold text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
    >
      {isActive && (
        <span className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-primary" />
      )}

      {/* ドラッグハンドル */}
      {sidebarOpen && (
        <span
          className="flex shrink-0 cursor-grab items-center px-0.5 py-2 text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="ドラッグで並び替え"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
      )}

      {/* タスクボタン */}
      <button
        type="button"
        onClick={() => onSelect(task.id)}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 py-2.5",
          !sidebarOpen && "justify-center",
        )}
        aria-label={task.name}
        aria-current={isActive ? "page" : undefined}
      >
        <LucideDynamicIcon name={task.icon} className="h-4.5 w-4.5 shrink-0" />
        {sidebarOpen && <span className="truncate text-left">{task.name}</span>}
      </button>

      {/* 削除ボタン（ホバーで表示） */}
      {sidebarOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="shrink-0 rounded-sm p-1 text-muted-foreground/40 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          aria-label={`${task.name}を削除`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  // サイドバー閉時はTooltip表示
  return sidebarOpen ? (
    btn
  ) : (
    <Tooltip content={task.name} side="right">
      {btn}
    </Tooltip>
  );
};

// ── TaskListSidebar ──

interface TaskListSidebarProps {
  sidebarOpen: boolean;
  onCreateTask: () => void;
  onOpenSettings: () => void;
}

export const TaskListSidebar: React.FC<TaskListSidebarProps> = ({
  sidebarOpen,
  onCreateTask,
  onOpenSettings,
}) => {
  const tasks = useTaskStore(selectSortedTasks);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = taskIds.indexOf(active.id as string);
      const newIndex = taskIds.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(taskIds, oldIndex, newIndex);
      reorderTasks(reordered);
    },
    [taskIds, reorderTasks],
  );

  const handleDelete = useCallback(
    (taskId: string) => {
      if (window.confirm("このタスクを削除しますか？")) {
        deleteTask(taskId);
      }
    },
    [deleteTask],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* タスク一覧 */}
      <nav className="flex-1 overflow-y-auto py-1" aria-label="タスク一覧">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={taskIds}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                isActive={task.id === activeTaskId}
                sidebarOpen={sidebarOpen}
                onSelect={setActiveTask}
                onDelete={handleDelete}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* 新規タスクボタン */}
        <div className={cn("px-2 pt-2", !sidebarOpen && "flex justify-center")}>
          {sidebarOpen ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={onCreateTask}
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">タスクを追加</span>
            </Button>
          ) : (
            <Tooltip content="タスクを追加" side="right">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={onCreateTask}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </Tooltip>
          )}
        </div>
      </nav>

      {/* 設定ボタン */}
      <div
        className={cn(
          "flex shrink-0 flex-col gap-1 border-t border-border p-2",
          sidebarOpen ? "items-stretch" : "items-center",
        )}
      >
        {sidebarOpen ? (
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-3 px-2 shrink-0"
            onClick={onOpenSettings}
            aria-label="設定・ログを開く"
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className="text-sm">設定・ログ</span>
          </Button>
        ) : (
          <Tooltip content="設定・ログ" side="right">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={onOpenSettings}
              aria-label="設定・ログを開く"
            >
              <Settings className="h-4 w-4 shrink-0" />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
