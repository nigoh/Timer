export type WidgetType =
  | "meeting-shortcut"
  | "timer"
  | "agenda"
  | "minutes"
  | "transcript"
  | "time-allocation"
  | "report-history";

/** react-grid-layout ベースの自由配置レイアウトアイテム */
export interface WidgetLayoutItem {
  id: string;
  type: WidgetType;
  visible: boolean;
  /** グリッド列 (0 origin, max 12) */
  x: number;
  /** グリッド行 (0 origin) */
  y: number;
  /** 列幅 (1–12) */
  w: number;
  /** 行数 (1–) */
  h: number;
  minW?: number;
  minH?: number;
}

/** localStorage マイグレーション用の旧形式 */
export type WidgetWidth = "S" | "M" | "L" | "XL";
export type WidgetHeight = "S" | "M" | "L" | "XL";

export interface LayoutPreset {
  id: string;
  name: string;
  layout: WidgetLayoutItem[];
  version: number;
  createdAt: number;
  updatedAt: number;
}
