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
  /** react-grid-layout の onLayoutChange から受け取った座標を反映する */
  updateLayout: (
    items: Array<{ i: string; x: number; y: number; w: number; h: number }>,
  ) => void;
  resetLayout: () => void;
  saveCurrentLayout: (name: string) => void;
  applyPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
}

export type MeetingLayoutStore = MeetingLayoutState & MeetingLayoutActions;

const DEFAULT_LAYOUT_VERSION = 2;

/**
 * デフォルトレイアウト (12 列グリッド / rowHeight=40 / margin=[8,8])
 *
 * ┌──────────┬────────────────┬────────────────────┐
 * │shortcut  │     timer      │       agenda       │
 * │w=3 h=5   │   w=4 h=7     │     w=5 h=7        │
 * ├──────────┴┬───────────────┴───┬────────────────┤
 * │  minutes  │                   │  transcript    │
 * │  w=6 h=10 │                   │  w=6 h=10      │
 * ├───────────┘                   └────────────────┤
 * │ time-allocation  w=4 h=7                       │
 * └────────────────────────────────────────────────┘
 */
const DEFAULT_LAYOUT: WidgetLayoutItem[] = [
  {
    id: "meeting-shortcut",
    type: "meeting-shortcut",
    visible: true,
    x: 0, y: 0, w: 3, h: 5,
    minW: 2, minH: 3,
  },
  {
    id: "timer",
    type: "timer",
    visible: true,
    x: 3, y: 0, w: 4, h: 7,
    minW: 2, minH: 4,
  },
  {
    id: "agenda",
    type: "agenda",
    visible: true,
    x: 7, y: 0, w: 5, h: 7,
    minW: 2, minH: 4,
  },
  {
    id: "minutes",
    type: "minutes",
    visible: true,
    x: 0, y: 7, w: 6, h: 10,
    minW: 3, minH: 5,
  },
  {
    id: "transcript",
    type: "transcript",
    visible: true,
    x: 6, y: 7, w: 6, h: 10,
    minW: 3, minH: 5,
  },
  {
    id: "time-allocation",
    type: "time-allocation",
    visible: true,
    x: 0, y: 17, w: 4, h: 7,
    minW: 2, minH: 4,
  },
  {
    id: "report-history",
    type: "report-history",
    visible: false,
    x: 4, y: 17, w: 4, h: 7,
    minW: 2, minH: 4,
  },
];

const cloneLayout = (layout: WidgetLayoutItem[]): WidgetLayoutItem[] =>
  layout.map((item) => ({ ...item }));

/** 旧形式 (order/width/height or span/size) → 新形式 (x/y/w/h) へ変換 */
const withCompatibleShape = (
  layout: Array<Record<string, unknown>>,
): WidgetLayoutItem[] => {
  const widthToW: Record<string, number> = { S: 3, M: 4, L: 6, XL: 12 };
  const heightToH: Record<string, number> = { S: 5, M: 7, L: 10, XL: 13 };

  return layout.map((item): WidgetLayoutItem => {
    // 新形式はそのまま通す
    if (typeof item.x === "number" && typeof item.y === "number") {
      return {
        id: item.id as string,
        type: item.type as WidgetType,
        visible: item.visible as boolean,
        x: item.x as number,
        y: item.y as number,
        w: (item.w as number) ?? 4,
        h: (item.h as number) ?? 7,
        minW: (item.minW as number | undefined),
        minH: (item.minH as number | undefined),
      };
    }

    // 旧形式: DEFAULT_LAYOUT の位置をベースに width/height でサイズを上書き
    const defaultItem = DEFAULT_LAYOUT.find((d) => d.id === item.id);
    const legacyWidth =
      (item.width as WidgetWidth | undefined) ??
      ((item.size as string | undefined) ??
        (item.span === 2 ? "L" : "M")) as WidgetWidth;
    const legacyHeight =
      (item.height as WidgetHeight | undefined) ?? legacyWidth;

    const w = widthToW[legacyWidth] ?? defaultItem?.w ?? 4;
    const h = heightToH[legacyHeight] ?? defaultItem?.h ?? 7;
    const order = typeof item.order === "number" ? item.order : 0;
    // 旧 order から縦スタック配置を推定（各アイテムの y を order * 8 で概算）
    const x = defaultItem?.x ?? 0;
    const y = defaultItem?.y ?? order * 8;

    return {
      id: item.id as string,
      type: item.type as WidgetType,
      visible: Boolean(item.visible),
      x,
      y,
      w,
      h,
      minW: defaultItem?.minW,
      minH: defaultItem?.minH,
    };
  });
};

const generatePresetId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

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

      updateLayout: (items) =>
        set((state) => ({
          currentLayout: state.currentLayout.map((item) => {
            const update = items.find((lu) => lu.i === item.id);
            if (!update) return item;
            return { ...item, x: update.x, y: update.y, w: update.w, h: update.h };
          }),
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

        set(() => ({ currentLayout: cloneLayout(preset.layout) }));

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
              persistedState.currentLayout as unknown as Array<Record<string, unknown>>,
            )
          : undefined;

        // プリセットも旧形式が混在する可能性があるため変換する
        const persistedPresets = persistedState.presets?.map(
          (preset) => ({
            ...preset,
            layout: withCompatibleShape(
              preset.layout as unknown as Array<Record<string, unknown>>,
            ),
          }),
        );

        return {
          ...current,
          ...persistedState,
          currentLayout: persistedLayout ?? current.currentLayout,
          presets: persistedPresets ?? current.presets,
        };
      },
    },
  ),
);
