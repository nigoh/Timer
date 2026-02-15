# Timer App

業務効率化を目的としたタイマーアプリケーションです。

## 要件・仕様ドキュメント

本プロジェクトの要件・受け入れ基準・Phase定義の正本は以下です。

- [要件定義（正本）](./docs/REQUIREMENTS.md)
- [非機能要件の検証手順](./docs/NON_FUNCTIONAL_VERIFICATION.md)

参照ドキュメント:

- [機能一覧（参照版）](./docs/FEATURES.md)
- [技術仕様（参照版）](./docs/TECHNICAL_SPECS.md)
- [UX設計仕様](./docs/UX_DESIGN_SPEC.md)
- [概念モデル](./docs/CONCEPTS.md)
- [AI協業ガイド（Copilot運用）](./docs/AI_COLLABORATION_GUIDE.md)

READMEは要約のみを記載し、詳細仕様は正本要件へ集約します。

## 開発コマンド

```bash
npm install
npm run dev
npm run build
npm run build:pages
npm run test
npm run lint
```

## 開発ガイドライン（推奨フロー）

日々の開発は、次の順序で進めると品質と速度のバランスを取りやすくなります。

1. 要件確認
	- 変更が仕様影響を持つかを先に判断する。
	- 仕様影響がある場合は `docs/REQUIREMENTS.md` の更新を同時に計画する。
2. 設計
	- 影響範囲（`components` / `containers` / `stores` / `types` / `utils`）を特定する。
	- UIは既存 `src/components/ui/*` と Radix UI 方針を優先する。
3. 実装
	- ドメイン状態は `src/features/timer/stores` に集約する。
	- 通知/ログは `src/utils/notification-manager.ts` と `src/utils/logger.ts` を経由する。
4. 検証
	- 最低限 `npm run type-check` を実行する。
	- 変更規模に応じて `npm run test`、必要時 `npm run build` を実行する。
5. ドキュメント同期
	- 機能/挙動/技術仕様の変更がある場合、関連 docs を同一変更で更新する。

### Skill選定の目安

- バグ修正: `timer-bug-triage`
- UI/レイアウト: `radix-ui-layout-design` / `ui-design-textbook-guideline`
- UX改善: `ux-flow-and-usability`
- テスト計画: `timer-testing-strategy`
- a11y改善: `accessibility-audit-radix`
- 性能改善: `performance-and-render-budget`
- 永続化変更: `state-migration-and-persistence`
- 障害対応: `incident-runbook-observability`
- マージ前確認: `release-regression-gate`
- docs同期: `timer-spec-sync`

詳細ルールは `docs/AI_COLLABORATION_GUIDE.md` を参照してください。

## Agent Skills

このリポジトリでは GitHub Copilot Agent Skills をプロジェクト内で管理しています。

- 配置先: `./.github/skills/`
- バグ解析: `./.github/skills/timer-bug-triage/SKILL.md`
- 仕様同期: `./.github/skills/timer-spec-sync/SKILL.md`
- Radix UIデザイン: `./.github/skills/radix-ui-layout-design/SKILL.md`
- 教科書的UIデザインガイド: `./.github/skills/ui-design-textbook-guideline/SKILL.md`
- UXフロー/可用性改善: `./.github/skills/ux-flow-and-usability/SKILL.md`
- テスト戦略: `./.github/skills/timer-testing-strategy/SKILL.md`
- アクセシビリティ監査: `./.github/skills/accessibility-audit-radix/SKILL.md`
- リリース回帰ゲート: `./.github/skills/release-regression-gate/SKILL.md`
- パフォーマンス最適化: `./.github/skills/performance-and-render-budget/SKILL.md`
- 状態移行/永続化: `./.github/skills/state-migration-and-persistence/SKILL.md`
- 障害対応ランブック/観測性: `./.github/skills/incident-runbook-observability/SKILL.md`

利用時は、依頼文に対象スキルの目的（例: 「Radix UI準拠でレイアウト改善」）を明示すると、エージェントがスキルを選択しやすくなります。

## GitHub Pages 公開

- このリポジトリには GitHub Pages 自動デプロイ用 Workflow を追加済みです: `.github/workflows/deploy-pages.yml`
- `main` ブランチへ push すると、`npm run build:pages` でビルドして `dist` を Pages に公開します
- 初回のみ GitHub リポジトリ設定で Pages の Build and deployment を `GitHub Actions` にしてください

## Codex MCP 設定

Codex で MCP (Model Context Protocol) を利用するため、Playwright サーバーを追加しています。

- 設定ファイル: `.codex/config.toml`
- 追加サーバー: `playwright`
- 実行コマンド: `npx -y @playwright/mcp@latest`

Codex 起動時に上記設定が読み込まれると、ブラウザの操作・検査を MCP ツールとして利用できます。
