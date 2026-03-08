# TECHNICAL_SPECS

## 技術スタック


- React 18
- TypeScript 5
- Vite 6
- Zustand 4
- Tailwind CSS + shadcn/ui (new-york style) + Radix UI
- react-hook-form + @hookform/resolvers + zod（フォームバリデーション）
- Sonner（トースト通知）
- cmdk（コマンドパレット）
- @dnd-kit/sortable + core（ドラッグ並べ替え）
- Tesseract.js 7（ブラウザ内 WASM OCR、Japanese/English 対応）
- **@supabase/supabase-js**（クラウド DB・Auth・Realtime）
- Vitest

## 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `VITE_SUPABASE_URL` | Supabase プロジェクト URL | クラウド同期を使用する場合 |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名キー（公開可） | クラウド同期を使用する場合 |

未設定の場合は Supabase 関連機能（ログイン UI・クラウド同期）が無効化され、ゲストモードのみで動作する。
`.env.example` にプレースホルダーを記載している。Vercel / Netlify では環境変数ダッシュボードから設定する。


## 主要ディレクトリ

- `src/components`: 共通 UI
- `src/lib`: 外部サービスクライアント（`supabase.ts` など）
- `src/features/auth/`: 認証機能（store / service / components / containers）
- `src/features/sync/`: データ同期機能（sync-service / sync-store / realtime-service / migration-service）
- `src/features/timer/components`: 機能別 View
- `src/features/timer/containers`: コンテナ（配線）
- `src/features/timer/stores`: ドメイン状態（Zustand）
  - `task-store.ts`: タスク管理・ウィジェットレイアウト
  - `tick-manager-store.ts`: グローバル tick 管理（1秒周期）
  - `agenda-timer-store.ts` / `new-agenda-timer-store.ts`: アジェンダタイマー
  - `basic-timer-store.ts`: 基本タイマー
  - `dashboard-store.ts`: ダッシュボードフィルタ永続化
  - `integration-link-store.ts`: GitHub 連携リンク・PAT・AI API 設定（メモリ保持）
  - `meeting-report-store.ts`: 会議レポート・投稿履歴
  - `multi-timer-store.ts`: 複数タイマー
  - `pomodoro-store.ts`: ポモドーロ
  - `voice-store.ts`: 音声文字起こし状態（録音中/確定エントリ/言語）
  - `meeting-knowledge-store.ts`: MAPE-K Knowledge — 会議記録・学習パターン永続化
- `src/features/timer/api`: 外部 API クライアント（GitHub 連携）
- `src/features/timer/services`: 外部連携サービス
  - `analytics.ts`: 分析集計ロジック
  - `meeting-ai-assist-service.ts`: AI API 連携（LangChain 経由 / OpenAI・Anthropic）
  - `voice-recognition-service.ts`: Web Speech API ラッパー
  - `meeting-optimization-service.ts`: MAPE-K Analyze + Plan — 超過傾向分析・改善提案生成
  - `ocr-service.ts`: Tesseract.js ラッパー — ブラウザ内 OCR（日本語横書き `jpn` / 縦書き `jpn_vert` / 英語 `eng`）
- `src/features/timer/hooks`: カスタムフック（`useVoiceRecognition.ts`）
- `src/features/timer/utils`: 機能ユーティリティ（Issue別集計・AIアシスト・議題パーサーなど）
- `src/types`: ドメイン型
- `src/utils`: 通知/ログユーティリティ


## 状態管理方針

- ドメイン状態は `src/features/timer/stores` に集約する。
- ストアは State と Actions を interface で公開する。
- ストア参照は `src/features/timer/stores` を正本とし、`src/stores` の互換レイヤーは使用しない。

- UI ローカル状態のみコンポーネントの `useState` を許可する。

## UI コンポーネント方針

- shadcn/ui (new-york スタイル) コンポーネントを `src/components/ui/` に配置し、Radix UI プリミティブはラッパー経由で使用する。
- レイアウトは shadcn Sidebar (`collapsible="icon"`) + SidebarProvider で制御する。サイドバー開閉状態は `ui-preferences-store` で永続化する。
- デスクトップではパンくずナビ（shadcn Breadcrumb）でタスク名/設定画面を表示する。モバイルではヘッダーバーで同等情報を表示。
- ウィジェットグリッド初期レンダリング時は shadcn Skeleton で読み込み中状態を表示する。
- インラインフィードバック（保存完了/コピー完了等）は Sonner Toast に統一する。
- ダイアログ確認は shadcn AlertDialog（`useConfirmDialog` フック）に統一し、`window.confirm` は使用しない。
- フォームバリデーションは react-hook-form + zod + shadcn Form コンポーネントに統一する。
- コマンドパレット (Ctrl+K / Cmd+K) でタスク検索・切り替え・アクション実行が可能。
- CSS カラーはセマンティック変数（`--success`, `--warning`, `--info`, `--link`）を使用し、ハードコードされた色値は禁止する。

