# AI_COLLABORATION_GUIDE

## 目的

GitHub Copilot / AI エージェントが、Focuso で一貫した安全な変更を行うための運用ルールを定義する。

## 概念モデル

- UI層: `src/components` と `src/features/timer/components`
- 配線層: `src/features/timer/containers`
- 状態層: `src/features/timer/stores`
- ドメイン型: `src/types`
- サービス層: `src/features/timer/services`（AI API / 音声認識 / 分析集計）
- フック層: `src/features/timer/hooks`（`useVoiceRecognition` など）
- 副作用層: `src/utils/logger.ts`, `src/utils/notification-manager.ts`

## 変更ルール

1. 仕様を変える変更では、コードと同時に `docs/REQUIREMENTS.md` を更新する。
2. ドメイン状態は必ず Zustand ストアに集約し、UI へ散在させない。
3. 通知・ログは必ず既存ユーティリティ経由にする。
4. 既存機能と同名責務の重複ストア/重複コンポーネントを作らない。
5. 未使用 import / 未使用 state / 未参照ファイルを残さない。
6. ストア参照は `src/features/timer/stores` を使用し、`src/stores` を参照しない。

## AI 向け実装手順（推奨）

1. 影響範囲を特定（コンテナ・View・ストア・型・サービス・フック）。
2. ストア API を設計（State/Actions interface）。
3. UI は既存 `ui/*` コンポーネントを優先利用。
4. 追加した副作用ポイントにログを埋める。
5. `type-check` と必要最小限のテストで検証。
6. 外部入力（GitHub Issue など）で初期値を生成する場合は、下書きレビュー後の明示確定でのみ store へ保存する。
7. AI API 連携を追加・変更する場合は、`src/features/timer/services/meeting-ai-assist-service.ts` の既存インターフェースを再利用し、API 未設定時は `meeting-ai-assist.ts` のルールベース処理へフォールバックさせる。
8. API キーはメモリ保持を既定とし、`integration-link-store.aiProviderConfig` 経由で管理する（永続化禁止）。

## 禁止事項

- 廃止ファイル（例: `App.full.tsx`）の復活
- `any` の導入で型エラーを黙らせる対処
- UI コンポーネントからの直接永続化・直接通知
- 仕様変更があるのに docs 更新なしで完了扱いにすること

## PR 記載テンプレート（要約）

- 背景
- 変更点
- 影響範囲
- 検証手順
- 未解決事項

## Copilot カスタマイズ設定

### カスタム指示ファイル (`.github/instructions/`)

パス指定でコンテキストが自動付与される。ファイル編集中に Copilot チャットへ自動挿入される。

| ファイル                         | 適用パス                          | 内容                                                 |
| -------------------------------- | --------------------------------- | ---------------------------------------------------- |
| `code-review.instructions.md`    | `**`                              | 型安全性・ストア責務分離のレビュー観点               |
| `commit-message.instructions.md` | `**`                              | プレフィックス・文字数のコミットメッセージ規則       |
| `stores.instructions.md`         | `src/**/stores/**`                | State/Actions interface 必須・set 最小差分・any 禁止 |
| `testing.instructions.md`        | `src/**/__tests__/**`, `*.test.*` | Vitest/happy-dom・vi.fn・AAA パターン                |
| `components.instructions.md`     | `src/**/components/**`            | Container/View 分離・Tailwind・performance hooks     |

### プロンプトファイル (`.github/prompts/`)

Copilot Chat の「📎 → Prompt...」から呼び出せる再利用プロンプト。

| ファイル                | 用途                                                             |
| ----------------------- | ---------------------------------------------------------------- |
| `add-feature.prompt.md` | 新機能追加の型→Store→View→Container→テスト順の実装チェックリスト |
| `fix-bug.prompt.md`     | バグ調査・修正・検証の定型フロー                                 |

### MCP サーバー (`.vscode/mcp.json`)

| サーバー              | 役割                                               |
| --------------------- | -------------------------------------------------- |
| `playwright`          | ブラウザ操作・UI動作目視確認                       |
| `context7`            | Zustand/Radix UI等ライブラリの最新ドキュメント取得 |
| `github`              | Issue/PR操作（`GITHUB_TOKEN` 環境変数必要）        |
| `sequential-thinking` | 複雑な設計・リファクタ時の思考分解                 |
| `filesystem`          | `D:\Timer` 配下のファイル直接操作                  |
| `memory`              | セッションをまたいだメモリ保持                     |

## Agent Skills 運用

