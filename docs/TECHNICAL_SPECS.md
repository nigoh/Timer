# TECHNICAL_SPECS

## 技術スタック


- React 18
- TypeScript 5
- Vite 5
- Zustand 4
- Tailwind CSS + shadcn/ui + Radix UI
- Vitest


## 主要ディレクトリ

- `src/components`: 共通 UI
- `src/features/timer/components`: 機能別 View
- `src/features/timer/containers`: コンテナ（配線）
- `src/features/timer/stores`: ドメイン状態（Zustand）
- `src/features/timer/api`: 外部 API クライアント（GitHub 連携）
- `src/features/timer/utils`: 機能ユーティリティ（Issue別集計ロジックなど）
- `src/types`: ドメイン型
- `src/utils`: 通知/ログユーティリティ


## 状態管理方針

- ドメイン状態は `src/features/timer/stores` に集約する。
- ストアは State と Actions を interface で公開する。
- ストア参照は `src/features/timer/stores` を正本とし、`src/stores` の互換レイヤーは使用しない。

- UI ローカル状態のみコンポーネントの `useState` を許可する。

## 通知仕様

- `src/utils/notification-manager.ts` を唯一の通知経路とする。

- Web Audio API で合成音を生成し、必要に応じてブラウザ通知を表示する。
- サイレント時は振動 API を優先する。

## ログ仕様


- `src/utils/logger.ts` を唯一のログ経路とする。
- ログは LocalStorage（`timer-app-logs`）に保存する。
- グローバルエラーと Promise rejection を捕捉する。
- ログの追加データは `unknown` として扱い、利用側で型を絞り込む。

## 分析ダッシュボード仕様

- データソースは各タイマー系 Zustand ストアの実行履歴を集約して生成する。
- 集計粒度は日次/週次/月次をサポートする。
- 主指標は「集中時間」「完了セッション数」「ポモドーロ達成率」「会議超過率」とする。
- フィルタ条件（期間、タイマー種別、カテゴリ、会議ID）を永続化する。
- エクスポートは CSV/Markdown を提供し、会議レポートと同形式で再利用できる。

### UI レイアウト設計案

画面を 4 ゾーンで構成する（全幅コンテナ、Tailwind Grid/Flex で実装）。

```
┌─────────────────────────────────────────────────────────────┐
│  フィルタバー（期間セレクタ / 種別 / カテゴリ / 会議）           │
├───────────┬───────────┬───────────┬───────────────────────────┤
│ 集中時間   │ セッション数 │ ポモドーロ  │ 会議超過率                  │
│ KPI カード │ KPI カード  │ 達成率      │ KPI カード                  │
├───────────┴───────────┴───────────┴───────────────────────────┤
│  トレンドチャート（折れ線 or 棒グラフ）                            │
│  集中時間推移 × 日次/週次/月次 切替タブ                            │
├─────────────────────────┬─────────────────────────────────────┤
│  ヒートマップ              │  内訳ドーナツチャート                  │
│  時間帯 × 曜日の生産性      │  タイマー種別・カテゴリ比率            │
└─────────────────────────┴─────────────────────────────────────┘
```

#### カード定義

| # | カード名 | 指標 | グラフ種別 |
|---|---------|------|-----------|
| 1 | 集中時間 | 当期間合計（分/時間） | KPI + 前期比スパークライン |
| 2 | 完了セッション数 | 完了数 / 開始数 | KPI + 前期比スパークライン |
| 3 | ポモドーロ達成率 | 作業フェーズ完了 / 開始 % | KPI + 目標進捗バー |
| 4 | 会議超過率 | 超過議題数 / 全議題数 % | KPI + 前期比スパークライン |
| 5 | トレンドチャート | 集中時間の時系列推移 | 折れ線 / 棒グラフ切替 |
| 6 | ヒートマップ | 曜日 × 時間帯の集中分数 | ヒートマップ |
| 7 | 内訳ドーナツ | 種別・カテゴリ比率 | ドーナツチャート |

### チャートライブラリ

**採用: Recharts v3**（`npm install recharts` 済み）

- npm 週間 DL 約 400 万（React チャートライブラリ最多）、React ネイティブ設計、TypeScript 型定義内蔵。
- Line / Bar / Pie(Donut) を採用。ヒートマップは Recharts 非内蔵のため Tailwind CSS グリッドで自前実装。

### 集計ロジック

**採用: Option A クライアント完結 + Option B 最小抽象化の併用**

- `src/features/timer/services/analytics.ts` に `IAnalyticsService` インターフェースと `LocalAnalyticsService` を実装。
- `Dashboard` コンテナで各 Zustand ストアから生データを読み、`useMemo` 内で `localAnalyticsService.compute()` を呼び出す。
- 将来の API 移行時は `LocalAnalyticsService` を差し替えるだけで hook・UI 変更不要。

```
Zustand stores (localStorage persist)
  └─ Dashboard.tsx (useMemo → localAnalyticsService.compute(filter, rawData))
       └─ AnalyticsResult → DashboardView
            ├─ KpiCard ×4
            ├─ TrendChart (Recharts BarChart / LineChart)
            ├─ HeatmapChart (Tailwind CSS grid)
            └─ DonutChart (Recharts PieChart)
```

### 実装ファイル構成

```
src/
├── types/analytics.ts                              # AnalyticsFilter / Result 型
├── features/timer/
│   ├── services/analytics.ts                       # IAnalyticsService / LocalAnalyticsService
│   ├── stores/dashboard-store.ts                   # フィルタ永続化 (Zustand persist)
│   ├── components/dashboard/
│   │   ├── DashboardView.tsx                       # レイアウト・フィルタバー
│   │   ├── KpiCard.tsx
│   │   ├── TrendChart.tsx
│   │   ├── HeatmapChart.tsx
│   │   └── DonutChart.tsx
│   └── containers/Dashboard.tsx                    # 配線（データ取得 + useMemo）
```

## アクセシビリティ仕様

- フォーム入力は `Label` と `id/htmlFor` を必ず関連付ける。
- 視覚的に不要なラベルは `sr-only` を使って支援技術向けに保持する。

## 永続化

- 一部ストアは Zustand `persist` を利用し、LocalStorage に保存する。
- 永続化対象はストアごとに `partialize` で制御する。
- `integration-link-store` は `linksByLogId` のみ永続化し、`githubPat` はメモリ保持（非永続）とする。

## パフォーマンス仕様

- tick 系処理は `isRunning/isAnyRunning` を先に判定し、不要な更新は早期 return する。
- 秒未満の経過では state を更新せず、無駄な再レンダーを抑制する。