## 通知仕様

- `src/utils/notification-manager.ts` を唯一の通知経路とする。

- Web Audio API で合成音を生成し、必要に応じてブラウザ通知を表示する。
- サイレント時は振動 API を優先する。

## ログ仕様


- `src/utils/logger.ts` を唯一のログ経路とする。
- ログは LocalStorage（`focuso-logs`）に保存する。
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

| #   | カード名         | 指標                      | グラフ種別                 |
| --- | ---------------- | ------------------------- | -------------------------- |
| 1   | 集中時間         | 当期間合計（分/時間）     | KPI + 前期比スパークライン |
| 2   | 完了セッション数 | 完了数 / 開始数           | KPI + 前期比スパークライン |
| 3   | ポモドーロ達成率 | 作業フェーズ完了 / 開始 % | KPI + 目標進捗バー         |
| 4   | 会議超過率       | 超過議題数 / 全議題数 %   | KPI + 前期比スパークライン |
| 5   | トレンドチャート | 集中時間の時系列推移      | 折れ線 / 棒グラフ切替      |
| 6   | ヒートマップ     | 曜日 × 時間帯の集中分数   | ヒートマップ               |
| 7   | 内訳ドーナツ     | 種別・カテゴリ比率        | ドーナツチャート           |

### チャートライブラリ

**採用: Recharts v3**（`npm install recharts` 済み）

- npm 週間 DL 約 400 万（React チャートライブラリ最多）、React ネイティブ設計、TypeScript 型定義内蔵。
- Line / Bar / Pie(Donut) を採用。ヒートマップは Recharts 非内蔵のため Tailwind CSS グリッドで自前実装。

### 集計ロジック

**採用: Option A クライアント完結 + Option B 最小抽象化の併用**

- `src/features/timer/services/analytics.ts` に `IAnalyticsService` インターフェースと `LocalAnalyticsService` を実装。
- `TaskWidgetCanvas` で各 Zustand ストアから生データを読み、`useMemo` 内で `localAnalyticsService.compute()` を呼び出す。
- 将来の API 移行時は `LocalAnalyticsService` を差し替えるだけで hook・UI 変更不要。

```
Zustand stores (localStorage persist)
  └─ TaskWidgetCanvas.tsx (useMemo → localAnalyticsService.compute(filter, rawData))
       └─ AnalyticsResult → ダッシュボードウィジェット
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
│   └── components/task-list/TaskWidgetCanvas.tsx    # 分析ウィジェット統合（旧 Dashboard コンテナ）
```

## アクセシビリティ仕様

- フォーム入力は `Label` と `id/htmlFor` を必ず関連付ける。
- 視覚的に不要なラベルは `sr-only` を使って支援技術向けに保持する。

## 永続化・クラウド同期

### ローカル永続化

- 全タイマー系ストアは Zustand `persist` を利用し、localStorage に保存する。
- 永続化対象はストアごとに `partialize` で制御し、ランタイム状態（`isRunning`, `lastTickTime` 等）は除外する。
- ストレージバックエンドは `src/utils/storage-adapter.ts` の `IStorageProvider` で抽象化する。

| ストア | 永続化キー | 主な永続化フィールド |
|--------|-----------|---------------------|
| `task-store` | `task-store` | `tasks`, `activeTaskId`, `presets` |
| `basic-timer-store` | `basic-timer-store` | `duration`, `sessionLabel`, `history` |
| `pomodoro-store` | `pomodoro-store` | `settings`, `todayStats`, `sessions` |
| `agenda-timer-store` | `agenda-timer-store` | `meetings`, `currentMeeting` |
| `multi-timer-store` | `multi-timer-store` | `timers`（実行状態リセット済み）, `categories`, `globalSettings` |
| `meeting-report-store` | `meeting-report-store` | `reports`, `postedCommentHistory` |
| `integration-link-store` | `integration-links` | `linksByLogId`（`githubPat` は除外） |
| `ui-preferences-store` | `ui-preferences` | `sidebarOpen` |
| `meeting-knowledge-store` | `meeting-knowledge-store` | `records`（最大 100 件）, `learnedPatterns`, `settings` |
| `auth-store` | `auth-store` | `user`（表示情報のみ。トークンは除外） |

- 詳細設計: `docs/DESIGN_DATA_PERSISTENCE.md`

