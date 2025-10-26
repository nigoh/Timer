# タイマーアプリケーション アーキテクチャガイド

この文書は、アプリケーションの構造を統一し、変更容易性と可読性を高めるための設計方針をまとめたものです。機能の追加・改修を行う際の参照資料として活用してください。

---

## 1. 目的とスコープ

- **目的**: 大型コンポーネントに集中している UI とビジネスロジックを整理し、再利用性とテスト性を向上させる。
- **対象**: `src/` 以下の React コンポーネント、Zustand ストア、サービス層、ユーティリティ、および関連ドキュメント。
- **ゴール**:
  - 機能単位（feature-first）のディレクトリ構成に統一する。
  - 状態管理と副作用の扱いを標準化する。
  - ドメインロジック・永続化・通知など横断的関心事を共通化する。

---

## 2. ディレクトリ構造の指針

```
src/
├── app/                     # アプリ全体の初期化とルーティング
├── features/
│   └── timer/
│       ├── components/      # プレゼンテーション (UI) コンポーネント
│       ├── containers/      # 状態や副作用を扱うコンテナ
│       ├── stores/          # Zustand ストア (slice 単位)
│       ├── services/        # ドメインロジック・永続化・通知
│       └── hooks/           # 再利用可能なカスタムフック
├── components/ui/           # 共通 UI コンポーネント (shadcn/ui ベース)
├── lib/                     # 共通ユーティリティ (フォーマット・バリデーション等)
├── types/                   # 型定義（ドメイン/DTO/API）
└── utils/                   # ログ・音声など非ドメイン共通処理
```

- `components/ui` は純粋な見た目のみ。ロジックは持たない。
- `features/<domain>` に属さない共通ロジックは `lib/` または `utils/` に配置する。
- 将来的な機能追加（例: analytics, settings）は `features/<feature-name>` として追加する。

---

## 3. コンポーネント設計

### 3.1 プレゼンテーション vs コンテナ
- **プレゼンテーション** (`features/.../components`)  
  - props で渡されたデータを表示する純粋な UI。副作用を持たない。
  - Storybook やスナップショットテストの対象とする。
- **コンテナ** (`features/.../containers`)  
  - Zustand ストアとの接続、サービス呼び出し、ライフサイクル副作用を担当。
  - プレゼンテーションへ props でデータ/コールバックを橋渡しする。

### 3.2 コンポーネント分割ガイドライン
- 1 ファイルの責務が 250 行を越える場合は、サブコンポーネントに分ける。
- ユーザ操作（例: タイマー開始）ごとにハンドラー関数を切り出し、`useCallback` かサービス層に委譲する。
- 複雑な計算・整形ロジックは `features/.../services` もしくは `lib/` に移動し、純粋関数化する。

---

## 4. 状態管理（Zustand）の標準

### 4.1 ストア構成
- Feature 毎に slice を作成し、`create()` で生成。  
  例: `features/timer/stores/basicTimerSlice.ts`
- ルートストアが必要な場合は `features/timer/stores/index.ts` で slice を結合する。
- ストアの公開 API は「状態」「アクション」「セレクタ」を明示し、インポート側は `useBasicTimer()` のような hook を通じて利用する。

### 4.2 ベストプラクティス
- **selector ベース取得**: `useBasicTimer(state => state.isRunning)` のように必要な値のみ購読する。
- **非同期処理**: Dexie や API との通信は `services/persistence.ts` などに分離し、アクションから呼び出す。
- **ログ統合**: アクション内で `logger.stateChange` 等を呼び、プレゼンテーション層にログコードを散らさない。
- **テスト**: ストア単体テストではサービスをモック化し、副作用を制御する。

---

## 5. サービス & ユーティリティ層

| 分類 | 役割 | 例 |
|------|------|----|
| `services/timerLogic.ts` | 時間計算、進捗率、セッション履歴整形 | `calculateProgress`, `buildSessionSummary` |
| `services/notifications.ts` | Web Notification とベル音再生の統合 | `notifyTimerComplete`, `requestPermission` |
| `services/persistence.ts` | Dexie を使った CRUD | `loadTimers`, `saveSession` |
| `lib/format.ts` | 共通フォーマット関数 | `formatDuration`, `formatDateTime` |

- サービスは副作用のある処理を担当し、テスト可能な純粋関数と明確に分ける。
- 依存関係は上位（containers → services → lib）。循環参照を避ける。

---

## 6. 横断的関心事

- **ログ**: `utils/logger.ts` をミドルウェア的に利用。コンテナ／サービス層で呼び出し、UI 層には props として渡さない。
- **エラー処理**: `components/ErrorBoundary.tsx` をトップレベルで配置。サービス層は throw に統一し、UI で捕捉する。
- **パフォーマンス監視**: `hooks/useLogging.ts` の `usePerformanceMonitor` 等をコンテナから利用し、重い処理を検知。
- **スタイル**: Tailwind + shadcn/ui を採用。色・余白のカスタマイズは `globals.css` または `components/ui` 側に集中。

---

## 7. ドキュメント & テストポリシー

- `docs/FEATURES.md` と本ドキュメントを連携させ、機能追加時は両方更新する。
- 新しい feature 追加時に「構成」「ストア」「サービス」の責務を README か ADR（Architecture Decision Record）で記録する。
- テストレイヤー:
  - **単体**: サービス / フック / ストアを対象。
  - **結合**: コンテナ + プレゼンテーションの組み合わせを React Testing Library で検証。
  - **E2E**: 重要なタイマーフローを Playwright 等で自動化（長期計画）。

---

## 8. 実行ロードマップ

| フェーズ | 期間目安 | 主なタスク |
|----------|----------|------------|
| **短期 (1–2 スプリント)** | - `features/timer/components` を整備し、既存 UI を移行<br>- Zustand selector フックを導入し、`BasicTimer` 系から適用<br>- 設計ガイドラインを共有し、コードレビュー基準に追加 |
| **中期 (3–5 スプリント)** | - `NewAgendaTimer` / `EnhancedPomodoroTimer` をコンテナ + サービス構成へ分割<br>- Dexie 連携を `services/persistence.ts` に移管し、テストを追加<br>- `features/timer/stores` を slice ベースに整理して API を統一 |
| **長期 (継続)** | - E2E テスト整備と CI への組み込み<br>- `utils/logger.ts` を middleware 化し、監視統合を進める<br>- 半期ごとのアーキテクチャレビューとドキュメント更新 |

---

## 9. 次のステップ

1. 既存コンポーネントの中から対象を選び、コンテナ/プレゼンテーション分割の PoC を実施。
2. Zustand ストアの共通フックを作成し、`BasicTimer` → `EnhancedPomodoroTimer` の順で適用。
3. 本ドキュメントをベースにレビュー基準を整備し、PR テンプレートにチェック項目を追加。

以上を順次実行することで、変更容易性・可読性・テスト性が一貫して向上するアーキテクチャを目指します。

