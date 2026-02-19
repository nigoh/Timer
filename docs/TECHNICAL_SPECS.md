# TECHNICAL_SPECS

## 技術スタック


- React 18
- TypeScript 5
- Vite 5
- Zustand 4
- Tailwind CSS + shadcn/ui + Radix UI
- Vitest


## 主要ディレクトリ

- `src/components`: 共通 UI
- `src/features/timer/components`: 機能別 View
- `src/features/timer/containers`: コンテナ（配線）
- `src/features/timer/stores`: ドメイン状態（Zustand）
- `src/features/timer/api`: 外部 API クライアント（GitHub 連携）
- `src/features/timer/utils`: 機能ユーティリティ（Issue別集計ロジックなど）
- `src/types`: ドメイン型
- `src/utils`: 通知/ログユーティリティ


## 状態管理方針

- ドメイン状態は `src/features/timer/stores` に集約する。
- ストアは State と Actions を interface で公開する。
- ストア参照は `src/features/timer/stores` を正本とし、`src/stores` の互換レイヤーは使用しない。

- UI ローカル状態のみコンポーネントの `useState` を許可する。

## 通知仕様

- `src/utils/notification-manager.ts` を唯一の通知経路とする。

- Web Audio API で合成音を生成し、必要に応じてブラウザ通知を表示する。
- サイレント時は振動 API を優先する。

## ログ仕様


- `src/utils/logger.ts` を唯一のログ経路とする。
- ログは LocalStorage（`timer-app-logs`）に保存する。
- グローバルエラーと Promise rejection を捕捉する。
- ログの追加データは `unknown` として扱い、利用側で型を絞り込む。

## アクセシビリティ仕様

- フォーム入力は `Label` と `id/htmlFor` を必ず関連付ける。
- 視覚的に不要なラベルは `sr-only` を使って支援技術向けに保持する。

## 永続化

- 一部ストアは Zustand `persist` を利用し、LocalStorage に保存する。
- 永続化対象はストアごとに `partialize` で制御する。
- `integration-link-store` は `linksByLogId` のみ永続化し、`githubPat` はメモリ保持（非永続）とする。

## パフォーマンス仕様

- tick 系処理は `isRunning/isAnyRunning` を先に判定し、不要な更新は早期 return する。
- 秒未満の経過では state を更新せず、無駄な再レンダーを抑制する。