### クラウド同期アーキテクチャ（Supabase）

オフラインファースト設計: localStorage を一次ストレージとし、Supabase を非同期二次ストレージとして使用する。
既存 Zustand persist の動作は変更しない。

```
書き込みフロー:
  ユーザー操作 → Zustand setState → Zustand persist → localStorage（即時）
                                                      → syncService.push()（非同期・fire-and-forget）
                                                          → Supabase UPSERT

読み込みフロー（アプリ起動時）:
  1. Zustand が localStorage からハイドレート（即時・既存動作）
  2. 認証済みなら syncService.syncAll() を非同期実行
     → 各ストア: Supabase の updated_at を確認 → クラウドが新しければ localStorage 上書き

Realtime フロー（他タブ・他デバイスからの変更）:
  Supabase DB 更新 → Realtime 通知 → このタブ受信
  → localStorage 上書き（次回レンダリング/リロードで反映）
```

**競合解決**: Last-Write-Wins（`updated_at` タイムスタンプ比較）
**セキュリティ**: Row Level Security（`auth.uid() = user_id`）、認証トークンはメモリのみ
**同期対象**: 上記テーブルの全ストアキー（`auth-store` は除く）
**同期サービス実装**:
- `src/features/sync/sync-service.ts`: push / pull / syncAll
- `src/features/sync/sync-store.ts`: SyncStatus, lastSyncAt, isOnline
- `src/features/sync/realtime-service.ts`: Supabase Realtime 購読・解除
- `src/features/sync/migration-service.ts`: ゲストデータ → クラウド移行

## MAPE-K 会議効率化 アーキテクチャ

MAPE-K 自律コンピューティングループにより、会議データを蓄積・分析し、アジェンダの予定時間改善を自動提案する。

### ループ構成

| コンポーネント | 実装先 | 責務 |
|---------------|--------|------|
| Monitor | `meeting-knowledge-store.ts` | 会議完了時の MeetingRecord 自動記録 |
| Analyze | `meeting-optimization-service.ts` | 超過傾向分析、パターンマッチング |
| Plan | `meeting-optimization-service.ts` | 改善提案生成（duration-adjustment 等） |
| Execute | `SuggestionBadge` / `SuggestionDialog` | ユーザー承認→予定時間更新 |
| Knowledge | `meeting-knowledge-store.ts` | 会議記録・学習パターン・設定の永続化 |

### 設計原則

- ローカル計算のみ（外部 API 不要）
- 提案は必ずユーザー承認（自動適用禁止）
- 最低 3 件のデータ蓄積後に分析開始
- 詳細仕様: `.kiro/specs/mape-k-meeting-optimization/`

## アジェンダ向け GitHub Issue 入力仕様（初期実装）

- 入力: `owner/repo` + `issueNumber` を受け取り、既存の GitHub API クライアントを再利用して Issue データを取得する。
- 変換: Issue タイトルを会議名候補へ、Issue 本文（チェックリスト・見出し・箇条書き）をアジェンダ候補へ正規化する。
- 適用: 生成結果は即時保存せず UI ローカル状態でレビューし、ユーザー確定時に `agenda-timer-store` の会議/議題作成 API を呼び出す。
- 失敗時: API エラーや本文解析失敗時は、既存の手動会議作成と手動議題追加フローへフォールバックする。

### 推奨 Issue 入力フォーマット

```md
# 会議名（Issue title）

## Agenda（または 議題）
- [ ] 議題A
- [ ] 議題B

## Notes
- 共有メモ
```

- 解析優先順位:
  1. `## Agenda` / `## 議題` 配下のチェックリスト・箇条書き
  2. 本文全体のチェックリスト
  3. 本文全体の箇条書き・番号付きリスト
- 予定時間抽出:
  - `Duration: 10m` / `所要: 10分` を検出した場合のみ候補値として反映する。
  - 未指定時は既存のデフォルト予定時間を適用する。
- 会議作成UIでは抽出したアジェンダ候補をチェック選択して取り込み対象を確定する。
- 推奨テンプレート:
  - `docs/templates/GITHUB_MEETING_INPUT_ISSUE_TEMPLATE.md` を正本とする。

## 会議レポートの GitHub Issue コメント投稿仕様（初期実装）

- 実現可否: 可能（GitHub REST API `POST /repos/{owner}/{repo}/issues/{issue_number}/comments` を利用）。
- 認証:
  - Public リポジトリ: Classic PAT の `public_repo` もしくは Fine-grained token の Issues: Read and write で投稿可能。
  - Private リポジトリ: Classic PAT の `repo` もしくは Fine-grained token の Issues: Read and write が必要。
