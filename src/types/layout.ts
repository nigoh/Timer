export type WidgetType =
  | "meeting-shortcut"
  | "timer"
  | "agenda"
  | "minutes"
  | "transcript"
  | "time-allocation"
  | "report-history";

/** 列数: S=3列(25%) / M=4列(33%) / L=6列(50%) / XL=12列(100%) */
export type WidgetWidth = "S" | "M" | "L" | "XL";

/** 高さ: S=220px / M=320px / L=420px / XL=560px */
export type WidgetHeight = "S" | "M" | "L" | "XL";

export interface WidgetLayoutItem {
  id: string;
  type: WidgetType;
  visible: boolean;
  order: number;
  width: WidgetWidth;
  height: WidgetHeight;
}

export interface LayoutPreset {
  id: string;
  name: string;
  layout: WidgetLayoutItem[];
  version: number;
  createdAt: number;
  updatedAt: number;
}
