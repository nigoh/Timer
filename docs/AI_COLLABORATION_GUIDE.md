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
- スキルの追加時は README の Agent Skills セクションも更新する。