- 投稿フロー:
  1. 会議と Issue リンクが存在することを検証
  2. ユーザーが投稿ボタンを明示的に実行
  3. Markdown 形式で議事録をコメント投稿
  4. 成功/失敗を通知とログで記録
- 投稿モード:
  - 全文投稿: 会議レポート Markdown 全体を投稿
  - 差分投稿: 前回レポートとの差分行のみ投稿（差分が空の場合は投稿スキップ）
- 投稿テンプレート:
  - 詳細: 会議レポート Markdown 全体
  - 要約: サマリー/決定事項/次回アクション/ToDo を再構成した短縮テンプレート
- ToDo 自動反映:
  - Issue チェックリストから ToDo 候補を抽出し、`@mention` / `担当:` を owner、`期限:` / `due:` を dueDate にマッピングする。
- 投稿履歴:
  - 投稿成功時に `commentUrl` と `postedAt` を meeting-report-store の履歴へ保存し、レポート履歴画面から参照可能にする。
- セキュリティ:
  - PAT は `integration-link-store` のメモリ内のみに保持し、永続化しない。

## 会議 AI アシスト仕様（初期実装）

- `src/features/timer/utils/meeting-ai-assist.ts` で会議レポート草稿から支援文（要約/合意形成/進行/アジェンダ/事前準備）を生成する。
- 会議レポート確認ダイアログで提案を表示し、ユーザー明示操作で下書きへ反映する（既存入力がある項目は上書きしない）。
- AIアシストは参加者の意思決定を補助する位置づけであり、自動確定や自動投稿は行わない。

## 会議 AI API 連携仕様（実装済み）

- 依存: LangChain（`@langchain/core` / `@langchain/openai` / `@langchain/anthropic`）を採用し、プロバイダ固有差分を service 層で吸収する。
- 実装: `src/features/timer/services/meeting-ai-assist-service.ts`
  - `generateMeetingAiAssist()`: 会議レポート草稿から議事録要約/合意形成/進行/アジェンダ/事前準備の支援文を生成
  - `summarizeVoiceTranscript()`: 音声文字起こしエントリから議事録サマリーを生成
- ユーティリティ: `src/features/timer/utils/meeting-ai-assist.ts`（ルールベースフォールバック）
- 設定項目（`integration-link-store.aiProviderConfig`、メモリ保持・非永続）:
  - `provider`: `openai | anthropic`
  - `model`: モデル識別子
  - `apiKey`: メモリ保持（永続化しない）
  - `temperature`: 0〜2
- 失敗時挙動:
  - API未設定・接続失敗時は `meeting-ai-assist.ts` のルールベース生成へフォールバックする。

## パフォーマンス仕様

- tick 系処理は `isRunning/isAnyRunning` を先に判定し、不要な更新は早期 return する。
- 秒未満の経過では state を更新せず、無駄な再レンダーを抑制する。

## 画像 OCR テキスト入力仕様

- ライブラリ: `tesseract.js@7.0.0`（Apache-2.0、ブラウザ内 WebAssembly）
- 実装: `src/features/timer/services/ocr-service.ts`
  - `recognize(image, options)`: File/Blob から OCR 実行、進捗コールバック付き
  - 内部で `createWorker(language)` を呼び出し、認識後に `worker.terminate()` する
- ドメイン型: `src/types/ocr.ts`（`OcrLanguage`, `OcrOptions`, `OcrResult`, `OcrImportMode`）
- UI コンポーネント: `src/features/timer/components/agenda/OcrImportDialog.tsx`
  - 画像入力: ファイル選択 / ドラッグ&ドロップ / カメラ撮影（`capture="environment"`）
  - 認識言語: `jpn`（横書き）/ `jpn_vert`（縦書き）/ `eng`
  - 進捗バー表示、認識結果の確認・編集 → 確定取り込み（自動反映なし）
- 統合先:
  - `MeetingDialog.tsx`: 「画像から読み込む」ボタン → `agendaDraft` テキストエリアに追記
  - `MinutesEditor.tsx`: カメラアイコン → Quill カーソル位置に挿入（改行重複防止あり）
- 制約:
  - 画像はサーバーに送信されずブラウザ内のみで処理（プライバシー確保）
  - ファイルサイズ上限 20 MB
  - 初回実行時に言語データ（`jpn`: 約 8 MB）を CDN からダウンロード（以降はキャッシュ）
  - ホワイトボード手書きの精度は印刷テキストより低い（手書き向けは NDL OCR-Lite 推奨）
- 将来拡張: NDL OCR-Lite サーバー連携 / Google Cloud Vision API 統合パスは `docs/DESIGN_OCR_IMAGE_INPUT.md` 参照
