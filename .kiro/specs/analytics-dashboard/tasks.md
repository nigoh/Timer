# タスク計画: 分析ダッシュボード

## フェーズ概要

既存実装との差分（ギャップ）を埋めるタスク群。
要件 1〜4（可視化・ポモドーロ・会議・フィルタリング）は実装済み。
**未実装: 要件 5.2 — Markdown エクスポート**

---

## P0: Markdown エクスポート — サービス層

### タスク 1.1: analytics service に `exportAnalyticsAsMarkdown` 関数を追加する

- [x] `src/features/timer/services/analytics.ts` の末尾に `exportAnalyticsAsMarkdown(result: AnalyticsResult, filter: AnalyticsFilter): string` を実装する
  - ヘッダー: `# 分析レポート` + 期間文字列（`filter.since` / `filter.until` の ISO 日付）
  - **KPI サマリーセクション**: 集中時間 / セッション数 / 完了セッション数 / ポモドーロ達成率 / 会議超過率 を箇条書きで出力
  - **トレンドセクション**: Markdown テーブル（期間 | 集中時間(分) | セッション数 | 完了数）
  - **カテゴリ分布セクション**: `result.donut` を箇条書きで出力
  - 戻り値は `string`（ダウンロード/クリップボードへの書き込みは呼び出し元が行う）
- [x] `IAnalyticsService` インターフェースには追加しない（スタンドアロン関数として export する）

---

## P1: Markdown エクスポート — フック層

### タスク 2.1: `useAnalytics` フックに `handleExportMarkdown` を追加する

- [x] `src/features/timer/components/task-list/TaskWidgetCanvas.tsx` 内の `useAnalytics()` フックに `handleExportMarkdown` コールバックを追加する
  - `handleExportCsv` のパターン（`useCallback` + Blob + `<a>` クリック + `URL.revokeObjectURL`）を踏襲する
  - 呼び出し: `exportAnalyticsAsMarkdown(result, filter)`
  - ファイル名: `analytics_{since}_{until}.md`（ISO 日付、CSV と同形式）
  - `useCallback` の依存配列: `[filter, result]`
- [x] `useAnalytics` の return オブジェクトに `handleExportMarkdown` を追加する

---

## P2: Markdown エクスポート — UI層

### タスク 3.1: フィルタウィジェットに Markdown エクスポートボタンを追加する

- [x] `src/features/timer/components/task-list/TaskWidgetCanvas.tsx` の `renderAnalyticsFilter()` 内に Markdown エクスポートボタンを追加する
  - CSV ボタンの隣（右側）に並べる
  - ラベル: `MD` または `Markdown`
  - `onClick`: `analytics.handleExportMarkdown`
  - スタイル: CSV ボタンと同一の `variant` / `size` を使用する

---

## P3: テストと品質ゲート

### タスク 4.1: analytics service の Markdown エクスポートをユニットテストする

- [x] `src/features/timer/services/__tests__/analytics.test.ts`（既存）に `exportAnalyticsAsMarkdown` のテストを追加する
  - 基本出力: `# 分析レポート` ヘッダーを含む
  - KPI セクション: `result.kpi.focusMinutes` の値が出力に含まれる
  - トレンドテーブル: Markdown テーブルの区切り文字 `|` が含まれる
  - 空データ: `trend: []` のときでもクラッシュしない

### タスク 4.2: 品質ゲートを実行する

- [x] `npm run type-check` が通過すること
- [x] `npm run test:run` が全件通過すること（363/363）
- [x] `npm run build` が成功すること
