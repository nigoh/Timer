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
