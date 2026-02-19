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

### チャートライブラリ選定案

以下の 3 候補を比較する。**意思決定は @nigoh に委ねる。**

#### 候補 A: Recharts ✅（推奨）

- npm 週間 DL: **約 400 万**（2024 年時点、React チャートライブラリ最多）
- React ネイティブ設計（コンポーネントベース、宣言的 API）
- TypeScript 型定義が公式バンドル
- Line / Bar / Area / RadialBar / Pie(Donut) をカバー
- **ヒートマップ非内蔵**（別途 `@uiw/react-heat-map` 等が必要）

```bash
npm install recharts
```

#### 候補 B: Chart.js + react-chartjs-2

- npm 週間 DL: Chart.js **約 500 万** / react-chartjs-2 **約 170 万**
- 歴史的シェアが高く事例豊富
- 設定がオブジェクトベースで React との相性がやや低い
- TypeScript 型は `@types/chart.js` で対応
- **ヒートマップ非内蔵**（プラグイン追加が必要）

```bash
npm install chart.js react-chartjs-2
```

#### 候補 C: Nivo

- npm 週間 DL: **約 60 万**
- **ヒートマップコンポーネント内蔵** (`@nivo/heatmap`)
- D3 ベース、アニメーション・SVG 品質が高い
- バンドルサイズが大きい（コンポーネント分割インポートで軽減可）
- TypeScript 型定義が公式バンドル

```bash
npm install @nivo/core @nivo/line @nivo/bar @nivo/pie @nivo/heatmap
```

#### 比較表

| 項目 | Recharts | Chart.js + react-chartjs-2 | Nivo |
|------|----------|---------------------------|------|
| 週間 DL | ◎ 最多 | ◎ 高い | △ 少ない |
| React 親和性 | ◎ | △ | ◎ |
| TypeScript | ◎ | ○ | ◎ |
| ヒートマップ | △（追加ライブラリ） | △（プラグイン） | ◎（内蔵） |
| バンドルサイズ | ○ 軽量 | ○ | △ 大きめ |
| 実績・事例 | ◎ | ◎ | ○ |

### 集計ロジック設計案

**意思決定は @nigoh に委ねる。**

#### Option A: クライアントサイド完結（現時点の推奨）

各 Zustand ストアのログ/履歴データをセレクタ関数で集計し、
`useMemo` でメモ化した派生値をコンポーネントへ渡す。

```
Zustand stores (localStorage persist)
  └─ aggregateByDay() / aggregateByWeek() / aggregateByMonth()
       └─ useMemo → DashboardStore (derived selectors)
            └─ ChartComponents
```

- **利点**: バックエンド不要、オフライン対応、実装がシンプル
- **欠点**: データ量増加時（数千セッション以上）に UI スレッドが重くなる可能性
- **対策**: 集計は `Web Worker` 化のオプションを残す設計にする

#### Option B: 抽象化レイヤー（将来の API 移行を見据えた設計）

集計ロジックをサービス層 (`src/features/timer/services/analytics.ts`) に切り出し、
現状はクライアント処理・将来は REST API/BFF に差し替えられる構造にする。

```
DashboardContainer
  └─ useAnalytics(filter) hook
       └─ AnalyticsService.fetch(filter)
            ├─ [現状] LocalAggregator (Zustand → 集計)
            └─ [将来] API Client (GET /api/analytics)
```

- **利点**: API 移行時に hook・UI の変更不要
- **欠点**: 抽象化コストが生じ、初期実装が増える

#### 推奨方針

1. **初期実装は Option A**（クライアント完結）で素早くリリース。
2. `AnalyticsService` インターフェースのみ Option B の形で定義し、実体はクライアント実装にする（最小の抽象化）。
3. データ量やパフォーマンス計測後に Web Worker 化 / API 移行を判断する。

## アクセシビリティ仕様

- フォーム入力は `Label` と `id/htmlFor` を必ず関連付ける。
- 視覚的に不要なラベルは `sr-only` を使って支援技術向けに保持する。

## 永続化

- 一部ストアは Zustand `persist` を利用し、LocalStorage に保存する。
- 永続化対象はストアごとに `partialize` で制御する。

## パフォーマンス仕様

- tick 系処理は `isRunning/isAnyRunning` を先に判定し、不要な更新は早期 return する。
- 秒未満の経過では state を更新せず、無駄な再レンダーを抑制する。
