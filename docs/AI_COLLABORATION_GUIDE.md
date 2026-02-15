# AI_COLLABORATION_GUIDE

## 目的

GitHub Copilot / AI エージェントが、Timer App で一貫した安全な変更を行うための運用ルールを定義する。

## 概念モデル

- UI層: `src/components` と `src/features/timer/components`
- 配線層: `src/features/timer/containers`
- 状態層: `src/features/timer/stores`
- ドメイン型: `src/types`
- 副作用層: `src/utils/logger.ts`, `src/utils/notification-manager.ts`

## 変更ルール

1. 仕様を変える変更では、コードと同時に `docs/REQUIREMENTS.md` を更新する。
2. ドメイン状態は必ず Zustand ストアに集約し、UI へ散在させない。
3. 通知・ログは必ず既存ユーティリティ経由にする。
4. 既存機能と同名責務の重複ストア/重複コンポーネントを作らない。
5. 未使用 import / 未使用 state / 未参照ファイルを残さない。

## AI 向け実装手順（推奨）

1. 影響範囲を特定（コンテナ・View・ストア・型）。
2. ストア API を設計（State/Actions interface）。
3. UI は既存 `ui/*` コンポーネントを優先利用。
4. 追加した副作用ポイントにログを埋める。
5. `type-check` と必要最小限のテストで検証。

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
