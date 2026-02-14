<!--
Sync Impact Report
- Version change: none → 1.0.0
- Modified principles: N/A (initial ratification)
- Added sections: Core Principles (Code Quality, Testing Standards, UX Consistency, Performance Requirements, Observability & Logging),
	Technology & Constraints, Development Workflow & Quality Gates, Governance
- Removed sections: None
- Templates requiring updates:
	- .specify/templates/plan-template.md → ✅ aligned (uses Constitution Check gate)
	- .specify/templates/spec-template.md → ✅ aligned
	- .specify/templates/tasks-template.md → ✅ aligned
- Follow-up TODOs: None
-->

# Timer App Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)
- Source of truth: TypeScript strict typing、ESLint（@typescript-eslint）とプロジェクト規約に準拠。
- アーキテクチャ: Feature-first 構成（src/features/{Feature}/...）。コンポーネントは原則100行以内に分割し、index.tsで集約。
- 状態管理: Zustand 5 に統一。propsバケツリレーやコンポーネント内でのAPI直呼びは禁止。副作用はhooks/storesへ集約。
- 定数/型: constants/ に一元化し重複定義を禁止。公開型は明示的にexportし、破壊的変更はPRで周知。
- スタイル: デザイントークンを使用。ハードコード値は禁止。アクセシビリティを常に考慮。
Rationale: 可読性と変更容易性を最大化し、予測可能なレビュー/保守コストを実現する。

### II. Testing Standards (NON-NEGOTIABLE)
- テスト基盤: Vitest。公開関数/ストアのAPIには最小単位テスト（ハッピーパス+境界1〜2件）を付与。
- ゲート: build/lint/type-check/test/spec-kit-check は常にPASS。落ちたままのマージは禁止。
- 実務フロー: 重要な変更はRed-Green-Refactorを推奨。回帰バグは必ずテスト追加で防止。
- 依存の少ないテスト: Zustandはselectorで最小スライスを検証。UIはロジックをhooksへ分離してテスト容易化。
Rationale: 壊れにくさと将来の拡張速度を両立し、変更の“安全網”を提供する。

### III. UX Consistency (NON-NEGOTIABLE)
- UIスタック: shadcn/ui（Radix UI + Tailwind CSS）。layout_rule.instructions.mdと`.github/copilot-instructions.md`を厳守。
- レイアウト: FeatureLayout/FeatureHeader/FeatureContent を必須使用。maxWidth={false} を基本。レスポンシブ（xs〜）は必須。
- 互換/一貫性: デザイントークン、統一スクロール、アクセシビリティ（WCAG 2.1 AA）を遵守。ボタン/ダイアログ/タブ等は統一パターン。
- タイマーUX: 1タップ開始、進捗バー＋％、超過>100%表記、色相（緑→橙→赤→紫）を維持。
Rationale: 学習コストを最小化し、どの画面でも同じ体験品質を保証する。

### IV. Performance Requirements
- レンダリング: 一般操作は16ms以下（60fps）を目安。重い再レンダリングはuseCallback/memo/selectorで抑制。
- 精度/同期: タイマー誤差を最小化（背景復帰時の再計算）。通知/音は遅延や重複を防止。
- メモリ: 高使用率（>90%）を警告ログ化。メモリリークを作らない（リスナー/タイマーの確実な解除）。
- 最適化: 遅延ロード、バンドル最適化、Zustand selectorでの細粒度購読を徹底。
Rationale: 快速な応答が体感品質と集中維持に直結するため。

### V. Observability & Logging
- ロギング: src/utils/logger.ts を使用。LogLevel: ERROR/WARN/INFO/DEBUG/TRACE。カテゴリ: timer/ui/store/notification/performance/api/app/error。
- エラーハンドリング: エラーバウンダリーを主要タブに適用。ユーザー向けフォールバックを備える。
- パフォーマンス監視: レンダリング時間・メモリ監視のログ化。個人情報は記録しない。
Rationale: 問題の早期検知とデータ駆動の改善を可能にする。

## Technology & Constraints
- Stack: React 19、TypeScript 5、Vite 6、Zustand 5、shadcn/ui（Radix+Tailwind）、Dexie（IndexedDB）。
- ブラウザ/OS: モダンブラウザ最新2世代を対象。モバイル動作品質を重視。
- 通知/音: Web Notification API、Web Audio API。バックグラウンド復帰時の誤差再計算を必須。
- ディレクトリ構成: `.github/copilot-instructions.md` に従う（features配下の統一構造）。
- 禁止事項: コンポーネント内API直呼び、状態管理の混在（Zustand以外）、無断のハードコードスタイル。

## Development Workflow & Quality Gates
- ブランチ: feat/*, fix/*, chore/*, docs/*, refactor/*。Conventional Commits を採用。
- PR: テンプレ必須。影響範囲/スクショ/テスト/確認手順を記載。レビューは品質ゲートPASS後に完了可能。
- ゲート（必須）: build、lint、type-check、test、spec-kit-check を全てPASS。
- Spec Kit: /speckit.constitution → /speckit.specify → /speckit.plan → /speckit.tasks → /speckit.implement の順で生成物をdocs/に反映。

## Governance
- 権限: 本Constitutionは実装判断の最上位ガイド。競合時はConstitution > 個別仕様 > 実装。
- 改定: 変更はPRで提案し、バージョン更新・根拠・影響を明記。破壊的な方針変更はMAJOR、追加/強化はMINOR、表現調整はPATCHでバージョン更新。
- 準拠確認: PRレビューでConstitution Checkを行い、違反は明示的な例外理由を記録（計画/タスクに追記）。
- 伝播: 変更はテンプレート/README/関連ガイドへ即時反映。Spec Kitの「Constitution Check」項目も更新。

**Version**: 1.0.0 | **Ratified**: 2025-10-26 | **Last Amended**: 2025-10-26
