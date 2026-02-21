import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { logger } from "@/utils/logger";
import type {
  LayoutPreset,
  WidgetHeight,
  WidgetLayoutItem,
  WidgetType,
  WidgetWidth,
} from "@/types/layout";

interface MeetingLayoutState {
  isEditMode: boolean;
  currentLayout: WidgetLayoutItem[];
  presets: LayoutPreset[];
}

interface MeetingLayoutActions {
  toggleEditMode: () => void;
  setEditMode: (value: boolean) => void;
  toggleWidget: (widgetId: string) => void;
  showWidget: (widgetId: string) => void;
  moveWidget: (widgetId: string, direction: "up" | "down") => void;
  moveWidgetTo: (
    widgetId: string,
    targetWidgetId: string,
    position?: "before" | "after",
  ) => void;
  reorderVisibleWidgets: (orderedVisibleWidgetIds: string[]) => void;
  setWidth: (widgetId: string, width: WidgetWidth) => void;
  setHeight: (widgetId: string, height: WidgetHeight) => void;
  resetLayout: () => void;
  saveCurrentLayout: (name: string) => void;
  applyPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
}

export type MeetingLayoutStore = MeetingLayoutState & MeetingLayoutActions;

const DEFAULT_LAYOUT_VERSION = 1;
const DEFAULT_LAYOUT: WidgetLayoutItem[] = [
  {
    id: "meeting-shortcut",
    type: "meeting-shortcut",
    visible: true,
    order: 0,
    width: "S",
    height: "S",
  },
  {
    id: "timer",
    type: "timer",
    visible: true,
    order: 1,
    width: "M",
    height: "M",
  },
  {
    id: "agenda",
    type: "agenda",
    visible: true,
    order: 2,
    width: "M",
    height: "M",
  },
  {
    id: "minutes",
    type: "minutes",
    visible: true,
    order: 3,
    width: "L",
    height: "L",
  },
  {
    id: "transcript",
    type: "transcript",
    visible: true,
    order: 4,
    width: "L",
    height: "L",
  },
  {
    id: "time-allocation",
    type: "time-allocation",
    visible: true,
    order: 5,
    width: "M",
    height: "M",
  },
  {
    id: "report-history",
    type: "report-history",
    visible: false,
    order: 6,
    width: "M",
    height: "M",
  },
];

const cloneLayout = (layout: WidgetLayoutItem[]): WidgetLayoutItem[] =>
  layout.map((item) => ({ ...item }));

/** 旧形式 (size / span) から新形式 (width / height) へ変換 */
const withCompatibleShape = (
  layout: Array<WidgetLayoutItem & { span?: 1 | 2; size?: "S" | "M" | "L" }>,
): WidgetLayoutItem[] =>
  layout.map((item) => {
    const legacySize: WidgetWidth =
      item.size ?? (item.span === 2 ? "L" : "M");
    return {
      ...item,
      width: item.width ?? legacySize,
      height: item.height ?? (legacySize as WidgetHeight),
    };
  });

const normalizeOrder = (layout: WidgetLayoutItem[]): WidgetLayoutItem[] =>
  layout
    .slice()
    .sort((first, second) => first.order - second.order)
    .map((item, index) => ({ ...item, order: index }));

const generatePresetId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

const byOrder = (layout: WidgetLayoutItem[]) =>
  layout.slice().sort((first, second) => first.order - second.order);

export const getWidgetLabel = (type: WidgetType): string => {
  switch (type) {
    case "meeting-shortcut":
      return "会議管理ショートカット";
    case "timer":
      return "タイマー";
    case "agenda":
      return "アジェンダ一覧";
    case "minutes":
      return "議事録";
    case "transcript":
      return "文字起こし";
    case "time-allocation":
      return "会議時間配分";
    case "report-history":
      return "会議レポート履歴";
    default:
      return "ウィジェット";
  }
};