- プロジェクトスキルは `/.github/skills/` に配置する。
- 各スキルは `SKILL.md`（YAML frontmatter 必須）を持つ。
- このリポジトリの標準スキル:
  - `timer-bug-triage`: バグ解析と根本修正
  - `timer-spec-sync`: 実装と仕様ドキュメントの同期
  - `radix-ui-layout-design`: Radix UI準拠のUI設計と配置
  - `ui-design-textbook-guideline`: 教科書的なUI設計原則の適用
  - `ux-flow-and-usability`: UXフロー、可用性、マイクロコピー改善
  - `timer-testing-strategy`: 変更内容に応じたテスト戦略
  - `accessibility-audit-radix`: Radix UI画面のアクセシビリティ監査
  - `release-regression-gate`: マージ前の回帰ゲート実行
  - `performance-and-render-budget`: tick/再レンダー最適化
  - `state-migration-and-persistence`: Zustand persist の安全な移行
  - `incident-runbook-observability`: 障害対応ランブックと観測性強化
- スキルの追加時は README の Agent Skills セクションも更新する。

## Skills 使い分け早見表

| 目的                         | 使うSkill                         | 典型的な依頼例                     |
| ---------------------------- | --------------------------------- | ---------------------------------- |
| 実行時エラーの切り分けと修正 | `timer-bug-triage`                | 「このエラーの原因を特定して修正」 |
| 実装変更の仕様同期           | `timer-spec-sync`                 | 「仕様変更に合わせてdocsも更新」   |
| Radix UIで画面を組む         | `radix-ui-layout-design`          | 「Radix準拠でレイアウト改善」      |
| 教科書的原則でUI品質改善     | `ui-design-textbook-guideline`    | 「情報設計を見直して」             |
| ユーザーフローと文言改善     | `ux-flow-and-usability`           | 「操作導線と文言を改善」           |
| 変更に応じたテスト計画       | `timer-testing-strategy`          | 「この変更のテスト戦略を作成」     |
| a11y監査と修正               | `accessibility-audit-radix`       | 「キーボード操作を監査」           |
| マージ前の回帰確認           | `release-regression-gate`         | 「リリース前チェックを実行」       |
| 体感速度/再描画の改善        | `performance-and-render-budget`   | 「tick処理を軽くしたい」           |
| persist互換維持の変更        | `state-migration-and-persistence` | 「保存スキーマを安全に変更」       |
| 障害対応の標準手順           | `incident-runbook-observability`  | 「障害対応をRunbookで進める」      |

## 推奨実行シーケンス

1. まず「課題の種類」を決める（バグ / UIUX / 性能 / 仕様同期 / リリース）。
2. 早見表から主Skillを1つ選ぶ。
3. 必要な場合のみ補助Skillを追加する（例: UI改善 + a11y監査）。
4. 変更後は `timer-testing-strategy` または `release-regression-gate` で検証する。
5. 仕様影響がある変更は `timer-spec-sync` で docs を同期する。

## 代表的な組み合わせ

- UI刷新: `radix-ui-layout-design` + `ux-flow-and-usability` + `accessibility-audit-radix`
- 性能改善: `performance-and-render-budget` + `timer-testing-strategy`
- 障害対応: `incident-runbook-observability` + `timer-bug-triage`
- リリース前最終確認: `release-regression-gate` + `timer-spec-sync`

## 標準運用テンプレート

### 新規機能実装チェックリスト（コピペ用）

```md
## 実装チェックリスト
- [ ] 変更の目的と仕様影響を明確化した
- [ ] 影響範囲（components / containers / stores / types / utils）を整理した
- [ ] ドメイン状態を store に集約した（UIローカル状態の過剰保持なし）
- [ ] 通知/ログを既存 utility 経由で実装した
- [ ] 変更に対応する Skill を選定した
- [ ] `.github/prompts/` の該当プロンプトファイルを参照した（`add-feature` / `fix-bug`）
- [ ] npm run type-check を実行して成功した
- [ ] 必要に応じて npm run test / npm run build を実行した
- [ ] 仕様変更がある場合 docs を同一変更で更新した
- [ ] PR本文に「背景 / 変更点 / 影響範囲 / 検証手順 / 未解決事項」を記載した
```

### 実装開始テンプレート（Issue/PR用）

```md
## 背景

## 目的

## 対象範囲
- 対象ファイル:
- 非対象:

## 採用Skill
- 主Skill:
- 補助Skill:

## 検証計画
- [ ] npm run type-check
- [ ] npm run test（必要時）
- [ ] npm run build（必要時）

## docs更新
- [ ] REQUIREMENTS
- [ ] TECHNICAL_SPECS
- [ ] UX_DESIGN_SPEC
- [ ] 仕様影響なし（理由: ）
```
