# Technology Stack

## Architecture

SPA（Single Page Application）。React 18 + TypeScript 5 + Vite 6 で構築。
サーバーレスでブラウザ完結型。状態管理は Zustand 4 に集約し、永続化は localStorage（Zustand persist）。
GitHub Pages にデプロイ可能。

## Core Technologies

- **Language**: TypeScript 5（strict mode）
- **Framework**: React 18（Functional Components + Hooks）
- **Build Tool**: Vite 6
- **Runtime**: ブラウザ（Node.js は開発ツールチェーンのみ）

## Key Libraries

| Library                                 | Purpose                              |
| --------------------------------------- | ------------------------------------ |
| Zustand 4                               | 状態管理（persist で永続化）         |
| Radix UI + shadcn/ui (new-york)         | UI プリミティブ / テーマ             |
| Tailwind CSS                            | ユーティリティファーストスタイリング |
| react-hook-form + zod                   | フォームバリデーション               |
| Recharts v3                             | 分析ダッシュボードのチャート         |
| @dnd-kit                                | ドラッグ＆ドロップ（タスク並べ替え） |
| Sonner                                  | トースト通知                         |
| cmdk                                    | コマンドパレット                     |
| @langchain/openai, @langchain/anthropic | AI アシスト（オプション）            |
| Quill                                   | リッチテキスト議事録エディタ         |

## Development Standards

### Type Safety
- TypeScript strict mode 必須
- `any` 禁止。union / type guard で代替
- ドメイン型は `src/types/` を正本、重複定義禁止
- ストアは State / Actions を interface で明示

### Code Quality
- ESLint（`eslint.config.cjs`）
- Prettier 統合
- 未使用 import / 未使用 state の残置禁止

### Testing
- **Framework**: Vitest
- **E2E**: Playwright（`tests/`）
- **テスト配置**: `src/**/__tests__/` に colocate
- 品質ゲート: `npm run type-check` → `npm run test:run` → `npm run build`

## Development Environment

### Required Tools
- Node.js 20+
- npm

### Common Commands
```bash
npm run dev          # 開発サーバー起動（port 3000）
npm run type-check   # TypeScript 型チェック（必須）
npm run test:run     # テスト一発実行
npm run test         # テスト ウォッチモード
npm run lint         # ESLint
npm run lint:fix     # ESLint 自動修正
npm run build        # 本番ビルド
npm run build:pages  # GitHub Pages 用ビルド
```

## Key Technical Decisions

- **ブラウザ完結型**: サーバーレス。外部 API（OpenAI / Anthropic）はオプション
- **Zustand persist**: ドメイン状態の永続化に localStorage を使用。partialize で必要なフィールドのみ保存
- **Web Speech API**: 音声文字起こしにブラウザ内蔵 API を使用。外部 API キー不要
- **AI フォールバック**: AI API 未設定・失敗時はルールベース処理へフォールバック
- **API キー非永続化**: AI プロバイダの API キーはメモリ保持のみ（セキュリティ方針）
- **Tick 処理最適化**: 1 秒 tick は store 側で最小演算。秒未満更新を抑制
- **通知一元化**: `notification-manager.ts` が Web Audio API + ブラウザ通知を管理
- **ログ一元化**: `logger.ts` が LocalStorage `focuso-logs` に集約

---
_Document standards and patterns, not every dependency_
_updated_at: 2026-02-27_