export const useMeetingLayoutStore = create<MeetingLayoutStore>()(
  persist(
    (set, get) => ({
      isEditMode: false,
      currentLayout: cloneLayout(DEFAULT_LAYOUT),
      presets: [],

      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),

      setEditMode: (value) => set(() => ({ isEditMode: value })),

      toggleWidget: (widgetId) =>
        set((state) => ({
          currentLayout: state.currentLayout.map((item) =>
            item.id === widgetId ? { ...item, visible: !item.visible } : item,
          ),
        })),

      showWidget: (widgetId) =>
        set((state) => ({
          currentLayout: state.currentLayout.map((item) =>
            item.id === widgetId ? { ...item, visible: true } : item,
          ),
        })),

      moveWidget: (widgetId, direction) =>
        set((state) => {
          const ordered = byOrder(state.currentLayout);
          const visibleIds = ordered
            .filter((item) => item.visible)
            .map((item) => item.id);

          const visibleIndex = visibleIds.findIndex((id) => id === widgetId);
          if (visibleIndex < 0) return state;

          const offset = direction === "up" ? -1 : 1;
          const targetVisibleIndex = visibleIndex + offset;
          if (targetVisibleIndex < 0 || targetVisibleIndex >= visibleIds.length) {
            return state;
          }

          const sourceId = visibleIds[visibleIndex];
          const targetId = visibleIds[targetVisibleIndex];
          const sourceIndex = ordered.findIndex((item) => item.id === sourceId);
          const targetIndex = ordered.findIndex((item) => item.id === targetId);
          if (sourceIndex < 0 || targetIndex < 0) return state;

          const swapped = ordered.slice();
          const temp = swapped[sourceIndex];
          swapped[sourceIndex] = swapped[targetIndex];
          swapped[targetIndex] = temp;

          return { currentLayout: normalizeOrder(swapped) };
        }),

      moveWidgetTo: (widgetId, targetWidgetId, position = "before") =>
        set((state) => {
          if (widgetId === targetWidgetId) {
            return state;
          }

          const ordered = byOrder(state.currentLayout);
          const sourceIndex = ordered.findIndex((item) => item.id === widgetId);
          const targetIndexBeforeRemoval = ordered.findIndex(
            (item) => item.id === targetWidgetId,
          );

          if (sourceIndex < 0 || targetIndexBeforeRemoval < 0) {
            return state;
          }

          const reordered = ordered.slice();
          const [source] = reordered.splice(sourceIndex, 1);

          const targetIndex = reordered.findIndex(
            (item) => item.id === targetWidgetId,
          );
          if (targetIndex < 0) {
            return state;
          }

          const insertionIndex = position === "before" ? targetIndex : targetIndex + 1;
          reordered.splice(insertionIndex, 0, source);

          return { currentLayout: normalizeOrder(reordered) };
        }),

      reorderVisibleWidgets: (orderedVisibleWidgetIds) =>
        set((state) => {
          const ordered = byOrder(state.currentLayout);
          const visibleMap = new Map(
            ordered
              .filter((item) => item.visible)
              .map((item) => [item.id, item]),
          );

          const reorderedVisible = orderedVisibleWidgetIds
            .map((id) => visibleMap.get(id))
            .filter((item): item is WidgetLayoutItem => Boolean(item));

          const hidden = ordered.filter((item) => !item.visible);
          const combined = [...reorderedVisible, ...hidden];
          return {
            currentLayout: combined.map((item, index) => ({ ...item, order: index })),
          };
        }),

      setWidth: (widgetId, width) =>
        set((state) => ({
          currentLayout: state.currentLayout.map((item) =>
            item.id === widgetId ? { ...item, width } : item,
          ),
        })),

      setHeight: (widgetId, height) =>
        set((state) => ({
          currentLayout: state.currentLayout.map((item) =>
            item.id === widgetId ? { ...item, height } : item,
          ),
        })),

      resetLayout: () => set(() => ({ currentLayout: cloneLayout(DEFAULT_LAYOUT) })),

      saveCurrentLayout: (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        const now = Date.now();
        const currentLayout = cloneLayout(get().currentLayout);

        const preset: LayoutPreset = {
          id: generatePresetId(),
          name: trimmedName,
          layout: currentLayout,
          version: DEFAULT_LAYOUT_VERSION,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({ presets: [preset, ...state.presets] }));

        logger.info(
          "Meeting layout preset saved",
          { presetId: preset.id, name: preset.name },
          "agenda",
        );
      },

      applyPreset: (presetId) => {
        const preset = get().presets.find((item) => item.id === presetId);
        if (!preset) return;

        set(() => ({ currentLayout: normalizeOrder(cloneLayout(preset.layout)) }));

        logger.info(
          "Meeting layout preset applied",
          { presetId: preset.id, name: preset.name },
          "agenda",
        );
      },

      deletePreset: (presetId) => {
        const preset = get().presets.find((item) => item.id === presetId);

        set((state) => ({
          presets: state.presets.filter((item) => item.id !== presetId),
        }));

        logger.info(
          "Meeting layout preset deleted",
          { presetId, name: preset?.name },
          "agenda",
        );
      },
    }),
    {
      name: "meeting-layout-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentLayout: state.currentLayout,
        presets: state.presets,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<MeetingLayoutState>;
        const persistedLayout = persistedState.currentLayout
          ? withCompatibleShape(
              persistedState.currentLayout as Array<
                WidgetLayoutItem & { span?: 1 | 2; size?: "S" | "M" | "L" }
              >,
            )
          : undefined;

        return {
          ...current,
          ...persistedState,
          currentLayout: persistedLayout
            ? normalizeOrder(persistedLayout)
            : current.currentLayout,
        };
      },
    },
  ),
);
