import type { WidgetLayoutItem, WidgetType } from '@/types/layout';

/** ウィジェットカテゴリ */
export type WidgetCategory = 'timer' | 'meeting' | 'analytics';

/** ウィジェットメタデータ */
export interface WidgetMeta {
  type: WidgetType;
  label: string;
  category: WidgetCategory;
  defaultW: number;
  defaultH: number;
  minW: number;
  minH: number;
}

/** 全ウィジェットのメタデータカタログ */
export const WIDGET_CATALOG: WidgetMeta[] = [
  // --- タイマー系 ---
  {
    type: 'timer-unified',
    label: 'タイマー',
    category: 'timer',
    defaultW: 12,
    defaultH: 13,
    minW: 4,
    minH: 6,
  },

  // --- 会議系 ---
  {
    type: 'meeting-shortcut',
    label: '会議管理ショートカット',
    category: 'meeting',
    defaultW: 3,
    defaultH: 5,
    minW: 2,
    minH: 3,
  },
  {
    type: 'timer',
    label: '会議タイマー',
    category: 'meeting',
    defaultW: 4,
    defaultH: 7,
    minW: 2,
    minH: 4,
  },
  {
    type: 'agenda',
    label: 'アジェンダ一覧',
    category: 'meeting',
    defaultW: 5,
    defaultH: 7,
    minW: 2,
    minH: 4,
  },
  {
    type: 'minutes',
    label: '議事録',
    category: 'meeting',
    defaultW: 6,
    defaultH: 10,
    minW: 3,
    minH: 5,
  },
  {
    type: 'transcript',
    label: '文字起こし',
    category: 'meeting',
    defaultW: 6,
    defaultH: 10,
    minW: 3,
    minH: 5,
  },
  {
    type: 'time-allocation',
    label: '会議時間配分',
    category: 'meeting',
    defaultW: 4,
    defaultH: 7,
    minW: 2,
    minH: 4,
  },
  {
    type: 'report-history',
    label: '会議レポート履歴',
    category: 'meeting',
    defaultW: 4,
    defaultH: 7,
    minW: 2,
    minH: 4,
  },

  // --- 分析系 ---
  {
    type: 'analytics-filter',
    label: '分析フィルター',
    category: 'analytics',
    defaultW: 12,
    defaultH: 3,
    minW: 6,
    minH: 2,
  },
  {
    type: 'kpi-focus-time',
    label: '集中時間',
    category: 'analytics',
    defaultW: 3,
    defaultH: 4,
    minW: 2,
    minH: 3,
  },
  {
    type: 'kpi-sessions',
    label: 'セッション数',
    category: 'analytics',
    defaultW: 3,
    defaultH: 4,
    minW: 2,
    minH: 3,
  },
  {
    type: 'kpi-pomodoro',
    label: 'ポモドーロ達成率',
    category: 'analytics',
    defaultW: 3,
    defaultH: 4,
    minW: 2,
    minH: 3,
  },
  {
    type: 'kpi-meeting-overtime',
    label: '会議超過率',
    category: 'analytics',
    defaultW: 3,
    defaultH: 4,
    minW: 2,
    minH: 3,
  },
  {
    type: 'trend-chart',
    label: 'トレンドグラフ',
    category: 'analytics',
    defaultW: 12,
    defaultH: 8,
    minW: 4,
    minH: 5,
  },
  {
    type: 'heatmap-chart',
    label: 'ヒートマップ',
    category: 'analytics',
    defaultW: 6,
    defaultH: 8,
    minW: 4,
    minH: 5,
  },
  {
    type: 'donut-chart',
    label: 'タイマー種別',
    category: 'analytics',
    defaultW: 6,
    defaultH: 8,
    minW: 3,
    minH: 5,
  },
];

/** WidgetType からラベルを取得 */
export const getWidgetLabel = (type: WidgetType): string => {
  const meta = WIDGET_CATALOG.find((w) => w.type === type);
  return meta?.label ?? 'ウィジェット';
};

/** WidgetType からメタデータを取得 */
export const getWidgetMeta = (type: WidgetType): WidgetMeta | undefined =>
  WIDGET_CATALOG.find((w) => w.type === type);

/** カテゴリ別のウィジェットメタデータを返す */
export const getWidgetsByCategory = (): Record<WidgetCategory, WidgetMeta[]> => ({
  timer: WIDGET_CATALOG.filter((w) => w.category === 'timer'),
  meeting: WIDGET_CATALOG.filter((w) => w.category === 'meeting'),
  analytics: WIDGET_CATALOG.filter((w) => w.category === 'analytics'),
});

/** カテゴリラベル */
export const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  timer: 'タイマー',
  meeting: '会議',
  analytics: '分析',
};

/** WidgetType から新しい WidgetLayoutItem を生成（キャンバスに追加用） */
export const createWidgetLayoutItem = (
  type: WidgetType,
  existingWidgets: WidgetLayoutItem[],
): WidgetLayoutItem => {
  const meta = getWidgetMeta(type);
  const w = meta?.defaultW ?? 4;
  const h = meta?.defaultH ?? 7;

  // 既存ウィジェットの最下部の y + h を求めて、その下に配置
  const maxBottom = existingWidgets.reduce(
    (max, widget) => (widget.visible ? Math.max(max, widget.y + widget.h) : max),
    0,
  );

  return {
    id: `${type}-${Date.now().toString(36)}`,
    type,
    visible: true,
    x: 0,
    y: maxBottom,
    w,
    h,
    minW: meta?.minW,
    minH: meta?.minH,
  };
};
