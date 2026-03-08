import type { WidgetLayoutItem, WidgetType } from '@/types/layout';

/** ウィジェットカテゴリ */
export type WidgetCategory = 'timer' | 'meeting' | 'analytics';

/** ウィジェットメタデータ */
export interface WidgetMeta {
  type: WidgetType;
  label: string;
  description: string;
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
    description: '基本タイマー・ポモドーロ・マルチタイマーを切り替えて使える統合タイマー',
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
    description: '会議の作成・一覧・設定にすばやくアクセス',
    category: 'meeting',
    defaultW: 3,
    defaultH: 5,
    minW: 2,
    minH: 3,
  },
  {
    type: 'timer',
    label: '会議タイマー',
    description: 'アジェンダごとの残り時間を大型表示で管理',
    category: 'meeting',
    defaultW: 4,
    defaultH: 7,
    minW: 2,
    minH: 4,
  },
  {
    type: 'agenda',
    label: 'アジェンダ一覧',
    description: '会議のアジェンダを一覧表示し、進行状況を管理',
    category: 'meeting',
    defaultW: 5,
    defaultH: 7,
    minW: 2,
    minH: 4,
  },
  {
    type: 'minutes',
    label: '議事録',
    description: 'リッチテキストで議事録を記録。OCR・音声入力に対応',
    category: 'meeting',
    defaultW: 6,
    defaultH: 10,
    minW: 3,
    minH: 5,
  },
  {
    type: 'transcript',
    label: '文字起こし',
    description: '音声認識でリアルタイムに文字起こしし、議事録に挿入',
    category: 'meeting',
    defaultW: 6,
    defaultH: 10,
    minW: 3,
    minH: 5,
  },
  {
    type: 'time-allocation',
    label: '会議時間配分',
    description: 'アジェンダごとの予定 vs 実績の時間配分をチャートで可視化',
    category: 'meeting',
    defaultW: 4,
    defaultH: 7,
    minW: 2,
    minH: 4,
  },
  {
    type: 'report-history',
    label: '会議レポート履歴',
    description: '過去の会議レポートを閲覧・コピー・Issue投稿',
    category: 'meeting',
    defaultW: 4,
    defaultH: 7,
    minW: 2,
    minH: 4,
  },
  {
    type: 'ocr',
    label: 'OCR読み込み',
    description: '画像からテキストを読み取り。日本語（横書き/縦書き）・英語対応',
    category: 'meeting',
    defaultW: 6,
    defaultH: 10,
    minW: 3,
    minH: 6,
  },

  // --- 分析系 ---
  {
    type: 'analytics-filter',
    label: '分析フィルター',
    description: '期間・粒度・タイマー種別でデータを絞り込み',
    category: 'analytics',
    defaultW: 12,
    defaultH: 3,
    minW: 6,
    minH: 2,
  },
  {
    type: 'kpi-focus-time',
    label: '集中時間',
    description: '期間内の合計集中時間とセッション数',
    category: 'analytics',
    defaultW: 3,
    defaultH: 4,
    minW: 2,
    minH: 3,
  },
  {
    type: 'kpi-sessions',
    label: 'セッション数',
    description: '完了セッション数と完了率',
    category: 'analytics',
    defaultW: 3,
    defaultH: 4,
    minW: 2,
    minH: 3,
  },
  {
    type: 'kpi-pomodoro',
    label: 'ポモドーロ達成率',
    description: 'ポモドーロサイクルの達成率',
    category: 'analytics',
    defaultW: 3,
    defaultH: 4,
    minW: 2,
    minH: 3,
  },
  {
    type: 'kpi-meeting-overtime',
    label: '会議超過率',
    description: '予定時間を超過した会議の割合',
    category: 'analytics',
    defaultW: 3,
    defaultH: 4,
    minW: 2,
    minH: 3,
  },
  {
    type: 'trend-chart',
    label: 'トレンドグラフ',
    description: '日別・週別・月別の集中時間推移',
    category: 'analytics',
    defaultW: 12,
    defaultH: 8,
    minW: 4,
    minH: 5,
  },
  {
    type: 'heatmap-chart',
    label: 'ヒートマップ',
    description: '曜日×時間帯の集中度を色の濃淡で可視化',
    category: 'analytics',
    defaultW: 6,
    defaultH: 8,
    minW: 4,
    minH: 5,
  },
  {
    type: 'donut-chart',
    label: 'タイマー種別',
    description: 'タイマー種別ごとの利用比率をドーナツチャートで表示',
    category: 'analytics',
    defaultW: 6,
    defaultH: 8,
    minW: 3,
    minH: 5,
  },
];

/** ウィジェットテンプレート */
export type WidgetTemplateId = 'meeting' | 'focus' | 'analytics' | 'custom';

export interface WidgetTemplate {
  id: WidgetTemplateId;
  label: string;
  description: string;
  widgetTypes: WidgetType[];
}

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'meeting',
    label: '会議セット',
    description: 'タイマー・アジェンダ・議事録を含む会議用セット',
    widgetTypes: ['meeting-shortcut', 'timer', 'agenda', 'minutes'],
  },
  {
    id: 'focus',
    label: '集中セット',
    description: '基本タイマー・ポモドーロ・マルチタイマーの統合タイマー',
    widgetTypes: ['timer-unified'],
  },
  {
    id: 'analytics',
    label: '分析セット',
    description: 'フィルター・KPI・トレンドグラフで振り返り',
    widgetTypes: ['analytics-filter', 'kpi-focus-time', 'trend-chart'],
  },
  {
    id: 'custom',
    label: 'カスタム',
    description: '空の状態から自由にウィジェットを追加',
    widgetTypes: [],
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
