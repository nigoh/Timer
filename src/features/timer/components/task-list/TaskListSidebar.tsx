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
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  useSidebar,
} from "@/components/ui/sidebar";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
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
  onSelect: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  isActive,
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
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <SidebarMenuItem ref={setNodeRef} style={style}>
      {/* ドラッグハンドル（展開時のみ表示） */}
      {isExpanded && (
        <span
          className="absolute left-0.5 top-1/2 z-10 -translate-y-1/2 cursor-grab text-sidebar-foreground/30 hover:text-sidebar-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="ドラッグで並び替え"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
      )}

      {/* タスクボタン */}
      <SidebarMenuButton
        isActive={isActive}
        tooltip={task.name}
        onClick={() => onSelect(task.id)}
        className={cn(isExpanded && "pl-5")}
        aria-current={isActive ? "page" : undefined}
      >
        <LucideDynamicIcon name={task.icon} className="h-4 w-4 shrink-0" />
        <span>{task.name}</span>
      </SidebarMenuButton>

      {/* 削除ボタン（ホバーで表示） */}
      <SidebarMenuAction
        showOnHover
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="text-sidebar-foreground/40 hover:text-destructive"
        aria-label={`${task.name}を削除`}
      >
        <Trash2 />
      </SidebarMenuAction>
    </SidebarMenuItem>
  );
};

// ── TaskListSidebar ──

interface TaskListSidebarProps {
  onCreateTask: () => void;
  onOpenSettings: () => void;
}

export const TaskListSidebar: React.FC<TaskListSidebarProps> = ({
  onCreateTask,
  onOpenSettings,
}) => {
  const tasks = useTaskStore(selectSortedTasks);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);
  const { confirm, ConfirmDialog } = useConfirmDialog();

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
      confirm(
        {
          title: "タスクを削除",
          description: "このタスクを削除しますか？この操作は取り消せません。",
        },
        () => deleteTask(taskId),
      );
    },
    [deleteTask, confirm],
  );

  return (
    <>
      <SidebarGroup className="flex-1 overflow-y-auto py-1">
        <SidebarMenu>
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
                  onSelect={setActiveTask}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* 新規タスクボタン */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="タスクを追加"
              onClick={onCreateTask}
              className="text-sidebar-foreground/70"
            >
              <Plus className="h-4 w-4" />
              <span>タスクを追加</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {/* 設定ボタン */}
      <SidebarGroup className="mt-auto p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="設定・ログ" onClick={onOpenSettings}>
              <Settings className="h-4 w-4" />
              <span>設定・ログ</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      {ConfirmDialog}
    </>
  );
};
