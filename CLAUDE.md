# CLAUDE.md — Focuso 開発ガイド（Claude Code 向け）

## プロジェクト概要

**Focuso** は React 18 / TypeScript 5 / Vite 6 / Zustand 4 / Radix UI / Tailwind CSS / shadcn/ui
で構築した業務効率化タイマーアプリ。
画面はタブ構成（タイマー / 会議 / 会議レポート / 分析 / 設定）。

## コマンド早見表

```bash
npm run dev          # 開発サーバー起動（port 3000）
npm run type-check   # TypeScript 型チェック（必須）
npm run test:run     # テスト一発実行（機能変更時）
npm run test         # テスト ウォッチモード
npm run lint         # ESLint
npm run lint:fix     # ESLint 自動修正
npm run build        # 本番ビルド（tsc + Vite）
npm run build:pages  # GitHub Pages 用ビルド
```

## アーキテクチャ

```
src/
├── App.tsx                          # エントリ（タブルーティング）
├── components/                      # 共通 UI（shadcn/Radix プリミティブ）
├── features/timer/
│   ├── components/                  # 機能 View（agenda/ basic-timer/ pomodoro/ multi-timer/ dashboard/）
│   ├── containers/                  # スマートコンテナ（配線のみ）
│   ├── stores/                      # Zustand ストア（ドメイン状態）
│   ├── services/                    # analytics.ts / meeting-ai-assist-service.ts / voice-recognition-service.ts
│   ├── hooks/                       # useVoiceRecognition.ts
│   ├── utils/                       # 機能ユーティリティ
│   └── api/                         # github-issues.ts
├── types/                           # ドメイン型（正本）
└── utils/                           # logger.ts / notification-manager.ts / color-mode.ts
```

### 層の責務

| 層 | ディレクトリ | 役割 |
|----|-------------|------|
| UI | `components/` `features/*/components/` | 表示ロジック・スタイル |
| 配線 | `features/*/containers/` | データ取得・ストア接続のみ |
| 状態 | `features/timer/stores/` | ドメイン状態（Zustand） |
| サービス | `features/timer/services/` | AI API / 音声認識 / 分析集計 |
| 副作用 | `utils/logger.ts` `utils/notification-manager.ts` | ログ・通知の唯一経路 |
| 型 | `src/types/` | ドメイン型の正本 |

## コーディング規約

### 状態管理

- ドメイン状態 → `src/features/timer/stores/` の Zustand のみ
- `useState` は UI ローカル状態（開閉・タブ・一時入力）のみ
- ストアは `State` / `Actions` を interface で明示して公開 API を固定化
- `set` は最小差分更新を優先

### コンポーネント責務

- `containers/` は配線専用、表示ロジックは `components/*View.tsx` に置く
- コンポーネントから `localStorage` / 通知 API を直接叩かない
- ファイルが肥大化したら `components/{feature}/` に分割する

### 通知・ログ

- 通知は必ず `src/utils/notification-manager.ts` 経由
- ログは必ず `src/utils/logger.ts` 経由
- 新機能追加時は「開始 / 完了 / 失敗」のログポイントを定義する

### 型・命名

- ドメイン型は `src/types/` を正本とし、同等型を再定義しない
- import は `@/` エイリアスを優先
- `any` 禁止 → union / type guard を使う

## 禁止事項

- cc-sdd スペック（`.kiro/specs/<feature>/` の requirements.md + design.md + tasks.md）なしに新機能の実装を開始すること
- 同一責務のストア重複作成（例: 同タイマー種別の別名 store）
- UI から直接の副作用呼び出し（通知 / 永続化 / ログ）
- 未使用 import / 未使用 state の残置
- 仕様変更を伴うのに docs 未更新のまま完了扱い
- `src/stores/` の互換レイヤー参照（`src/features/timer/stores/` を使う）
- API キーの永続化（`integration-link-store.aiProviderConfig` はメモリ保持のみ）

