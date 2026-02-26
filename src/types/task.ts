import type { WidgetLayoutItem, LayoutPreset } from './layout';

/** Lucide アイコン名（例: "Timer", "BookOpen", "Code"） */
export type LucideIconName = string;

/** タスク */
export interface Task {
  id: string;
  name: string;
  icon: LucideIconName;
  widgets: WidgetLayoutItem[];
  order: number;
  createdAt: number;
  updatedAt: number;
}

/** タスクストア State */
export interface TaskState {
  tasks: Task[];
  activeTaskId: string | null;
  isEditMode: boolean;
  presets: LayoutPreset[];
  /** 設定画面の表示状態（タスクではなく固定ボタンから開く） */
  showSettings: boolean;
}

/** タスクストア Actions */
export interface TaskActions {
  // タスク CRUD
  createTask: (name: string, icon: LucideIconName) => string;
  deleteTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Pick<Task, 'name' | 'icon'>>) => void;
  setActiveTask: (taskId: string | null) => void;
  reorderTasks: (orderedIds: string[]) => void;

  // ウィジェット管理
  addWidget: (taskId: string, widget: WidgetLayoutItem) => void;
  removeWidget: (taskId: string, widgetId: string) => void;
  toggleWidget: (taskId: string, widgetId: string) => void;
  showWidget: (taskId: string, widgetId: string) => void;
  updateWidgetLayout: (
    taskId: string,
    items: Array<{ i: string; x: number; y: number; w: number; h: number }>,
  ) => void;

  // 編集モード
  toggleEditMode: () => void;
  setEditMode: (value: boolean) => void;

  // プリセット
  savePreset: (name: string) => void;
  applyPreset: (taskId: string, presetId: string) => void;
  deletePreset: (presetId: string) => void;

  // 設定画面
  setShowSettings: (value: boolean) => void;
}
