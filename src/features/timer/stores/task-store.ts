import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Task, TaskState, TaskActions, LucideIconName } from '@/types/task';
import type { LayoutPreset } from '@/types/layout';
import { generateId } from '@/utils/id';
import { logger } from '@/utils/logger';

type TaskStore = TaskState & TaskActions;

const STORE_VERSION = 1;

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      activeTaskId: null,
      isEditMode: false,
      presets: [],
      showSettings: false,

      // --- タスク CRUD ---

      createTask: (name: string, icon: LucideIconName): string => {
        const id = generateId();
        const now = Date.now();
        const maxOrder = get().tasks.reduce((max, t) => Math.max(max, t.order), -1);

        const task: Task = {
          id,
          name: name.trim(),
          icon,
          widgets: [],
          order: maxOrder + 1,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          tasks: [...state.tasks, task],
          activeTaskId: state.activeTaskId ?? id,
        }));

        logger.info(`タスク作成: ${task.name}`, { taskId: id }, 'task');
        return id;
      },

      deleteTask: (taskId: string) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        const remaining = state.tasks.filter((t) => t.id !== taskId);
        const nextActiveId =
          state.activeTaskId === taskId
            ? remaining[0]?.id ?? null
            : state.activeTaskId;

        set({
          tasks: remaining,
          activeTaskId: nextActiveId,
        });

        logger.info(`タスク削除: ${task.name}`, { taskId }, 'task');
      },

      updateTask: (taskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, ...updates, updatedAt: Date.now() }
              : t,
          ),
        }));
      },

      setActiveTask: (taskId) => {
        set({ activeTaskId: taskId, showSettings: false });
      },

      reorderTasks: (orderedIds) => {
        set((state) => ({
          tasks: state.tasks
            .map((t) => ({
              ...t,
              order: orderedIds.indexOf(t.id),
            }))
            .sort((a, b) => a.order - b.order),
        }));
      },

      // --- ウィジェット管理 ---

      addWidget: (taskId, widget) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, widgets: [...t.widgets, widget], updatedAt: Date.now() }
              : t,
          ),
        }));
      },

      removeWidget: (taskId, widgetId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  widgets: t.widgets.filter((w) => w.id !== widgetId),
                  updatedAt: Date.now(),
                }
              : t,
          ),
        }));
      },

      toggleWidget: (taskId, widgetId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  widgets: t.widgets.map((w) =>
                    w.id === widgetId ? { ...w, visible: !w.visible } : w,
                  ),
                  updatedAt: Date.now(),
                }
              : t,
          ),
        }));
      },

      showWidget: (taskId, widgetId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  widgets: t.widgets.map((w) =>
                    w.id === widgetId ? { ...w, visible: true } : w,
                  ),
                  updatedAt: Date.now(),
                }
              : t,
          ),
        }));
      },

      updateWidgetLayout: (taskId, items) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  widgets: t.widgets.map((w) => {
                    const update = items.find((lu) => lu.i === w.id);
                    if (!update) return w;
                    return { ...w, x: update.x, y: update.y, w: update.w, h: update.h };
                  }),
                  updatedAt: Date.now(),
                }
              : t,
          ),
        }));
      },

      // --- 編集モード ---

      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
      setEditMode: (value) => set({ isEditMode: value }),

      // --- プリセット ---

      savePreset: (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        const state = get();
        const activeTask = state.tasks.find((t) => t.id === state.activeTaskId);
        if (!activeTask) return;

        const now = Date.now();
        const preset: LayoutPreset = {
          id: generateId(),
          name: trimmedName,
          layout: activeTask.widgets.map((w) => ({ ...w })),
          version: STORE_VERSION,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          presets: [preset, ...state.presets],
        }));

        logger.info('task', `プリセット保存: ${trimmedName}`);
      },

      applyPreset: (taskId, presetId) => {
        const preset = get().presets.find((p) => p.id === presetId);
        if (!preset) return;

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  widgets: preset.layout.map((w) => ({ ...w })),
                  updatedAt: Date.now(),
                }
              : t,
          ),
        }));
      },

      deletePreset: (presetId) => {
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== presetId),
        }));
      },

      // --- 設定画面 ---

      setShowSettings: (value) => set({ showSettings: value }),
    }),
    {
      name: 'task-store',
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        activeTaskId: state.activeTaskId,
        presets: state.presets,
      }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<TaskState> | undefined;
        return {
          ...current,
          tasks: stored?.tasks ?? [],
          activeTaskId: stored?.activeTaskId ?? null,
          presets: stored?.presets ?? [],
        };
      },
    },
  ),
);

/** アクティブタスクを取得するセレクター */
export const selectActiveTask = (state: TaskStore): Task | undefined =>
  state.tasks.find((t) => t.id === state.activeTaskId);

/** ソート済みタスクを取得するセレクター */
export const selectSortedTasks = (state: TaskStore): Task[] =>
  [...state.tasks].sort((a, b) => a.order - b.order);