## 品質ゲート（変更後に必ず実行）

1. `npm run type-check` — 常に必須
2. `npm run test:run` — 機能変更時
3. `npm run build` — リリース前・大規模変更時

## 主要ファイル早見表

| タスク | ファイル |
|--------|---------|
| 会議・アジェンダ状態 | `src/features/timer/stores/agenda-timer-store.ts` |
| 基本タイマー状態 | `src/features/timer/stores/basic-timer-store.ts` |
| ポモドーロ状態 | `src/features/timer/stores/pomodoro-store.ts` |
| 複数タイマー状態 | `src/features/timer/stores/multi-timer-store.ts` |
| UI設定・サイドバー | `src/features/timer/stores/ui-preferences-store.ts` |
| 会議レポート | `src/features/timer/stores/meeting-report-store.ts` |
| GitHub連携・AI API設定 | `src/features/timer/stores/integration-link-store.ts` |
| AI アシスト（LangChain） | `src/features/timer/services/meeting-ai-assist-service.ts` |
| GitHub API | `src/features/timer/api/github-issues.ts` |
| 通知 | `src/utils/notification-manager.ts` |
| ログ | `src/utils/logger.ts` |
| 分析集計 | `src/features/timer/services/analytics.ts` |
| 音声認識 | `src/features/timer/services/voice-recognition-service.ts` |
| UI プリミティブ | `src/components/ui/` |
| ドメイン型 | `src/types/` |
| タブルーティング | `src/App.tsx` |

## ドキュメント更新義務

仕様・挙動・要件の変更があれば、コードと同一変更で更新する。

| 変更の種類 | 更新対象ドキュメント |
|-----------|-------------------|
| 要件変更 | `docs/REQUIREMENTS.md` |
| アーキテクチャ変更 | `docs/TECHNICAL_SPECS.md` |
| 機能追加・削除 | `docs/FEATURES.md` |
| UX・画面仕様変更 | `docs/UX_DESIGN_SPEC.md` |

仕様影響なしの場合はその根拠を PR 本文に明記する。

## 新機能追加時の実装順序

> ⚠️ 実装開始前に必ず cc-sdd スペック（requirements.md + design.md + tasks.md）を `.kiro/specs/<feature>/` に作成し、人間レビューを完了すること。

0. **cc-sdd フロー実行（必須）**:
   - `/kiro-spec-init "<feature-description>"`
   - `/kiro-spec-requirements <feature>` → 人間レビュー
   - `/kiro-spec-design <feature>` → 人間レビュー
   - `/kiro-spec-tasks <feature>` → 人間レビュー
1. `src/types/` にドメイン型を定義
2. `src/features/timer/stores/` にストア（State + Actions interface）を作成
3. `src/features/timer/components/{feature}/` に View コンポーネントを実装
4. `src/features/timer/containers/` にコンテナ（配線）を作成
5. 必要なら `src/features/timer/services/` にサービスを追加
6. `npm run type-check` → `npm run test:run` → `npm run build` で確認
7. 仕様変更があれば docs を更新

## AI API 連携時の注意

- LangChain 経由（`@langchain/openai` / `@langchain/anthropic`）を使う
- `meeting-ai-assist-service.ts` の既存インターフェースを再利用する
- API 未設定・失敗時はルールベース処理へフォールバックさせる
- API キーはメモリ保持のみ（永続化禁止）

## 参照ドキュメント

- `docs/REQUIREMENTS.md` — 要件
- `docs/FEATURES.md` — 機能一覧
- `docs/TECHNICAL_SPECS.md` — 技術仕様
- `docs/UX_DESIGN_SPEC.md` — UX 仕様
- `docs/AI_COLLABORATION_GUIDE.md` — AI 協業運用・Skills 使い分け
- `AGENTS.md` — ワークフロー・PR プロセス
- `.github/copilot-instructions.md` — コーディング規約正本
